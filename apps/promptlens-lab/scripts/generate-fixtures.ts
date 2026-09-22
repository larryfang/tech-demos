import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

type RGB = [number, number, number];

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k += 1) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width: number, height: number, pixel: (x: number, y: number) => RGB): Buffer {
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = pixel(x, y);
      const i = y * stride + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    clamp(a[0] + (b[0] - a[0]) * t),
    clamp(a[1] + (b[1] - a[1]) * t),
    clamp(a[2] + (b[2] - a[2]) * t),
  ];
}

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function inRoundRect(
  x: number,
  y: number,
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number,
): boolean {
  if (x < left || y < top || x > left + width || y > top + height) return false;
  const nx = Math.min(x - left, left + width - x);
  const ny = Math.min(y - top, top + height - y);
  if (nx >= radius || ny >= radius) return true;
  const dx = radius - nx;
  const dy = radius - ny;
  return dx * dx + dy * dy <= radius * radius;
}

function portraitPixel(x: number, y: number, w: number, h: number): RGB {
  const nx = x / w;
  const ny = y / h;
  const vignette = Math.min(1, Math.hypot(nx - 0.5, ny - 0.42) * 1.15);
  let color = mix([214, 204, 190], [168, 156, 142], vignette);

  if (inEllipse(x, y, w * 0.5, h * 1.08, w * 0.42, h * 0.28)) {
    color = mix([92, 78, 68], color, 0.08);
  }
  if (inEllipse(x, y, w * 0.5, h * 0.86, w * 0.16, h * 0.12)) {
    color = [214, 176, 148];
  }
  if (inEllipse(x, y, w * 0.5, h * 0.4, w * 0.22, h * 0.2)) {
    color = [224, 186, 158];
  }
  if (inEllipse(x, y, w * 0.5, h * 0.34, w * 0.24, h * 0.2) && y < h * 0.42) {
    color = [42, 36, 34];
  }
  if (inEllipse(x, y, w * 0.42, h * 0.4, 6, 4) || inEllipse(x, y, w * 0.58, h * 0.4, 6, 4)) {
    color = [48, 40, 36];
  }
  if (y > h * 0.46 && y < h * 0.475 && Math.abs(x - w * 0.5) < w * 0.05) {
    color = mix([196, 142, 126], color, 0.35);
  }
  return color;
}

function productPixel(x: number, y: number, w: number, h: number): RGB {
  const nx = x / w;
  const ny = y / h;
  let color = mix([236, 239, 244], [210, 216, 224], ny * 0.55 + Math.abs(nx - 0.5) * 0.2);
  if (y > h * 0.72) {
    const vein = Math.sin(x * 0.08 + y * 0.03) * 0.5 + 0.5;
    color = mix([228, 226, 222], [206, 204, 198], vein * 0.35 + (y / h - 0.72));
  }
  if (inEllipse(x, y, w * 0.5, h * 0.78, w * 0.22, h * 0.045)) {
    color = mix([186, 184, 180], color, 0.25);
  }
  const bottle = inRoundRect(x, y, w * 0.38, h * 0.18, w * 0.24, h * 0.56, 28);
  const neck = inRoundRect(x, y, w * 0.455, h * 0.1, w * 0.09, h * 0.12, 10);
  if (bottle || neck) {
    const shine = Math.max(0, 1 - Math.abs(nx - 0.44) * 8);
    color = mix([248, 246, 241], [226, 222, 214], 0.35 - shine * 0.25);
  }
  if (inRoundRect(x, y, w * 0.4, h * 0.36, w * 0.2, h * 0.16, 8)) {
    color = [46, 122, 122];
  }
  if (inRoundRect(x, y, w * 0.44, h * 0.08, w * 0.12, h * 0.035, 6)) {
    color = [196, 168, 92];
  }
  return color;
}

function uiPixel(x: number, y: number, w: number, h: number): RGB {
  let color: RGB = [244, 244, 245];
  if (x < w * 0.18) color = [24, 24, 27];
  if (y < 36 && x >= w * 0.18) color = [250, 250, 250];
  if (x < w * 0.18 && inRoundRect(x, y, 16, 70 + Math.floor((y - 70) / 36) * 36, w * 0.18 - 32, 22, 6) && y > 68 && y < 220) {
    color = [63, 63, 70];
  }
  const cards: Array<[number, number, number, number]> = [
    [w * 0.22, 56, w * 0.23, 88],
    [w * 0.48, 56, w * 0.23, 88],
    [w * 0.74, 56, w * 0.22, 88],
  ];
  for (const [left, top, width, height] of cards) {
    if (inRoundRect(x, y, left, top, width, height, 12)) color = [255, 255, 255];
    if (inRoundRect(x, y, left + 14, top + 18, width * 0.45, 10, 4)) color = [228, 228, 231];
    if (inRoundRect(x, y, left + 14, top + 42, width * 0.28, 16, 4)) color = [24, 24, 27];
  }
  if (inRoundRect(x, y, w * 0.22, 164, w * 0.74, h - 188, 12)) color = [255, 255, 255];
  const chartLeft = w * 0.28;
  const bars = [0.55, 0.72, 0.4, 0.86, 0.62, 0.78, 0.5];
  bars.forEach((t, i) => {
    const bx = chartLeft + i * 58;
    const bh = (h - 230) * t;
    if (inRoundRect(x, y, bx, h - 50 - bh, 28, bh, 6)) {
      color = i % 2 === 0 ? [24, 24, 27] : [113, 113, 122];
    }
  });
  return color;
}

function landscapePixel(x: number, y: number, w: number, h: number): RGB {
  const ny = y / h;
  let color = mix([126, 182, 217], [243, 213, 181], Math.max(0, (ny - 0.05) / 0.45));
  if (inEllipse(x, y, w * 0.78, h * 0.18, 34, 34)) color = [255, 236, 176];
  const far = Math.sin(x / w * Math.PI) * 0.08;
  if (ny > 0.46 - far) color = mix([140, 168, 132], [92, 128, 104], (ny - 0.4) * 1.4);
  const near = 0.08 * Math.sin(x / 40);
  if (ny > 0.62 + near) color = [63, 107, 79];
  if (ny > 0.78) {
    const ripple = 0.5 + 0.5 * Math.sin(x * 0.09 + y * 0.2);
    color = mix([78, 122, 128], [186, 206, 196], ripple * 0.35 + (ny - 0.78));
  }
  return color;
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "fixtures");
mkdirSync(outDir, { recursive: true });

const jobs = [
  ["portrait.png", 480, 640, portraitPixel],
  ["product.png", 512, 640, productPixel],
  ["ui.png", 720, 450, uiPixel],
  ["landscape.png", 720, 405, landscapePixel],
] as const;

for (const [name, width, height, fn] of jobs) {
  writeFileSync(join(outDir, name), encodePng(width, height, (x, y) => fn(x, y, width, height)));
  console.log(`wrote ${name}`);
}
