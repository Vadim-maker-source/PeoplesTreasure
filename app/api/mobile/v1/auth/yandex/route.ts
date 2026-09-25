import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { consumeRateLimit } from "@/app/lib/rate-limit";
import { issueMobileSession } from "../../../_lib/auth";
import { userDto } from "../../../_lib/dto";
import { fail, ok, serverError } from "../../../_lib/response";

type YandexProfile = {
  id?: string;
  client_id?: string;
  default_email?: string;
  first_name?: string;
  last_name?: string;
  real_name?: string;
  display_name?: string;
  default_avatar_id?: string;
  default_phone?: { number?: string };
};

function nameParts(profile: YandexProfile) {
  const realName = String(profile.real_name || profile.display_name || "").trim();
  const parts = realName.split(/\s+/).filter(Boolean);
  return {
    firstName: String(profile.first_name || parts[0] || "Пользователь").trim().slice(0, 80),
    lastName: String(profile.last_name || parts.slice(1).join(" ") || "Яндекса").trim().slice(0, 80),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const oauthToken = String(body.token || "").trim();
    if (!oauthToken || oauthToken.length > 4096) {
      return fail("Токен Яндекса не передан", 400, "YANDEX_TOKEN_REQUIRED");
    }

    const clientId = process.env.YANDEX_CLIENT_ID?.trim();
    if (!clientId) return fail("Авторизация через Яндекс не настроена", 503, "YANDEX_NOT_CONFIGURED");

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "local";
    const limit = await consumeRateLimit("mobile-yandex-ip", ip, 20, 15 * 60 * 1000);
    if (!limit.allowed) return fail("Слишком много попыток. Попробуйте позже", 429, "RATE_LIMITED");

    const profileResponse = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${oauthToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!profileResponse.ok) return fail("Яндекс отклонил авторизацию", 401, "YANDEX_TOKEN_INVALID");

    const profile = await profileResponse.json() as YandexProfile;
    if (profile.client_id !== clientId) {
      return fail("Токен выпущен для другого приложения", 401, "YANDEX_CLIENT_MISMATCH");
    }

    const providerAccountId = String(profile.id || "").trim();
    const email = String(profile.default_email || "").trim().toLowerCase();
    if (!providerAccountId || !email) {
      return fail("Яндекс не предоставил email аккаунта", 422, "YANDEX_EMAIL_REQUIRED");
    }

    const linked = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider: "yandex", providerAccountId } },
      include: { user: true },
    });

    let user = linked?.user;
    if (!user) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        await prisma.account.create({
          data: { userId: existing.id, type: "oauth", provider: "yandex", providerAccountId },
        });
        user = existing;
      } else {
        const names = nameParts(profile);
        user = await prisma.user.create({
          data: {
            email,
            emailVerified: new Date(),
            firstName: names.firstName,
            lastName: names.lastName,
            age: 0,
            phone: String(profile.default_phone?.number || "").trim().slice(0, 30),
            avatar: profile.default_avatar_id
              ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`
              : null,
            region: "",
            bio: "",
            role: "USER",
            accounts: {
              create: { type: "oauth", provider: "yandex", providerAccountId },
            },
          },
        });
      }
    }

    const device = String(body.device || request.headers.get("user-agent") || "");
    const tokens = await issueMobileSession(user.id, user.role, device);
    return ok({ user: userDto(user), ...tokens });
  } catch (error) {
    return serverError(error);
  }
}
