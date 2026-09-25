import type { NextRequest } from "next/server";
import { sendVerificationCode } from "@/app/lib/api/user";
import { fail, ok, serverError } from "../../../_lib/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await sendVerificationCode(String(body.email || ""));
    if (result.error) return fail(result.error, 400, "VERIFICATION_FAILED");
    return ok({ sent: true });
  } catch (error) {
    return serverError(error);
  }
}
