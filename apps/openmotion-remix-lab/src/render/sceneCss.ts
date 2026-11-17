export const SCENE_STAGE_CSS = `
html, body { margin: 0; background: #000; }
#om-stage { position: relative; overflow: hidden; background: #000; }
.om-layer { position: absolute; inset: 0; overflow: hidden; }
.om-scene {
  position: absolute; inset: 0; display: flex;
  color: var(--om-fg); background: var(--om-bg);
  font-family: var(--om-body); overflow: hidden;
}
.om-scene h1, .om-scene h2, .om-kicker { font-family: var(--om-heading); }
.om-hero {
  flex-direction: column; align-items: center; justify-content: center;
  gap: 18px; text-align: center; padding: 8%;
}
.om-hero .om-logo { width: 64px; height: 64px; }
.om-headline {
  margin: 0; font-size: 48px; font-weight: 650;
  letter-spacing: -0.04em; line-height: 0.95;
}
.om-sub { margin: 0; max-width: 22em; font-size: 16px; opacity: 0.78; line-height: 1.4; }
.om-split { flex-direction: row; }
.om-split .om-copy {
  flex: 1; display: flex; flex-direction: column; justify-content: center;
  gap: 12px; padding: 8%;
}
.om-split .om-panel {
  flex: 1; background: var(--om-accent); display: flex; align-items: center;
  justify-content: center; font-family: var(--om-heading); font-size: 96px;
  font-weight: 700; color: var(--om-bg); letter-spacing: -0.06em;
}
.om-stack { flex-direction: column; justify-content: center; gap: 14px; padding: 8%; }
.om-card {
  background: color-mix(in srgb, var(--om-fg) 8%, var(--om-bg));
  border: 1px solid color-mix(in srgb, var(--om-fg) 14%, transparent);
  border-radius: 16px; padding: 16px 20px;
}
.om-lower { flex-direction: column; justify-content: flex-end; }
.om-lower .om-wash {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 20% 20%, var(--om-accent), transparent 45%),
    radial-gradient(circle at 80% 70%, var(--om-primary), transparent 40%);
  opacity: 0.55;
}
.om-lower .om-word {
  position: absolute; top: 12%; left: 6%;
  font-family: var(--om-heading); font-size: 110px; font-weight: 700;
  letter-spacing: -0.07em; line-height: 0.85; opacity: 0.16; color: var(--om-fg);
}
.om-bar {
  position: relative; margin: 0 6% 7%; padding: 16px 20px;
  background: var(--om-primary); color: var(--om-bg); border-radius: 14px;
  display: flex; flex-direction: column; gap: 4px;
}
.om-end {
  flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; text-align: center;
}
.om-end .om-logo { width: 72px; height: 72px; }
.om-cta {
  margin-top: 8px; padding: 10px 22px; border-radius: 999px;
  background: var(--om-accent); color: var(--om-bg);
  font-weight: 600; font-size: 14px;
}
.om-kicker {
  font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--om-accent); font-weight: 600;
}
.om-logo svg { width: 100%; height: 100%; display: block; }
`
