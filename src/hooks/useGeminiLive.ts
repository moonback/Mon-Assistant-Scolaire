import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

export type LiveStatus = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

export type LiveMessage = {
    role: 'user' | 'model';
    text: string;
    isStreaming?: boolean;
};

interface UseGeminiLiveReturn {
    status: LiveStatus;
    messages: LiveMessage[];
    errorMessage: string;
    latency: number;
    connect: (systemPrompt: string) => void;
    disconnect: () => void;
    setOnConversationFinished: (cb: (userText: string, modelText: string) => void) => void;
}

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

// ── Audio helpers ────────────────────────────────────────────────────────────

function float32ToPCM16Base64(floatArr: Float32Array): string {
    const buf = new ArrayBuffer(floatArr.length * 2);
    const view = new DataView(buf);
    for (let i = 0; i < floatArr.length; i++) {
        const s = Math.max(-1, Math.min(1, floatArr[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function base64ToPCMFloat32(
    b64: string,
    sampleRate: number,
    onBuffer: (buf: AudioBuffer, ctx: AudioContext) => void,
    audioCtx: AudioContext,
) {
    const binary = atob(b64);
    const buf = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
    const pcm16 = new Int16Array(buf);
    const audioBuffer = audioCtx.createBuffer(1, pcm16.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
    }
    onBuffer(audioBuffer, audioCtx);
}

export function useGeminiLive(): UseGeminiLiveReturn {
    const [status, setStatus] = useState<LiveStatus>('idle');
    const [messages, setMessages] = useState<LiveMessage[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [latency, setLatency] = useState(0);

    const sessionRef = useRef<any>(null);
    const inputAudioCtxRef = useRef<AudioContext | null>(null);
    const outputAudioCtxRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextPlayTimeRef = useRef(0);
    const lastUserAudioTimeRef = useRef<number>(0);
    const isAliveRef = useRef(false);

    // FIX: éviter setStatus('speaking') sur chaque chunk PCM
    const isSpeakingRef = useRef(false);
    // FIX: attendre la fin du buffer audio avant de repasser en listening
    const turnCompleteRef = useRef(false);

    // Suivi de la conversation pour persistance
    const currentUserTextRef = useRef('');
    const currentModelTextRef = useRef('');
    const onConversationFinishedRef = useRef<((u: string, m: string) => void) | null>(null);

    // ── Playback ──────────────────────────────────────────────────────────
    const schedulePlay = useCallback((audioBuffer: AudioBuffer, ctx: AudioContext) => {
        if (!isAliveRef.current) return;

        // FIX: ne déclencher 'speaking' qu'une seule fois par tour, pas à chaque chunk
        if (!isSpeakingRef.current) {
            isSpeakingRef.current = true;
            setStatus('speaking');
            if (lastUserAudioTimeRef.current > 0) {
                const currentLatency = Date.now() - lastUserAudioTimeRef.current;
                if (currentLatency < 5000) setLatency(currentLatency);
                lastUserAudioTimeRef.current = 0;
            }
        }

        const now = ctx.currentTime;
        const startAt = Math.max(now, nextPlayTimeRef.current);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        audioSourcesRef.current.add(source);
        source.start(startAt);
        nextPlayTimeRef.current = startAt + audioBuffer.duration;

        source.onended = () => {
            audioSourcesRef.current.delete(source);
            // FIX: transition vers listening uniquement quand TOUT le buffer est drainé
            // et que le serveur a confirmé la fin du tour
            if (
                isAliveRef.current &&
                audioSourcesRef.current.size === 0 &&
                nextPlayTimeRef.current <= ctx.currentTime + 0.15 &&
                turnCompleteRef.current
            ) {
                isSpeakingRef.current = false;
                turnCompleteRef.current = false;
                setStatus('listening');
            }
        };
    }, []);

    // ── Cleanup ───────────────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        isAliveRef.current = false;
        isSpeakingRef.current = false;
        turnCompleteRef.current = false;

        audioSourcesRef.current.forEach(source => {
            try { source.stop(); source.disconnect(); } catch { }
        });
        audioSourcesRef.current.clear();

        workletNodeRef.current?.disconnect();
        workletNodeRef.current = null;

        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        inputAudioCtxRef.current?.close().catch(() => { });
        outputAudioCtxRef.current?.close().catch(() => { });
        inputAudioCtxRef.current = null;
        outputAudioCtxRef.current = null;

        sessionRef.current?.close?.();
        sessionRef.current = null;

        nextPlayTimeRef.current = 0;
        lastUserAudioTimeRef.current = 0;
    }, []);

    const disconnect = useCallback(() => {
        cleanup();
        setStatus('idle');
        setMessages([]);
        setErrorMessage('');
        setLatency(0);
    }, [cleanup]);

    // ── Connect ───────────────────────────────────────────────────────────
    const connect = useCallback((systemPrompt: string) => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            setStatus('error');
            setErrorMessage('Clé VITE_GEMINI_API_KEY manquante dans .env');
            return;
        }

        cleanup();
        isAliveRef.current = true;
        setStatus('connecting');
        setMessages([]);
        setErrorMessage('');
        nextPlayTimeRef.current = 0;

        const ai = new GoogleGenAI({ apiKey });

        ai.live.connect({
            model: LIVE_MODEL,
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: systemPrompt,
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } }
                }
            },
            callbacks: {
                onopen: async () => {
                    if (!isAliveRef.current) return;
                    console.log('[GeminiLive] Session ouverte ✓');

                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                        if (!isAliveRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
                        streamRef.current = stream;

                        const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
                        const outputAudioCtx = new AudioContext({ sampleRate: 24000 });

                        await Promise.all([inputAudioCtx.resume(), outputAudioCtx.resume()]);

                        inputAudioCtxRef.current = inputAudioCtx;
                        outputAudioCtxRef.current = outputAudioCtx;

                        const WORKLET = `
              class MicCapture extends AudioWorkletProcessor {
                constructor() {
                  super();
                  this.buffer = new Float32Array(1024);
                  this.pos = 0;
                }
                process(inputs) {
                  const ch = inputs[0]?.[0];
                  if (ch && ch.length > 0) {
                    for (let i = 0; i < ch.length; i++) {
                      this.buffer[this.pos++] = ch[i];
                      if (this.pos >= this.buffer.length) {
                        this.port.postMessage(this.buffer.slice());
                        this.pos = 0;
                      }
                    }
                  }
                  return true;
                }
              }
              registerProcessor('mic-capture', MicCapture);
            `;
                        const blob = new Blob([WORKLET], { type: 'application/javascript' });
                        const workletUrl = URL.createObjectURL(blob);

                        inputAudioCtx.audioWorklet.addModule(workletUrl).then(() => {
                            URL.revokeObjectURL(workletUrl);
                            if (!isAliveRef.current) return;

                            const source = inputAudioCtx.createMediaStreamSource(stream);
                            const worklet = new AudioWorkletNode(inputAudioCtx, 'mic-capture');
                            workletNodeRef.current = worklet;

                            worklet.port.onmessage = (e: MessageEvent<Float32Array>) => {
                                if (!isAliveRef.current || !sessionRef.current) return;

                                const inputData = e.data;
                                let sum = 0;
                                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                                const rms = Math.sqrt(sum / inputData.length);
                                if (rms > 0.01) lastUserAudioTimeRef.current = Date.now();

                                const b64 = float32ToPCM16Base64(inputData);
                                sessionRef.current.sendRealtimeInput({
                                    audio: { data: b64, mimeType: 'audio/pcm;rate=16000' }
                                });
                            };

                            source.connect(worklet);
                            setStatus('listening');
                        }).catch(err => {
                            console.error('[GeminiLive] Worklet error:', err);
                            setStatus('error');
                            setErrorMessage("Le micro n'a pas pu démarrer. Vérifie les permissions.");
                        });
                    } catch (err) {
                        console.error('[GeminiLive] Media access error:', err);
                        setStatus('error');
                        setErrorMessage("Je n'arrive pas à accéder au micro. Vérifie les permissions.");
                        cleanup();
                    }
                },

                onmessage: (message: any) => {
                    if (!isAliveRef.current) return;

                    // Interruption — arrêt immédiat de la lecture en cours
                    if (message.serverContent?.interrupted) {
                        isSpeakingRef.current = false;
                        turnCompleteRef.current = false;
                        nextPlayTimeRef.current = 0;
                        audioSourcesRef.current.forEach(s => { try { s.stop(); } catch { } });
                        audioSourcesRef.current.clear();
                        setStatus('listening');
                    }

                    // Transcription utilisateur reçue → l'IA va répondre
                    const inputText = message.serverContent?.inputTranscription?.text;
                    if (inputText) {
                        currentUserTextRef.current += inputText;
                        // Passer en "processing" : l'IA réfléchit, feedback immédiat pour l'enfant
                        setStatus('processing');
                        setMessages(prev => {
                            const last = prev[prev.length - 1];
                            if (last && last.role === 'user') {
                                return [...prev.slice(0, -1), { ...last, text: last.text + inputText + ' ' }];
                            }
                            return [...prev, { role: 'user', text: inputText + ' ' }];
                        });
                    }

                    // Réponse du modèle (texte + chunks audio)
                    const parts: any[] = message.serverContent?.modelTurn?.parts || [];
                    parts.forEach((part: any) => {
                        if (part.text) {
                            currentModelTextRef.current += part.text;
                            setMessages(prev => {
                                const last = prev[prev.length - 1];
                                if (last && last.role === 'model' && last.isStreaming) {
                                    return [...prev.slice(0, -1), { ...last, text: last.text + part.text }];
                                }
                                return [...prev, { role: 'model', text: part.text, isStreaming: true }];
                            });
                        }
                        if (part.inlineData?.data && outputAudioCtxRef.current) {
                            base64ToPCMFloat32(
                                part.inlineData.data,
                                24000,
                                schedulePlay,
                                outputAudioCtxRef.current,
                            );
                        }
                    });

                    // Fin du tour serveur
                    if (message.serverContent?.turnComplete) {
                        turnCompleteRef.current = true;

                        // Marquer le dernier message comme non-streaming
                        setMessages(prev => {
                            const last = prev[prev.length - 1];
                            if (last && last.role === 'model' && last.isStreaming) {
                                return [...prev.slice(0, -1), { ...last, isStreaming: false }];
                            }
                            return prev;
                        });

                        // Persistance de la conversation
                        if (currentUserTextRef.current && currentModelTextRef.current) {
                            onConversationFinishedRef.current?.(
                                currentUserTextRef.current.trim(),
                                currentModelTextRef.current.trim(),
                            );
                        }
                        currentUserTextRef.current = '';
                        currentModelTextRef.current = '';

                        // FIX: Si aucun audio n'est en cours de lecture → transition immédiate
                        // Sinon, source.onended gère la transition une fois tout le buffer drainé
                        if (audioSourcesRef.current.size === 0 && !isSpeakingRef.current) {
                            turnCompleteRef.current = false;
                            setStatus('listening');
                        }
                    }
                },

                onerror: (e: any) => {
                    console.error('[GeminiLive] Websocket error:', e);
                    setStatus('error');
                    setErrorMessage("Oups ! La connexion a été interrompue.");
                    cleanup();
                },

                onclose: () => {
                    if (isAliveRef.current) {
                        setStatus('idle');
                        isAliveRef.current = false;
                    }
                }
            }
        }).then(session => {
            if (!isAliveRef.current) { session.close(); return; }
            sessionRef.current = session;
        }).catch(err => {
            console.error('[GeminiLive] Connection error:', err);
            setStatus('error');
            setErrorMessage(`Connexion impossible. Vérifie ta connexion internet.`);
            cleanup();
        });

    }, [cleanup, schedulePlay]);

    const setOnConversationFinished = useCallback((cb: (userText: string, modelText: string) => void) => {
        onConversationFinishedRef.current = cb;
    }, []);

    useEffect(() => () => cleanup(), [cleanup]);

    return useMemo(() => ({
        status,
        messages,
        errorMessage,
        latency,
        connect,
        disconnect,
        setOnConversationFinished
    }), [status, messages, errorMessage, latency, connect, disconnect, setOnConversationFinished]);
}
