import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// CRC32 table for valid PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodeRgbaToPng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const rawScanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    rawScanlines[rowStart] = 0; // Filter type 0 (None)
    rgba.copy(rawScanlines, rowStart + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function sdRoundedBox(px, py, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(px - cx) - (halfW - radius);
  const dy = Math.abs(py - cy) - (halfH - radius);
  const outDist = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const inDist = Math.min(Math.max(dx, dy), 0);
  return outDist + inDist - radius;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = px - x1;
  const wy = py - y1;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(px - x1, py - y1);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(px - x2, py - y2);
  const b = c1 / c2;
  const bx = x1 + b * vx;
  const by = y1 + b * vy;
  return Math.hypot(px - bx, py - by);
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function blendPixel(buf, idx, r, g, b, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  if (a <= 0) return;
  const dstR = buf[idx];
  const dstG = buf[idx + 1];
  const dstB = buf[idx + 2];
  const dstA = buf[idx + 3] / 255;

  const outA = a + dstA * (1 - a);
  if (outA <= 0) return;

  buf[idx] = Math.round((r * a + dstR * dstA * (1 - a)) / outA);
  buf[idx + 1] = Math.round((g * a + dstG * dstA * (1 - a)) / outA);
  buf[idx + 2] = Math.round((b * a + dstB * dstA * (1 - a)) / outA);
  buf[idx + 3] = Math.round(outA * 255);
}

/**
 * Renders the 3D Mechanical Keycap with Glowing Alpha ('α') & Home-Row Bump at any target resolution.
 */
function renderKeycapIconRgba(size) {
  const rgba = Buffer.alloc(size * size * 4, 0);
  const scale = size / 256;
  const aa = 1.25 / scale;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Normalized 0..256 coordinate space
      const px = (x + 0.5) / scale;
      const py = (y + 0.5) / scale;
      const idx = (y * size + x) * 4;

      const tDiag = (px + py) / 512;

      // 1. Outer App Badge (rounded rect)
      const dBadge = sdRoundedBox(px, py, 128, 128, 118, 118, 52);
      if (dBadge < aa) {
        const alpha = 1 - Math.max(0, (dBadge + aa) / (2 * aa));
        const bgR = lerp(11, 28, tDiag);
        const bgG = lerp(17, 25, tDiag);
        const bgB = lerp(34, 72, tDiag);
        blendPixel(rgba, idx, bgR, bgG, bgB, alpha);

        // Subtle cyan outer border ring
        const borderDist = Math.abs(dBadge + 2.5);
        if (borderDist < 2.2) {
          const bAlpha = (1 - borderDist / 2.2) * 0.55 * alpha;
          blendPixel(rgba, idx, 56, 189, 248, bAlpha);
        }
      }

      // 2. 3D Keycap Bevel / Lower Skirt
      const dSkirt = sdRoundedBox(px, py, 128, 134, 92, 90, 34);
      if (dSkirt < aa) {
        const alpha = 1 - Math.max(0, (dSkirt + aa) / (2 * aa));
        const skR = lerp(2, 79, tDiag);
        const skG = lerp(132, 70, tDiag);
        const skB = lerp(199, 229, tDiag);
        blendPixel(rgba, idx, skR, skG, skB, alpha);
      }

      // 3. 3D Keycap Top Dish
      const dTop = sdRoundedBox(px, py, 128, 120, 80, 74, 26);
      if (dTop < aa) {
        const alpha = 1 - Math.max(0, (dTop + aa) / (2 * aa));
        const ty = (py - 46) / 148;
        const topR = lerp(30, 15, ty);
        const topG = lerp(41, 23, ty);
        const topB = lerp(59, 42, ty);
        blendPixel(rgba, idx, topR, topG, topB, alpha);

        // Top dish highlight rim
        const rimDist = Math.abs(dTop + 1.8);
        if (rimDist < 2.0) {
          const rAlpha = (1 - rimDist / 2.0) * 0.7 * alpha;
          blendPixel(rgba, idx, 56, 189, 248, rAlpha);
        }
      }

      // 4. Glowing Greek Alpha ('α') Symbol in the center of the keycap
      // Left loop of 'α' (tilted ellipse) + right crossing stems
      const cx = 117;
      const cy = 114;
      const rx = 25;
      const ry = 29;
      const normDist = Math.hypot((px - cx) / rx, (py - cy) / ry);
      const dLoop = Math.abs(normDist - 1) * ((rx + ry) / 2);

      // Upper-right to lower-right stem of 'α'
      const dStem1 = distToSegment(px, py, 134, 90, 154, 138);
      const dStem2 = distToSegment(px, py, 152, 87, 133, 137);
      const dAlpha = Math.min(dLoop, dStem1, dStem2);

      const strokeRadius = 8.2;
      // Soft outer cyan glow around 'α'
      if (dAlpha < strokeRadius + 11 && dTop < 0) {
        const glowFactor = Math.max(0, 1 - dAlpha / (strokeRadius + 11));
        blendPixel(rgba, idx, 56, 189, 248, glowFactor * glowFactor * 0.35);
      }

      if (dAlpha < strokeRadius + aa) {
        const aAlpha = 1 - Math.max(0, (dAlpha - strokeRadius + aa) / (2 * aa));
        const symR = lerp(56, 168, (px - 85) / 80);
        const symG = lerp(189, 230, (px - 85) / 80);
        const symB = 252;
        blendPixel(rgba, idx, symR, symG, symB, aAlpha);
      }

      // 5. Tactile Home-Row Bump Bar (F / J Anchor Ridge)
      const dBump = sdRoundedBox(px, py, 128, 174, 28, 3.5, 3.5);
      if (dBump < aa) {
        const bAlpha = 1 - Math.max(0, (dBump + aa) / (2 * aa));
        blendPixel(rgba, idx, 56, 189, 248, bAlpha);
      }
    }
  }

  return rgba;
}

/**
 * Packs multiple PNG buffers (e.g. 256, 64, 48, 32, 16) into a valid Windows .ICO file.
 */
function buildIcoFile(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4);

  const dirEntries = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;

  entries.forEach((item, i) => {
    const pos = i * 16;
    dirEntries[pos] = item.size >= 256 ? 0 : item.size;
    dirEntries[pos + 1] = item.size >= 256 ? 0 : item.size;
    dirEntries[pos + 2] = 0; // Palette
    dirEntries[pos + 3] = 0; // Reserved
    dirEntries.writeUInt16LE(1, pos + 4); // Color planes
    dirEntries.writeUInt16LE(32, pos + 6); // 32 bpp
    dirEntries.writeUInt32LE(item.png.length, pos + 8);
    dirEntries.writeUInt32LE(offset, pos + 12);
    offset += item.png.length;
  });

  return Buffer.concat([
    header,
    dirEntries,
    ...entries.map((e) => e.png),
  ]);
}

const sizes = [256, 128, 64, 48, 32, 16];
const renderedEntries = sizes.map((sz) => {
  const rgba = renderKeycapIconRgba(sz);
  const png = encodeRgbaToPng(sz, sz, rgba);
  return { size: sz, png };
});

const buildDir = path.join(rootDir, 'build');
const publicDir = path.join(rootDir, 'public');
fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

const icoBuffer = buildIcoFile(renderedEntries);
const png256 = renderedEntries[0].png;

fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(buildDir, 'icon.png'), png256);
fs.writeFileSync(path.join(publicDir, 'icon.png'), png256);

console.log(
  `Generated custom TypingAlpha icons: build/icon.ico (${icoBuffer.length} bytes) & build/icon.png (${png256.length} bytes)`
);
