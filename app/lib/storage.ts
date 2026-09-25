import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

export type UploadKind = "image" | "video";

const limits: Record<UploadKind, number> = {
  image: 5 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

const extensions: Record<UploadKind, Set<string>> = {
  image: new Set(["jpg", "jpeg", "png", "webp", "gif"]),
  video: new Set(["mp4", "webm", "mov", "avi"]),
};

const mimeTypes: Record<UploadKind, Set<string>> = {
  image: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  video: new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"]),
};

function matchesSignature(kind: UploadKind, bytes: Uint8Array) {
  if (kind === "image") {
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const gif = String.fromCharCode(...bytes.slice(0, 6)).startsWith("GIF8");
    const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    return jpeg || png || gif || webp;
  }

  const marker = String.fromCharCode(...bytes.slice(0, 12));
  const mp4 = marker.slice(4, 8) === "ftyp";
  const webm = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  const avi = marker.slice(0, 4) === "RIFF" && marker.slice(8, 11) === "AVI";
  return mp4 || webm || avi;
}

export async function uploadFile(file: File, kind: UploadKind): Promise<{ url: string }> {
  if (!file || file.size === 0) throw new Error("Пустой файл");
  if (file.size > limits[kind]) throw new Error("Файл превышает допустимый размер");
  if (!mimeTypes[kind].has(file.type)) throw new Error("Недопустимый тип файла");

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !extensions[kind].has(extension)) throw new Error("Недопустимое расширение файла");

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(kind, buffer.subarray(0, 16))) throw new Error("Содержимое файла не соответствует его типу");

  const bucket = process.env.YANDEX_BUCKET;
  const accessKeyId = process.env.YANDEX_ACCESS;
  const secretAccessKey = process.env.YANDEX_SECRET;
  if (!bucket || !accessKeyId || !secretAccessKey) throw new Error("Хранилище файлов не настроено");

  const endpoint = process.env.YANDEX_ENDPOINT?.trim() || "https://storage.yandexcloud.net";
  const client = new S3Client({
    endpoint,
    region: process.env.YANDEX_REGION || "ru-central1",
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  const key = `${kind === "image" ? "images" : "videos"}/${Date.now()}-${randomBytes(12).toString("hex")}.${extension}`;

  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: file.type }));

  const publicBase = process.env.YANDEX_PUBLIC_URL?.replace(/\/$/, "") || `${endpoint.replace(/\/$/, "")}/${bucket}`;
  return { url: `${publicBase}/${key}` };
}
