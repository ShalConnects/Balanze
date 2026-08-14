import { scoreSeriesOcrMatches } from './prizeBondUtils';
import { applyScanLearnHints } from './prizeBondScanLearn';
import { logBondScan } from './prizeBondScanLog';
import type { BondOcrResult, ScanLearnHints } from '../types/prizeBond';

type ScanSource = { label: string; blob: Blob; psm: '6' | '7'; weight: number };

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function enhanceCanvas(ctx: CanvasRenderingContext2D, w: number, h: number, mode: 'red' | 'mono') {
  const { data } = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    let v: number;
    if (mode === 'red' && r > 85 && r > g * 1.12 && r > b * 1.12) v = 0;
    else if (mode === 'red') v = 255;
    else {
      v = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      v = v > 165 ? 255 : v < 95 ? 0 : v;
    }
    data[i] = data[i + 1] = data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(new ImageData(data, w, h), 0, 0);
}

function renderRegion(
  img: HTMLImageElement, x: number, y: number, rw: number, rh: number, scale: number, mode: 'red' | 'mono' | 'color',
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(3, Math.round(rw * scale));
  canvas.height = Math.max(3, Math.round(rh * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x, y, rw, rh, 0, 0, canvas.width, canvas.height);
  if (mode !== 'color') enhanceCanvas(ctx, canvas.width, canvas.height, mode);
  return canvas;
}

async function prepareScanImage(file: File): Promise<File> {
  const { default: compress } = await import('browser-image-compression');
  return compress(file, { maxWidthOrHeight: 1600, maxSizeMB: 1.5, useWebWorker: false });
}

async function buildScanSources(file: File): Promise<ScanSource[]> {
  const img = await loadImage(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const fit = Math.min(1, 1600 / Math.max(w, h));
  const serial = fit * 2;
  const toBlob = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) => {
    c.toBlob((b) => (b ? res(b) : rej(new Error('BLOB_FAIL'))), 'image/png');
  });

  return [
    { label: 'full', blob: await toBlob(renderRegion(img, 0, 0, w, h, fit, 'color')), psm: '6', weight: 2 },
    { label: 'series-mid', blob: await toBlob(renderRegion(img, 0, h * 0.36, w * 0.58, h * 0.14, serial, 'red')), psm: '7', weight: 4 },
    { label: 'series-bottom', blob: await toBlob(renderRegion(img, w * 0.42, h * 0.78, w * 0.56, h * 0.2, serial, 'mono')), psm: '7', weight: 5 },
  ];
}

export async function scanBondImage(file: File, hints?: ScanLearnHints): Promise<BondOcrResult> {
  const prepared = await prepareScanImage(file);
  logBondScan('start', { name: prepared.name, size: prepared.size, type: prepared.type });
  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await createWorker('ben+eng');
  const merged = new Map<string, number>();
  const regionContrib = new Map<string, Record<string, number>>();
  const regionScores: Record<string, number> = {};

  try {
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789০১২৩৪৫৬৭৮৯খগচছজঝটঠডঢতথদধনপফবভমযরলশষসহড়ঢ়য়ৎািীুূৃেৈোৌংঃঁ ',
    });

    for (const { label, blob, psm, weight } of await buildScanSources(prepared)) {
      await worker.setParameters({ tessedit_pageseg_mode: psm === '7' ? PSM.SINGLE_LINE : PSM.SINGLE_BLOCK });
      const { data } = await worker.recognize(blob);
      const raw = data.text || '';
      logBondScan('ocr', { region: label, raw: raw.replace(/\s+/g, ' ').trim() });

      for (const [n, s] of scoreSeriesOcrMatches(raw)) {
        const boost = hints?.regionBoost[label] ?? 1;
        const total = s * weight * boost;
        merged.set(n, (merged.get(n) ?? 0) + total);
        regionScores[label] = (regionScores[label] ?? 0) + total;
        const rc = regionContrib.get(n) ?? {};
        rc[label] = (rc[label] ?? 0) + total;
        regionContrib.set(n, rc);
        logBondScan('match', { region: label, number: n, score: total });
      }
    }

    const regionByNumber = new Map<string, string>();
    for (const [n, rc] of regionContrib) {
      const best = Object.entries(rc).sort((a, b) => b[1] - a[1])[0];
      if (best) regionByNumber.set(n, best[0]);
    }

    applyScanLearnHints(merged, regionByNumber, hints);
    const ranked = [...merged.entries()].sort((a, b) => b[1] - a[1]);
    const number = ranked[0]?.[0] ?? null;
    const best_region = number ? regionByNumber.get(number) : undefined;
    const scores = Object.fromEntries(merged);
    const feedback = number
      ? { detected_number: number, confirmed_number: number, best_region, region_scores: regionScores }
      : null;
    logBondScan('done', { numbers: number ? [number] : [], scores, best_region });
    return { number, scores, best_region, feedback };
  } finally {
    await worker.terminate();
  }
}
