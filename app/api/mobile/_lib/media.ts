function mediaBase() {
  const endpoint = (process.env.YANDEX_ENDPOINT || "https://storage.yandexcloud.net").replace(/\/$/, "");
  const bucket = process.env.YANDEX_BUCKET?.trim();
  const configured = process.env.YANDEX_PUBLIC_URL?.trim().replace(/\/$/, "");
  return configured || (bucket ? `${endpoint}/${bucket}` : null);
}

export function allowedMediaUrls(value: unknown, existing: string[] = []) {
  if (!Array.isArray(value)) return existing;
  const base = mediaBase();
  return value
    .map(item => String(item).trim())
    .filter(item => existing.includes(item) || Boolean(base && (item === base || item.startsWith(`${base}/`))))
    .slice(0, 15);
}
