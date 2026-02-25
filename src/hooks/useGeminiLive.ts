import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

export type LiveStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

interface UseGeminiLiveReturn {
    status: LiveStatus;
    aiTranscript: string;
    userTranscript: string;
    errorMessage: string;
    connect: (systemPrompt: string) => void;
    disconnect: () => void;
}

// Use the latest native audio model
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-latest';

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

function base64ToPCMFloat32(b64: string, sampleRate: number, onBuffer: (buf: AudioBuffer, ctx: AudioContext) => void, audioCtx: AudioContext) {
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
    const [aiTranscript, setAiTranscript] = useState('');
    const [userTranscript, setUserTranscript] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const sessionRef = useRef<any>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const playQueueRef = useRef<AudioBuffer[]>([]);
    const isPlayingRef = useRef(false);
    const isAliveRef = useRef(false);
    // Track next scheduled playback time for seamless audio
    const nextPlayTimeRef = useRef(0);

    // ── Playback ──────────────────────────────────────────────────────────
    const schedulePlay = useCallback((audioBuffer: AudioBuffer, ctx: AudioContext) => {
        if (!isAliveRef.current) return;
        setStatus('speaking');

        const now = ctx.currentTime;
        const startAt = Math.max(now, nextPlayTimeRef.current);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start(startAt);
        nextPlayTimeRef.current = startAt + audioBuffer.duration;

        source.onended = () => {
            if (isAliveRef.current && nextPlayTimeRef.current <= ctx.currentTime + 0.05) {
                isPlayingRef.current = false;
                setStatus('listening');
            }
        };
    }, []);

    // ── Cleanup ───────────────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        isAliveRef.current = false;
        workletNodeRef.current?.disconnect();
        workletNodeRef.current = null;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        audioCtxRef.current?.close().catch(() => { });
        audioCtxRef.current = null;
        sessionRef.current?.close?.();
        sessionRef.current = null;
        playQueueRef.current = [];
        isPlayingRef.current = false;
        nextPlayTimeRef.current = 0;
    }, []);

    const disconnect = useCallback(() => {
        cleanup();
        setStatus('idle');
        setAiTranscript('');
        setUserTranscript('');
        setErrorMessage('');
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
        setAiTranscript('');
        setUserTranscript('');
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
                onopen: () => {
                    if (!isAliveRef.current) return;
                    console.log('[GeminiLive] Connecté ✓');

                    // Open mic AFTER the session is established
                    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                        .then(stream => {
                            if (!isAliveRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
                            streamRef.current = stream;

                            const audioCtx = new AudioContext({ sampleRate: 16000 });
                            audioCtxRef.current = audioCtx;

                            // AudioWorklet processor inline
                            const WORKLET = `
                class MicCapture extends AudioWorkletProcessor {
                  process(inputs) {
                    const ch = inputs[0]?.[0];
                    if (ch && ch.length > 0) this.port.postMessage(ch.slice());
                    return true;
                  }
                }
                registerProcessor('mic-capture', MicCapture);
              `;
                            const blob = new Blob([WORKLET], { type: 'application/javascript' });
                            const workletUrl = URL.createObjectURL(blob);

                            audioCtx.audioWorklet.addModule(workletUrl).then(() => {
                                URL.revokeObjectURL(workletUrl);
                                if (!isAliveRef.current) return;

                                const source = audioCtx.createMediaStreamSource(stream);
                                const worklet = new AudioWorkletNode(audioCtx, 'mic-capture');
                                workletNodeRef.current = worklet;

                                worklet.port.onmessage = (e: MessageEvent<Float32Array>) => {
                                    if (!isAliveRef.current || !sessionRef.current) return;
                                    const b64 = float32ToPCM16Base64(e.data);
                                    sessionRef.current.sendRealtimeInput({
                                        audio: { data: b64, mimeType: 'audio/pcm;rate=16000' }
                                    });
                                };

                                source.connect(worklet);
                                setStatus('listening');
                                console.log('[GeminiLive] Micro actif ✓');
                            }).catch(err => {
                                console.warn('[GeminiLive] AudioWorklet non disponible, fallback ScriptProcessor:', err);
                                if (!isAliveRef.current) return;
                                const source = audioCtx.createMediaStreamSource(stream);
                                // @ts-ignore — deprecated but functional fallback
                                const processor = audioCtx.createScriptProcessor(4096, 1, 1);
                                processor.onaudioprocess = (ev: AudioProcessingEvent) => {
                                    if (!isAliveRef.current || !sessionRef.current) return;
                                    const b64 = float32ToPCM16Base64(ev.inputBuffer.getChannelData(0));
                                    sessionRef.current.sendRealtimeInput({
                                        audio: { data: b64, mimeType: 'audio/pcm;rate=16000' }
                                    });
                                };
                                source.connect(processor);
                                processor.connect(audioCtx.destination);
                                setStatus('listening');
                            });
                        })
                        .catch(err => {
                            console.error('[GeminiLive] Micro refusé:', err);
                            setStatus('error');
                            setErrorMessage('Accès micro refusé. Autorise le microphone dans le navigateur.');
                            cleanup();
                        });
                },

                onmessage: (message: any) => {
                    if (!isAliveRef.current) return;

                    // Interruption — vider la file audio
                    if (message.serverContent?.interrupted) {
                        nextPlayTimeRef.current = 0;
                        isPlayingRef.current = false;
                    }

                    // Audio + texte de l'IA
                    const parts: any[] = message.serverContent?.modelTurn?.parts || [];
                    parts.forEach((part: any) => {
                        if (part.text) {
                            setAiTranscript(prev => prev + part.text);
                        }
                        if (part.inlineData?.data && audioCtxRef.current) {
                            base64ToPCMFloat32(part.inlineData.data, 24000, schedulePlay, audioCtxRef.current);
                        }
                    });

                    // Transcription de l'utilisateur
                    const inputText = message.serverContent?.inputTranscription?.text;
                    if (inputText) setUserTranscript(prev => prev + inputText + ' ');

                    // Fin du tour
                    if (message.serverContent?.turnComplete) {
                        setStatus('listening');
                    }
                },

                onerror: (e: any) => {
                    console.error('[GeminiLive] Erreur:', e);
                    setStatus('error');
                    setErrorMessage(`Erreur Gemini Live : ${e?.message || 'connexion échouée'}`);
                    cleanup();
                },

                onclose: (e: any) => {
                    console.log('[GeminiLive] Connexion fermée:', e?.reason);
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
            console.error('[GeminiLive] Connexion échouée:', err);
            setStatus('error');
            setErrorMessage(`Impossible de se connecter à Gemini Live : ${err?.message || 'erreur inconnue'}`);
            cleanup();
        });

    }, [cleanup, schedulePlay]);

    useEffect(() => () => cleanup(), [cleanup]);

    return { status, aiTranscript, userTranscript, errorMessage, connect, disconnect };
}
