import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { publicOrigin } from "../../_lib/dto";
import { ok, serverError } from "../../_lib/response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APK_NAME = "sokrovischa-narodov.apk";
const APK_PATH = path.join(process.cwd(), "public", "downloads", APK_NAME);

let cachedApk:
  | { mtimeMs: number; size: number; sha256: string }
  | undefined;

function sha256File(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function apkMetadata() {
  const file = await stat(APK_PATH);
  if (
    cachedApk?.mtimeMs === file.mtimeMs &&
    cachedApk.size === file.size
  ) {
    return cachedApk;
  }

  cachedApk = {
    mtimeMs: file.mtimeMs,
    size: file.size,
    sha256: await sha256File(APK_PATH),
  };
  return cachedApk;
}

export async function GET(request: NextRequest) {
  try {
    const apk = await apkMetadata();
    return ok({
      platform: "android",
      versionName: "1.1.0",
      versionCode: 2,
      sha256: apk.sha256,
      size: apk.size,
      downloadUrl: `${publicOrigin(request)}/downloads/${APK_NAME}`,
    });
  } catch (error) {
    return serverError(error);
  }
}
