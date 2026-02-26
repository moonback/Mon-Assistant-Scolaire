import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

export type LiveStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

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
}

// Utilisation du modèle spécifié dans l'exemple
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

    // ── Playback ──────────────────────────────────────────────────────────
    const schedulePlay = useCallback((audioBuffer: AudioBuffer, ctx: AudioContext) => {
        if (!isAliveRef.current) return;
        setStatus('speaking');

        // Latency calculation inspired by user example
        if (lastUserAudioTimeRef.current > 0) {
            const currentLatency = Date.now() - lastUserAudioTimeRef.current;
            if (currentLatency < 5000) setLatency(currentLatency);
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
            // Small buffer to detect end of speech
            if (isAliveRef.current && nextPlayTimeRef.current <= ctx.currentTime + 0.1) {
                setStatus('listening');
            }
        };
    }, []);

    // ── Cleanup ───────────────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        isAliveRef.current = false;

        // Stop all active audio sources
        audioSourcesRef.current.forEach(source => {
            try {
                source.stop();
                source.disconnect();
            } catch (e) { }
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
                    // Buffer réduit à 1024 pour diviser la latence par 2 (~64ms)
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

                                // RMS detection for activity tracking (inspiration from example)
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
                            setErrorMessage('Erreur lors de l’initialisation audio.');
                        });
                    } catch (err) {
                        console.error('[GeminiLive] Media access error:', err);
                        setStatus('error');
                        setErrorMessage('Accès micro refusé ou erreur audio.');
                        cleanup();
                    }
                },

                onmessage: (message: any) => {
                    if (!isAliveRef.current) return;

                    if (message.serverContent?.interrupted) {
                        nextPlayTimeRef.current = 0;
                        // Interrupt active playback instantly
                        audioSourcesRef.current.forEach(s => {
                            try { s.stop(); } catch (e) { }
                        });
                        audioSourcesRef.current.clear();
                        setStatus('listening');
                    }

                    // User transcription
                    const inputText = message.serverContent?.inputTranscription?.text;
                    if (inputText) {
                        setMessages(prev => {
                            const last = prev[prev.length - 1];
                            if (last && last.role === 'user') {
                                return [...prev.slice(0, -1), { ...last, text: last.text + inputText + ' ' }];
                            }
                            return [...prev, { role: 'user', text: inputText + ' ' }];
                        });
                    }

                    // Model Turn
                    const parts: any[] = message.serverContent?.modelTurn?.parts || [];
                    parts.forEach((part: any) => {
                        if (part.text) {
                            setMessages(prev => {
                                const last = prev[prev.length - 1];
                                if (last && last.role === 'model' && last.isStreaming) {
                                    return [...prev.slice(0, -1), { ...last, text: last.text + part.text }];
                                }
                                return [...prev, { role: 'model', text: part.text, isStreaming: true }];
                            });
                        }
                        if (part.inlineData?.data && outputAudioCtxRef.current) {
                            base64ToPCMFloat32(part.inlineData.data, 24000, schedulePlay, outputAudioCtxRef.current);
                        }
                    });

                    // End of turn detection
                    if (message.serverContent?.turnComplete) {
                        setStatus('listening');
                        setMessages(prev => {
                            const last = prev[prev.length - 1];
                            if (last && last.role === 'model' && last.isStreaming) {
                                return [...prev.slice(0, -1), { ...last, isStreaming: false }];
                            }
                            return prev;
                        });
                    }
                },

                onerror: (e: any) => {
                    console.error('[GeminiLive] Websocket error:', e);
                    setStatus('error');
                    setErrorMessage(`Erreur Gemini Live : ${e?.message || 'connexion échouée'}`);
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
            setErrorMessage(`Erreur de connexion : ${err?.message || 'inconnue'}`);
            cleanup();
        });

    }, [cleanup, schedulePlay]);

    useEffect(() => () => cleanup(), [cleanup]);

    return { status, messages, errorMessage, latency, connect, disconnect };
}
