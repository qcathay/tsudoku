/**
 * audio.js — T 數獨 · Web Audio Engine
 * Phone DTMF keypad tones + game feedback sounds
 */

const Audio = (() => {
  let ctx = null;
  let muted = false;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function makeOsc(frequency, type, startTime, duration, gainPeak, endGain = 0.0001) {
    const ac = getCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(endGain, startTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // DTMF frequency pairs for 1-9, 0
  const DTMF = {
    1: [697, 1209], 2: [697, 1336], 3: [697, 1477],
    4: [770, 1209], 5: [770, 1336], 6: [770, 1477],
    7: [852, 1209], 8: [852, 1336], 9: [852, 1477],
    0: [941, 1336],
  };

  /* ── Phone keypad tone ── */
  function playKey(digit) {
    if (muted) return;
    try {
      const ac = getCtx();
      const t  = ac.currentTime;
      const freqs = DTMF[digit] ?? DTMF[0];
      freqs.forEach(freq => makeOsc(freq, 'sine', t, 0.12, 0.16));
    } catch (e) {}
  }

  /* ── Correct input: rising chime ── */
  function playCorrect() {
    if (muted) return;
    try {
      const ac = getCtx();
      const t  = ac.currentTime;
      // C5 → E5 → G5
      [523.25, 659.25, 784.0].forEach((freq, i) => {
        makeOsc(freq, 'sine', t + i * 0.1, 0.28, 0.22);
      });
    } catch (e) {}
  }

  /* ── Error input: buzzer ── */
  function playError() {
    if (muted) return;
    try {
      const ac = getCtx();
      const t  = ac.currentTime;
      makeOsc(160, 'sawtooth', t,        0.18, 0.2);
      makeOsc(120, 'sawtooth', t + 0.09, 0.18, 0.18);
    } catch (e) {}
  }

  /* ── Win fanfare: triumphant arpeggio ── */
  function playWin() {
    if (muted) return;
    try {
      const ac = getCtx();
      const t  = ac.currentTime;
      // C5 E5 G5 C6 — staccato then hold
      const notes = [523.25, 659.25, 784.0, 1046.5];
      notes.forEach((freq, i) => {
        makeOsc(freq, 'sine',     t + i * 0.13, 0.5,  0.28);
        makeOsc(freq * 2, 'sine', t + i * 0.13, 0.4,  0.06); // overtone shimmer
      });
      // Final chord
      [523.25, 659.25, 784.0].forEach(freq => {
        makeOsc(freq, 'sine', t + 0.65, 1.0, 0.2, 0.0001);
      });
    } catch (e) {}
  }

  /* ── Hint sound: soft ding ── */
  function playHint() {
    if (muted) return;
    try {
      const ac = getCtx();
      const t  = ac.currentTime;
      makeOsc(880,  'sine', t,       0.3, 0.18);
      makeOsc(1320, 'sine', t + 0.1, 0.25, 0.1);
    } catch (e) {}
  }

  /* ── Click/UI sound ── */
  function playClick() {
    if (muted) return;
    try {
      const ac = getCtx();
      const t  = ac.currentTime;
      makeOsc(800, 'sine', t, 0.05, 0.08);
    } catch (e) {}
  }

  function setMuted(val) { muted = val; }
  function isMuted() { return muted; }

  return { playKey, playCorrect, playError, playWin, playHint, playClick, setMuted, isMuted };
})();
