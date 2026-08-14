import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';

export const isNative = () => Capacitor.isNativePlatform();

export function isCancel(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return /cancel/i.test(m) || m === 'NO_FILE';
}

function toFile(data: Blob | string | undefined, name: string, mime: string): File {
  let blob: Blob;
  if (data instanceof Blob) blob = data;
  else if (typeof data === 'string') {
    const raw = data.includes(',') ? data.slice(data.indexOf(',') + 1) : data;
    const bin = atob(raw);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    blob = new Blob([bytes], { type: mime });
  } else throw new Error('NO_FILE');
  try {
    return new File([blob], name, { type: mime });
  } catch {
    return Object.assign(blob, { name, lastModified: Date.now() }) as File;
  }
}

function pickWebImage(camera: boolean): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.hidden = true;
    if (camera) input.setAttribute('capture', 'environment');
    input.onchange = () => {
      const file = input.files?.[0];
      input.remove();
      file ? resolve(file) : reject(new Error('NO_FILE'));
    };
    document.body.appendChild(input);
    input.click();
  });
}

export async function pickNativeFiles(types: string[], limit = 1): Promise<File[]> {
  const { files } = await FilePicker.pickFiles({ types, limit, readData: true });
  if (!files?.length) throw new Error('NO_FILE');
  return files.map((f) => toFile(f.blob ?? f.data, f.name || 'file', f.mimeType || 'application/octet-stream'));
}

export async function capturePhoto(): Promise<File> {
  if (!isNative()) return pickWebImage(true);
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  const photo = await Camera.getPhoto({
    source: CameraSource.Camera,
    resultType: CameraResultType.Uri,
    quality: 85,
    width: 1600,
    correctOrientation: true,
  });
  if (!photo.webPath) throw new Error('NO_FILE');
  const blob = await (await fetch(photo.webPath)).blob();
  return toFile(blob, `bond.${photo.format || 'jpg'}`, blob.type || 'image/jpeg');
}

export async function pickImage(): Promise<File> {
  if (!isNative()) return pickWebImage(false);
  const [file] = await pickNativeFiles(['image/*']);
  return file;
}
