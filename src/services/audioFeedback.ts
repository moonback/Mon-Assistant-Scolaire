/**
 * AudioFeedback — sons d'interface doux pour UX enfant
 * Génère des tonalités via Web Audio API, sans fichiers externes.
 * Singleton partagé dans toute l'app.
 */

class AudioFeedbackService {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext | null {
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    startOffset = 0,
  ): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.value = freq;

      const t = ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.015);
      gain.gain.linearRampToValueAtTime(0, t + duration);

      osc.start(t);
      osc.stop(t + duration + 0.02);
    } catch {
      // Silent fail — audio non critique pour l'app
    }
  }

  /** Bip doux de début d'écoute — sol → si (180ms) */
  listeningStart(): void {
    this.tone(392, 0.12, 'sine', 0.10);
    this.tone(494, 0.14, 'sine', 0.10, 0.08);
  }

  /** Bip doux de fin d'écoute — si → sol (160ms) */
  listeningEnd(): void {
    this.tone(494, 0.10, 'sine', 0.08);
    this.tone(392, 0.13, 'sine', 0.08, 0.07);
  }

  /** Carillon de félicitation — do–mi–sol–do (400ms) */
  celebrate(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      this.tone(f, 0.22, 'triangle', 0.13, i * 0.09),
    );
  }

  /** Note courte d'encouragement — la → do (240ms) */
  encourage(): void {
    this.tone(440, 0.12, 'sine', 0.09);
    this.tone(523.25, 0.18, 'sine', 0.09, 0.10);
  }

  /** Bip d'erreur doux — ré grave (280ms) */
  softError(): void {
    this.tone(220, 0.28, 'sine', 0.07);
  }
}

export const audioFeedback = new AudioFeedbackService();
