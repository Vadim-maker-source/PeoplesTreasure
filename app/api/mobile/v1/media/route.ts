import type { NextRequest } from "next/server";
import { consumeRateLimit } from "@/app/lib/rate-limit";
import { uploadFile, type UploadKind } from "@/app/lib/storage";
import { requireMobileUser } from "../../_lib/auth";
import { fail, ok, serverError } from "../../_lib/response";

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const rateLimit = await consumeRateLimit("mobile-media", user.id, 30, 60 * 60 * 1000);
    if (!rateLimit.allowed) return fail("Слишком много загрузок", 429, "RATE_LIMITED");
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") || "image") as UploadKind;
    if (!(file instanceof File)) return fail("Файл не выбран");
    if (kind !== "image" && kind !== "video") return fail("Недопустимый тип загрузки");
    return ok(await uploadFile(file, kind), 201);
  } catch (error) {
    if (error instanceof Error && /файл|тип|размер|расширение|хранилище/i.test(error.message)) return fail(error.message);
    return serverError(error);
  }
}
