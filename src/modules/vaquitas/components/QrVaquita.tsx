"use client";
// [RF-VAQ-10 · RNF-08] Generador QR 100% offline en SVG (ISO/IEC 18004, modo Byte, ECC Nivel L)
// Funciona en red local sin depender de internet externo para que el jurado escanee con su celular.
import { useMemo } from "react";

// Capacidad en bytes (Modo Byte, Nivel de corrección L) y código total/datos por versión (1..6)
const VERSIONES_L: ReadonlyArray<{
  v: number;
  size: number;
  dataBytes: number;
  ecBytesPerBlock: number;
  blocks: number;
  align: readonly number[];
}> = [
  { v: 1, size: 21, dataBytes: 19, ecBytesPerBlock: 7, blocks: 1, align: [] },
  { v: 2, size: 25, dataBytes: 34, ecBytesPerBlock: 10, blocks: 1, align: [6, 18] },
  { v: 3, size: 29, dataBytes: 55, ecBytesPerBlock: 15, blocks: 1, align: [6, 22] },
  { v: 4, size: 33, dataBytes: 80, ecBytesPerBlock: 20, blocks: 1, align: [6, 26] },
  { v: 5, size: 37, dataBytes: 108, ecBytesPerBlock: 26, blocks: 1, align: [6, 30] },
  { v: 6, size: 41, dataBytes: 136, ecBytesPerBlock: 18, blocks: 2, align: [6, 34] },
];

// GF(256) con polinomio 0x11d para Reed-Solomon
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLen);
  const rem = new Uint8Array(ecLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[ecLen - 1] = 0;
    for (let j = 0; j < ecLen; j++) {
      rem[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return rem;
}

export function generarMatrizQr(texto: string): boolean[][] {
  const bytes = new TextEncoder().encode(texto);
  const cfg = VERSIONES_L.find((ver) => bytes.length + 2 <= ver.dataBytes) ?? VERSIONES_L[VERSIONES_L.length - 1];
  const payload = bytes.slice(0, cfg.dataBytes - 2);

  // Construir flujo de bits: Modo Byte (0100) + longitud (8 bits en v1..9) + datos + terminador
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  pushBits(0b0100, 4);
  pushBits(payload.length, 8);
  for (const b of payload) pushBits(b, 8);

  const maxBits = cfg.dataBytes * 8;
  const term = Math.min(4, maxBits - bits.length);
  pushBits(0, term);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = new Uint8Array(cfg.dataBytes);
  for (let i = 0; i < bits.length / 8; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i * 8 + b];
    codewords[i] = byte;
  }
  const pads = [0xec, 0x11];
  for (let i = bits.length / 8, p = 0; i < cfg.dataBytes; i++, p++) {
    codewords[i] = pads[p % 2];
  }

  // Dividir en bloques y calcular Reed-Solomon
  const blockSize = cfg.dataBytes / cfg.blocks;
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  for (let b = 0; b < cfg.blocks; b++) {
    const slice = codewords.slice(b * blockSize, (b + 1) * blockSize);
    dataBlocks.push(slice);
    ecBlocks.push(rsEncode(slice, cfg.ecBytesPerBlock));
  }

  const finalBytes: number[] = [];
  for (let i = 0; i < blockSize; i++) {
    for (let b = 0; b < cfg.blocks; b++) finalBytes.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < cfg.ecBytesPerBlock; i++) {
    for (let b = 0; b < cfg.blocks; b++) finalBytes.push(ecBlocks[b][i]);
  }

  const size = cfg.size;
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunc = (r: number, c: number, val: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = val;
      isFunction[r][c] = true;
    }
  };

  // Patrones de búsqueda (Finder patterns) + separadores
  const drawFinder = (row: number, col: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunc(r, c, inOuter && (onBorder || inCenter));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Patrones de tiempo (Timing patterns)
  for (let i = 8; i < size - 8; i++) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }

  // Patrones de alineación (Alignment patterns)
  for (const ar of cfg.align) {
    for (const ac of cfg.align) {
      if ((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const val = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunc(ar + dr, ac + dc, val);
        }
      }
    }
  }

  // Módulo oscuro fijo y reservar área de información de formato
  setFunc(size - 8, 8, true);
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) setFunc(8, i, false);
    if (!isFunction[i][8]) setFunc(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) setFunc(8, size - 1 - i, false);
    if (!isFunction[size - 1 - i][8]) setFunc(size - 1 - i, 8, false);
  }

  // Colocar bits de datos en zigzag con máscara 0: (r + c) % 2 === 0
  const allBits: number[] = [];
  for (const byte of finalBytes) {
    for (let i = 7; i >= 0; i--) allBits.push((byte >> i) & 1);
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunction[r][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] === 1 : false;
          const mask = (r + c) % 2 === 0;
          modules[r][c] = bit !== mask;
        }
      }
    }
    upward = !upward;
  }

  // Información de formato para Nivel L (01) y Máscara 0 (000) -> 0x77c4
  const formatBits = 0x77c4;
  const fBit = (i: number) => ((formatBits >> i) & 1) === 1;

  for (let i = 0; i <= 5; i++) setFunc(8, i, fBit(i));
  setFunc(8, 7, fBit(6));
  setFunc(8, 8, fBit(7));
  setFunc(7, 8, fBit(8));
  for (let i = 9; i < 15; i++) setFunc(14 - i, 8, fBit(i));

  for (let i = 0; i < 8; i++) setFunc(8, size - 1 - i, fBit(i));
  for (let i = 8; i < 15; i++) setFunc(size - 15 + i, 8, fBit(i));

  return modules;
}

export function QrVaquita({ url, size = 188 }: { url: string; size?: number }) {
  const matriz = useMemo(() => generarMatrizQr(url), [url]);
  const n = matriz.length;
  const margen = 2;
  const total = n + margen * 2;

  return (
    <div className="inline-flex flex-col items-center rounded-xl border border-gray-200 bg-white p-3 shadow-xs">
      <svg
        viewBox={`0 0 ${total} ${total}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`Código QR para abrir ${url}`}
      >
        <rect width={total} height={total} fill="#ffffff" />
        {matriz.map((fila, r) =>
          fila.map((activo, c) =>
            activo ? <rect key={`${r}-${c}`} x={c + margen} y={r + margen} width={1} height={1} fill="#111827" /> : null,
          ),
        )}
      </svg>
    </div>
  );
}
