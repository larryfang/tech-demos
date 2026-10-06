import type { Motif, StyleId } from "@/lib/types";

export type PaintInput = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  progress: number;
  intensity: number;
  motif: Motif;
  caption: string;
  styleLabel: string;
};

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function motifShift(motif: Motif, time: number, intensity: number) {
  const amp = 18 * intensity;
  switch (motif) {
    case "rise":
      return { x: 0, y: -Math.sin(time * 1.4) * amp, zoom: 1 };
    case "pan":
      return { x: Math.sin(time * 0.8) * amp * 1.6, y: 0, zoom: 1 };
    case "pulse":
      return { x: 0, y: 0, zoom: 1 + Math.sin(time * 2.2) * 0.04 * intensity };
    case "scatter":
      return {
        x: Math.sin(time * 3.1) * amp * 0.35,
        y: Math.cos(time * 2.4) * amp * 0.35,
        zoom: 1,
      };
    case "reveal":
      return { x: 0, y: (1 - Math.min(1, time * 0.35)) * amp * 0.8, zoom: 1 };
  }
}

function fillBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  top: string,
  bottom: string,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function paintCave(input: PaintInput) {
  const { ctx, width, height, time, intensity } = input;
  fillBackground(ctx, width, height, "#1a120c", "#0b0705");

  const flicker = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(time * 9) + 0.15 * hash(time * 20));
  const torch = ctx.createRadialGradient(
    width * 0.22,
    height * 0.78,
    12,
    width * 0.3,
    height * 0.7,
    width * 0.7 * intensity,
  );
  torch.addColorStop(0, `rgba(255, 170, 70, ${0.55 * flicker})`);
  torch.addColorStop(0.45, `rgba(180, 70, 20, ${0.22 * flicker})`);
  torch.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = torch;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(196, 122, 54, 0.85)";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  const ox = width * 0.52 + Math.sin(time * 0.7) * 10 * intensity;
  const oy = height * 0.52 + Math.cos(time * 0.5) * 6 * intensity;
  ctx.beginPath();
  ctx.moveTo(ox - 180, oy + 40);
  ctx.bezierCurveTo(ox - 140, oy - 80, ox - 20, oy - 90, ox + 40, oy - 20);
  ctx.bezierCurveTo(ox + 90, oy + 20, ox + 150, oy + 10, ox + 190, oy + 50);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox - 40, oy - 10);
  ctx.lineTo(ox - 10, oy - 70 + Math.sin(time * 2) * 8 * intensity);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(ox + 150, oy + 20, 16, 10, 0.2, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 7; i += 1) {
    const hx = width * (0.12 + i * 0.08);
    const hy = height * (0.18 + hash(i + 2) * 0.2);
    ctx.fillStyle = `rgba(90, 40, 22, ${0.25 + 0.1 * Math.sin(time + i)})`;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 18, 20, -0.4, 0, Math.PI * 2);
    ctx.fill();
    for (let f = 0; f < 4; f += 1) {
      ctx.beginPath();
      ctx.ellipse(hx - 8 + f * 6, hy - 22, 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = "rgba(230, 180, 90, 0.35)";
  for (let i = 0; i < 40; i += 1) {
    const px = hash(i * 3 + Math.floor(time * 4)) * width;
    const py = hash(i * 7 + 1) * height;
    ctx.fillRect(px, py, 1.5, 1.5);
  }
}

function paintMonet(input: PaintInput) {
  const { ctx, width, height, time, intensity } = input;
  fillBackground(ctx, width, height, "#c9d8e8", "#7fa38a");

  const water = ctx.createLinearGradient(0, height * 0.42, 0, height);
  water.addColorStop(0, "#9ec3c8");
  water.addColorStop(1, "#3f6d6a");
  ctx.fillStyle = water;
  ctx.fillRect(0, height * 0.4, width, height * 0.6);

  ctx.strokeStyle = "rgba(90, 70, 90, 0.55)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(width * 0.18, height * 0.58);
  ctx.quadraticCurveTo(width * 0.5, height * 0.22, width * 0.84, height * 0.56);
  ctx.stroke();
  ctx.lineWidth = 6;
  for (let i = 0; i < 6; i += 1) {
    const x = width * (0.26 + i * 0.1);
    ctx.beginPath();
    ctx.moveTo(x, height * 0.56);
    ctx.lineTo(x, height * 0.38 - (i % 2) * 12);
    ctx.stroke();
  }

  for (let i = 0; i < 90; i += 1) {
    const x =
      hash(i) * width + Math.sin(time * 0.8 + i) * 10 * intensity;
    const y = height * 0.48 + hash(i + 4) * height * 0.46;
    const hue = 200 + hash(i + 9) * 80;
    ctx.fillStyle = `hsla(${hue}, 42%, ${60 + hash(i + 2) * 20}%, 0.55)`;
    ctx.beginPath();
    ctx.ellipse(x, y, 10 + hash(i + 1) * 14, 5, hash(i) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 10; i += 1) {
    const x = width * (0.12 + i * 0.08) + Math.sin(time * 0.6 + i) * 16 * intensity;
    const y = height * (0.62 + (i % 3) * 0.08);
    ctx.fillStyle = "rgba(70, 120, 80, 0.75)";
    ctx.beginPath();
    ctx.ellipse(x, y, 28, 10, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsla(${300 + i * 8}, 50%, 72%, 0.9)`;
    ctx.beginPath();
    ctx.arc(x + 4, y - 4, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintUkiyo(input: PaintInput) {
  const { ctx, width, height, time, intensity } = input;
  fillBackground(ctx, width, height, "#f3e6c8", "#d8c49a");

  ctx.fillStyle = "#1d3a6e";
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  for (let x = 0; x <= width; x += 8) {
    const y =
      height * 0.62 +
      Math.sin(x * 0.012 + time * 1.4) * 36 * intensity +
      Math.sin(x * 0.03 - time) * 16;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f4f1e8";
  for (let i = 0; i < 18; i += 1) {
    const x = width * (0.08 + i * 0.05);
    const y = height * 0.58 + Math.sin(time * 2 + i) * 12 * intensity;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 10, y - 28, x + 22, y);
    ctx.quadraticCurveTo(x + 10, y - 8, x, y);
    ctx.fill();
  }

  ctx.fillStyle = "#e8e4d8";
  ctx.beginPath();
  ctx.moveTo(width * 0.62, height * 0.42);
  ctx.lineTo(width * 0.78, height * 0.28);
  ctx.lineTo(width * 0.94, height * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c9b48a";
  ctx.fillRect(width * 0.7, height * 0.42, width * 0.18, 8);

  ctx.strokeStyle = "rgba(40, 30, 20, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 7) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + Math.sin(y) * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "#8b1e1e";
  ctx.fillRect(width * 0.86, height * 0.08, 72, 86);
  ctx.fillStyle = "#f3e6c8";
  ctx.font = "20px serif";
  ctx.fillText("波", width * 0.88, height * 0.14);
}

function paintEightbit(input: PaintInput) {
  const { ctx, width, height, time, intensity } = input;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#5c94fc";
  ctx.fillRect(0, 0, width, height);

  const cloud = (x: number, y: number) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, 48, 16);
    ctx.fillRect(x + 12, y - 12, 28, 16);
  };
  cloud(80 + Math.sin(time * 0.4) * 20, 80);
  cloud(420, 120);
  cloud(860, 70);

  ctx.fillStyle = "#c84c0c";
  ctx.fillRect(0, height * 0.72, width, height * 0.28);
  ctx.fillStyle = "#fcbcb0";
  for (let x = 0; x < width; x += 32) {
    ctx.strokeStyle = "#7a2a08";
    ctx.strokeRect(x, height * 0.72, 32, 32);
  }

  const bounce = Math.abs(Math.sin(time * 4)) * 10 * intensity;
  ctx.fillStyle = "#fcbc60";
  ctx.fillRect(width * 0.42, height * 0.48 - bounce, 40, 40);
  ctx.fillStyle = "#000000";
  ctx.fillRect(width * 0.42 + 8, height * 0.48 - bounce + 10, 8, 8);
  ctx.fillRect(width * 0.42 + 24, height * 0.48 - bounce + 10, 8, 8);
  ctx.fillRect(width * 0.42 + 16, height * 0.48 - bounce + 22, 8, 8);

  const hop = Math.max(0, Math.sin(time * 3)) * 28 * intensity;
  ctx.fillStyle = "#fc9838";
  ctx.fillRect(width * 0.22, height * 0.62 - hop, 28, 36);
  ctx.fillStyle = "#ac7c00";
  ctx.fillRect(width * 0.22, height * 0.62 - hop, 28, 10);

  ctx.fillStyle = "#fcbc60";
  const spin = 0.5 + 0.5 * Math.sin(time * 6);
  ctx.beginPath();
  ctx.ellipse(width * 0.7, height * 0.4, 10 * spin + 4, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1);
  }
  ctx.imageSmoothingEnabled = true;
}

function paintBauhaus(input: PaintInput) {
  const { ctx, width, height, time, intensity } = input;
  ctx.fillStyle = "#efe6d6";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(20,20,20,0.12)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 12; i += 1) {
    ctx.beginPath();
    ctx.moveTo((width / 12) * i, 0);
    ctx.lineTo((width / 12) * i, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, (height / 8) * i);
    ctx.lineTo(width, (height / 8) * i);
    ctx.stroke();
  }

  const slide = Math.sin(time * 1.1) * 70 * intensity;
  ctx.fillStyle = "#c41e3a";
  ctx.fillRect(width * 0.18 + slide, height * 0.22, 180, 180);

  ctx.fillStyle = "#f4c430";
  ctx.save();
  ctx.translate(width * 0.62, height * 0.58);
  ctx.rotate(time * 0.4 * intensity);
  ctx.fillRect(-130, -36, 260, 72);
  ctx.restore();

  const orbit = time * 1.3;
  ctx.fillStyle = "#1d4ed8";
  ctx.beginPath();
  ctx.arc(
    width * 0.58 + Math.cos(orbit) * 90 * intensity,
    height * 0.36 + Math.sin(orbit) * 50 * intensity,
    64,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.fillStyle = "#111111";
  ctx.fillRect(width * 0.08, height * 0.78, width * 0.84, 16);
  ctx.fillRect(width * 0.78, height * 0.18, 16, height * 0.6);
}

function paintStarry(input: PaintInput) {
  const { ctx, width, height, time, intensity } = input;
  fillBackground(ctx, width, height, "#0b1c3a", "#12213d");

  for (let arm = 0; arm < 7; arm += 1) {
    ctx.strokeStyle = arm % 2 === 0 ? "rgba(90, 140, 200, 0.7)" : "rgba(40, 70, 120, 0.7)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (let i = 0; i < 80; i += 1) {
      const a = i * 0.18 + arm * 0.9 + time * 0.35 * intensity;
      const r = 30 + i * 4.2;
      const x = width * 0.62 + Math.cos(a) * r;
      const y = height * 0.32 + Math.sin(a) * r * 0.62;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 12; i += 1) {
    const x = hash(i + 1) * width * 0.85 + width * 0.05;
    const y = hash(i + 4) * height * 0.45;
    const pulse = 6 + Math.sin(time * 3 + i) * 3 * intensity;
    ctx.fillStyle = "rgba(240, 220, 130, 0.9)";
    ctx.beginPath();
    ctx.arc(x, y, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(240, 220, 130, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, pulse * 2.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "#0a1a14";
  ctx.beginPath();
  ctx.moveTo(width * 0.12, height);
  ctx.bezierCurveTo(
    width * 0.18,
    height * 0.4,
    width * 0.2,
    height * 0.15 + Math.sin(time) * 10 * intensity,
    width * 0.24,
    height * 0.08,
  );
  ctx.bezierCurveTo(width * 0.3, height * 0.35, width * 0.28, height * 0.7, width * 0.34, height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#1b2744";
  ctx.fillRect(0, height * 0.72, width, height * 0.28);
  for (let i = 0; i < 9; i += 1) {
    const x = width * (0.4 + i * 0.06);
    const h = 30 + hash(i) * 50;
    ctx.fillStyle = "#12192c";
    ctx.fillRect(x, height * 0.82 - h, 22, h);
    ctx.fillStyle = `rgba(240, 200, 90, ${0.4 + 0.4 * Math.sin(time * 2 + i)})`;
    ctx.fillRect(x + 6, height * 0.82 - h + 10, 6, 6);
  }
}

const PAINTERS: Record<StyleId, (input: PaintInput) => void> = {
  cave: paintCave,
  monet: paintMonet,
  ukiyo: paintUkiyo,
  eightbit: paintEightbit,
  bauhaus: paintBauhaus,
  starry: paintStarry,
};

function paintCaption(input: PaintInput) {
  const { ctx, width, height, caption, styleLabel } = input;
  if (!caption) return;

  const pad = 28;
  const barH = 92;
  ctx.fillStyle = "rgba(8, 8, 10, 0.55)";
  ctx.fillRect(pad, height - barH - pad, width - pad * 2, barH);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad, height - barH - pad, width - pad * 2, barH);

  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = "16px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(styleLabel.toUpperCase(), pad + 20, height - barH - pad + 28);

  ctx.fillStyle = "#f8f5ef";
  ctx.font = "600 26px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(caption, pad + 20, height - barH - pad + 64, width - pad * 2 - 40);
}

export function drawScene(
  style: StyleId,
  input: Omit<PaintInput, "styleLabel"> & { styleLabel: string },
) {
  const { ctx, width, height, intensity, motif, time } = input;
  const shift = motifShift(motif, time, intensity);
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.translate(width / 2 + shift.x, height / 2 + shift.y);
  ctx.scale(shift.zoom, shift.zoom);
  ctx.translate(-width / 2, -height / 2);
  PAINTERS[style](input);
  ctx.restore();
  paintCaption(input);
}
