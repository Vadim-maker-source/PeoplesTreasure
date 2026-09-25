import type { NextRequest } from "next/server";
import { rotateMobileSession } from "../../../_lib/auth";
import { fail, ok, serverError } from "../../../_lib/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = String(body.refreshToken || "");
    if (!refreshToken) return fail("Refresh-токен обязателен", 400, "TOKEN_REQUIRED");
    const session = await rotateMobileSession(refreshToken, String(body.device || ""));
    if (!session) return fail("Сессия истекла", 401, "SESSION_EXPIRED");
    return ok(session);
  } catch (error) {
    return serverError(error);
  }
}
