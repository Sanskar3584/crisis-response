let audioCtx: AudioContext | null = null;

export function playAlert(): void {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    const ctx = audioCtx;
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const beep = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    };
    beep(880, 0, 0.18);
    beep(660, 0.22, 0.24);
  } catch {
    /* ignore */
  }
}

export function requestNotifPermission(): void {
  try {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

export function desktopNotify(title: string, body: string): void {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch {
    /* ignore */
  }
}
