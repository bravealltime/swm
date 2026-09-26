const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const typeBuf = Buffer.from(type);
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const toCrc = Buffer.concat([typeBuf, data]);
    const crc = zlib.crc32(toCrc);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0; // Filter 0 (None)
    rgbaBuffer.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(scanlines, { level: 9 });
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Point-in-polygon test (ray casting)
function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Distance from point to polygon boundary
function distToPoly(x, y, poly) {
  let minDist = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const x1 = poly[j][0], y1 = poly[j][1];
    const x2 = poly[i][0], y2 = poly[i][1];
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t * dx, py = y1 + t * dy;
    const d = Math.hypot(x - px, y - py);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

function renderSwmIcon(size, isMaskable = false) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  // If maskable, icon scale is reduced to 75% so it stays safely within the circular mask
  const scale = (isMaskable ? 0.72 : 0.88) * (size / 100);

  // Polygonal vertices scaled to size
  const transform = (pts) => pts.map(([px, py]) => [cx + (px - 50) * scale, cy + (py - 50) * scale]);

  const outerShield = transform([
    [50, 4], [92, 26], [92, 74], [50, 96], [8, 74], [8, 26]
  ]);
  const innerShield = transform([
    [50, 13], [84, 31], [84, 69], [50, 87], [16, 69], [16, 31]
  ]);
  const coreHex = transform([
    [32, 38], [50, 26], [68, 38], [68, 62], [50, 74], [32, 62]
  ]);
  const topAmber = transform([
    [50, 30], [64, 40], [50, 50], [36, 40]
  ]);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Base background: Deep sleek dark space #0b1017
      let r = 11, g = 16, b = 23, a = 255;

      // Radial subtle ambient blue glow behind the shield
      const distFromCenter = Math.hypot(x - cx, y - cy);
      const glowFactor = Math.max(0, 1 - distFromCenter / (size * 0.48));
      if (glowFactor > 0) {
        r = Math.min(255, r + 25 * glowFactor);
        g = Math.min(255, g + 55 * glowFactor);
        b = Math.min(255, b + 115 * glowFactor);
      }

      // Check outer shield
      const inOuter = pointInPoly(x, y, outerShield);
      const dOuter = distToPoly(x, y, outerShield);
      const strokeOuter = 2.5 * (size / 100);

      if (inOuter) {
        // Inner fill of outer shield: Tactical dark navy #0d172a
        r = 13; g = 23; b = 42;

        // Inner shield
        const inInner = pointInPoly(x, y, innerShield);
        const dInner = distToPoly(x, y, innerShield);
        const strokeInner = 1.8 * (size / 100);

        if (inInner) {
          // Inside inner shield: Dark glowing blue #081a38
          r = 8; g = 26; b = 56;

          // Crosshairs
          const onVertCross = Math.abs(x - cx) < (size * 0.009) && y >= cy - 32 * scale && y <= cy + 32 * scale;
          const onHorizCross = Math.abs(y - cy) < (size * 0.009) && x >= cx - 28 * scale && x <= cx + 28 * scale;
          if (onVertCross || onHorizCross) {
            r = 56; g = 189; b = 248; // cyan
          }

          // Core Hexagon
          const inCore = pointInPoly(x, y, coreHex);
          const dCore = distToPoly(x, y, coreHex);
          const strokeCore = 2 * (size / 100);

          if (inCore) {
            // Core fill: Rich Indigo-Blue
            r = 25; g = 55; b = 120;

            // Amber top chevron
            if (pointInPoly(x, y, topAmber)) {
              r = 251; g = 191; b = 36; // Amber-400
            }

            // Center glowing core circle
            const coreDist = Math.hypot(x - cx, y - cy);
            const coreRadius = 7 * scale;
            if (coreDist <= coreRadius) {
              const coreT = 1 - (coreDist / coreRadius);
              r = Math.min(255, 56 + 199 * coreT);
              g = Math.min(255, 189 + 66 * coreT);
              b = Math.min(255, 248 + 7 * coreT);
            }
          }

          // Core stroke (Cyan)
          if (dCore < strokeCore) {
            r = 56; g = 189; b = 248;
          }

          // Inner shield stroke (Cyan accent)
          if (dInner < strokeInner) {
            r = 56; g = 189; b = 248;
          }
        }

        // Outer shield stroke (Royal Blue-500 #3b82f6)
        if (dOuter < strokeOuter) {
          r = 59; g = 130; b = 246;
        }
      } else {
        // Outer glow on border
        if (dOuter < strokeOuter) {
          const t = 1 - (dOuter / strokeOuter);
          r = Math.min(255, r + 59 * t);
          g = Math.min(255, g + 130 * t);
          b = Math.min(255, b + 246 * t);
        }
      }

      buf[idx] = Math.round(r);
      buf[idx + 1] = Math.round(g);
      buf[idx + 2] = Math.round(b);
      buf[idx + 3] = a;
    }
  }

  return createPng(size, size, buf);
}

const publicDir = path.resolve(__dirname, '../public');

console.log('Generating PWA Icons for SWM...');

const icons = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-192-maskable.png', size: 192, maskable: true },
  { file: 'icon-512-maskable.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const icon of icons) {
  const dest = path.join(publicDir, icon.file);
  const pngBuf = renderSwmIcon(icon.size, icon.maskable);
  fs.writeFileSync(dest, pngBuf);
  console.log(` Created ${icon.file} (${icon.size}x${icon.size}, ${pngBuf.length} bytes)`);
}

console.log(' All PWA icons generated successfully!');
