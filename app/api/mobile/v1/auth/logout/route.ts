import type { NextRequest } from "next/server";
import { revokeMobileSession } from "../../../_lib/auth";
import { ok, serverError } from "../../../_lib/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = String(body.refreshToken || "");
    if (refreshToken) await revokeMobileSession(refreshToken);
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
