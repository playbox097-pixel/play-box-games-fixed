// sound.js - simple shared sound & music manager for Game Hub

class SoundManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.enabled = true;
    this.musicTimer = null;
    this.currentTrack = null;
    this.muted = false;
  }

  _safeContext() {
    if (!this.enabled || this.muted) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8; // boost overall headroom

      // Split into music + SFX so music can be louder without making SFX too harsh
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.8; // louder background music
      this.sfxGain.gain.value = 0.5;  // keep SFX strong but not painful

      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      // Resume after a user gesture
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _beep({ freq = 440, duration = 0.12, type = 'square', volume = 0.3, bus = 'sfx' }) {
    const ctx = this._safeContext();
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    const end = now + duration;
    gain.gain.value = volume;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    osc.connect(gain);
    const target = bus === 'music' && this.musicGain ? this.musicGain : (this.sfxGain || this.master);
    gain.connect(target);
    osc.start(now);
    osc.stop(end + 0.02);
  }

  playClick() {
    this._beep({ freq: 520, duration: 0.08, volume: 0.18 });
  }

  playMove() {
    this._beep({ freq: 340, duration: 0.06, volume: 0.16 });
  }

  playScore() {
    this._beep({ freq: 760, duration: 0.14, type: 'triangle', volume: 0.22 });
  }

  playLose() {
    this._beep({ freq: 220, duration: 0.18, type: 'sawtooth', volume: 0.22 });
  }

  playGameOver() {
    this._beep({ freq: 180, duration: 0.22, type: 'sawtooth', volume: 0.24 });
    setTimeout(() => this._beep({ freq: 120, duration: 0.26, type: 'sawtooth', volume: 0.22 }), 90);
  }

  playWin() {
    const ctx = this._safeContext();
    if (!ctx) return;
    // small ascending chime
    [660, 880, 990].forEach((f, i) => {
      setTimeout(() => {
        this._beep({ freq: f, duration: 0.15, type: 'triangle', volume: 0.26 });
      }, i * 110);
    });
  }

  startMusic(track = 'default') {
    const ctx = this._safeContext();
    if (!ctx) return;

    // avoid restarting the same track over and over
    if (this.currentTrack === track && this.musicTimer) return;

    this.stopMusic();
    this.currentTrack = track;

    let step = 0;

    const playStep = () => {
      const t = this.currentTrack;
      // choose a different, longer pattern per game so it feels less repetitive
      if (t === 'snake') {
        const pattern = [392, 370, 349, 330, 349, 370, 392, 415];
        const base = pattern[step % pattern.length];
        this._beep({ freq: base, duration: 0.4, type: 'triangle', volume: 0.5, bus: 'music' });
        if (step % 2 === 0) {
          this._beep({ freq: base * 2, duration: 0.14, type: 'square', volume: 0.28, bus: 'music' });
        }
      } else if (t === 'tetris') {
        const pattern = [523, 659, 784, 659, 587, 659, 784, 880];
        const base = pattern[step % pattern.length];
        this._beep({ freq: base, duration: 0.3, type: 'square', volume: 0.48, bus: 'music' });
        this._beep({ freq: base * 0.75, duration: 0.3, type: 'triangle', volume: 0.34, bus: 'music' });
      } else if (t === 'breakout') {
        const pattern = [440, 494, 523, 587, 659, 698, 740, 698];
        const base = pattern[step % pattern.length];
        this._beep({ freq: base, duration: 0.22, type: 'sawtooth', volume: 0.45, bus: 'music' });
        if (step % 3 === 0) {
          this._beep({ freq: base * 1.33, duration: 0.18, type: 'square', volume: 0.28, bus: 'music' });
        }
      } else if (t === 'rock-paper-scissors') {
        const pattern = [392, 494, 392, 330, 392, 494, 523, 494];
        const base = pattern[step % pattern.length];
        this._beep({ freq: base, duration: 0.32, type: 'triangle', volume: 0.45, bus: 'music' });
        setTimeout(() => {
          this._beep({ freq: base * 1.5, duration: 0.2, type: 'sine', volume: 0.3, bus: 'music' });
        }, 220);
      } else if (t === 'rps-multiplayer') {
        const pattern = [330, 392, 440, 392, 349, 392, 440, 392];
        const base = pattern[step % pattern.length];
        this._beep({ freq: base, duration: 0.3, type: 'square', volume: 0.4, bus: 'music' });
      } else if (t === 'tic-tac-toe') {
        const pattern = [523, 587, 523, 659, 587, 659, 523, 494];
        const base = pattern[step % pattern.length];
        this._beep({ freq: base, duration: 0.45, type: 'triangle', volume: 0.45, bus: 'music' });
        this._beep({ freq: base * 0.5, duration: 0.45, type: 'sine', volume: 0.25, bus: 'music' });
      } else if (t === 'number-guess') {
        const pattern = [330, 392, 440, 392, 330, 294, 330, 392];
        const base = pattern[step % pattern.length];
        this._beep({ freq: base, duration: 0.35, type: 'triangle', volume: 0.4, bus: 'music' });
        if (step % 4 === 0) {
          this._beep({ freq: base * 1.5, duration: 0.18, type: 'sine', volume: 0.26, bus: 'music' });
        }
      } else if (t === 'fruit-shooter') {
        // Space shooter: minor, pulsing arpeggio
        const pattern = [440, 523, 392, 523, 440, 587, 392, 659];
        const base = pattern[step % pattern.length];
        this._beep({ freq: base, duration: 0.4, type: 'triangle', volume: 0.42, bus: 'music' });
        if (step % 2 === 0) {
          this._beep({ freq: base * 0.5, duration: 0.5, type: 'sine', volume: 0.22, bus: 'music' });
        }
      } else if (t === 'racer') {
        // Lane Racer: driving, repeating bass line
        const pattern = [196, 220, 247, 220, 196, 262, 294, 262];
        const base = pattern[step % pattern.length];
        this._beep({ freq: base, duration: 0.25, type: 'sawtooth', volume: 0.5, bus: 'music' });
        if (step % 2 === 0) {
          this._beep({ freq: base * 2, duration: 0.12, type: 'square', volume: 0.3, bus: 'music' });
        }
      } else if (t === 'tic-tac-toe-ai') {
        // AI duel: slower, chill pattern
        const pattern = [349, 392, 440, 392, 349, 330, 392, 440];
        const base = pattern[step % pattern.length];
        this._beep({ freq: base, duration: 0.6, type: 'sine', volume: 0.35, bus: 'music' });
        this._beep({ freq: base * 0.75, duration: 0.6, type: 'triangle', volume: 0.22, bus: 'music' });
      } else {
        // default / hub track: longer 8-step loop
        const pattern = [440, 554, 659, 831, 659, 554, 494, 523];
        const base = pattern[step % pattern.length];
        this._beep({ freq: base, duration: 0.45, type: 'triangle', volume: 0.45, bus: 'music' });
        this._beep({ freq: base * 1.5, duration: 0.45, type: 'sine', volume: 0.32, bus: 'music' });
        if (step % 2 === 0) {
          setTimeout(() => {
            this._beep({ freq: base * 2, duration: 0.25, type: 'square', volume: 0.26, bus: 'music' });
          }, 260);
        }
      }
      step++;
    };

    // kick off immediately, then loop a bit slower so the pattern feels longer
    playStep();
    this.musicTimer = setInterval(playStep, 1100);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentTrack = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    }
  }
}

export const sound = new SoundManager();
