import type { NextRequest } from "next/server";
import { createUser } from "@/app/lib/api/user";
import { prisma } from "@/app/lib/prisma";
import { issueMobileSession } from "../../../_lib/auth";
import { userDto } from "../../../_lib/dto";
import { fail, ok, serverError } from "../../../_lib/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createUser({
      firstName: String(body.firstName || ""),
      lastName: String(body.lastName || ""),
      email: String(body.email || ""),
      phone: String(body.phone || ""),
      age: Number(body.age),
      password: String(body.password || ""),
      confirmPassword: String(body.confirmPassword || body.password || ""),
    }, String(body.code || ""));
    if (result.error || !result.user) return fail(result.error || "Не удалось зарегистрироваться", 400, "REGISTRATION_FAILED");

    const user = await prisma.user.findUnique({ where: { id: result.user.id } });
    if (!user) return fail("Пользователь не найден", 404, "USER_NOT_FOUND");
    const tokens = await issueMobileSession(user.id, user.role, String(body.device || ""));
    return ok({ user: userDto(user), ...tokens }, 201);
  } catch (error) {
    return serverError(error);
  }
}
