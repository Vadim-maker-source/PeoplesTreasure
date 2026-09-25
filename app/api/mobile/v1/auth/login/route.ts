import { compare } from "bcryptjs";
import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { consumeRateLimit, resetRateLimit } from "@/app/lib/rate-limit";
import { issueMobileSession } from "../../../_lib/auth";
import { userDto } from "../../../_lib/dto";
import { fail, ok, serverError } from "../../../_lib/response";

const dummyPasswordHash = "$2b$12$QIKiKM4ZxmrKKb.v0ds0Ouu3hoIKwwvD2WjbbE5UWHvGWp.cW4wBG";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password || password.length > 128) return fail("Неверный email или пароль", 401, "INVALID_CREDENTIALS");

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
    const [emailLimit, ipLimit] = await Promise.all([
      consumeRateLimit("mobile-login-email", email, 5, 15 * 60 * 1000),
      consumeRateLimit("mobile-login-ip", ip, 30, 15 * 60 * 1000),
    ]);
    if (!emailLimit.allowed || !ipLimit.allowed) return fail("Слишком много попыток. Попробуйте позже", 429, "RATE_LIMITED");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.password) {
      await compare(password, dummyPasswordHash);
      return fail("Неверный email или пароль", 401, "INVALID_CREDENTIALS");
    }

    if (!(await compare(password, user.password))) return fail("Неверный email или пароль", 401, "INVALID_CREDENTIALS");
    await resetRateLimit("mobile-login-email", email);

    const device = String(body.device || request.headers.get("user-agent") || "");
    const tokens = await issueMobileSession(user.id, user.role, device);
    return ok({ user: userDto(user), ...tokens });
  } catch (error) {
    return serverError(error);
  }
}
