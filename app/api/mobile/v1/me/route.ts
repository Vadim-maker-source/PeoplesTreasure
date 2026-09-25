import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireMobileUser } from "../../_lib/auth";
import { absoluteMediaUrl, userDto } from "../../_lib/dto";
import { fail, ok, serverError } from "../../_lib/response";

export async function GET(request: NextRequest) {
  const user = await requireMobileUser(request);
  if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
  const data = userDto(user);
  return ok({ ...data, avatar: absoluteMediaUrl(request.nextUrl.origin, data.avatar) });
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const body = await request.json();
    const firstName = body.firstName === undefined ? undefined : String(body.firstName).trim();
    const lastName = body.lastName === undefined ? undefined : String(body.lastName).trim();
    const phone = body.phone === undefined ? undefined : String(body.phone).trim();
    const region = body.region === undefined ? undefined : String(body.region).trim();
    const bio = body.bio === undefined ? undefined : String(body.bio).trim();
    const age = body.age === undefined ? undefined : Number(body.age);

    if (firstName !== undefined && (!firstName || firstName.length > 80)) return fail("Некорректное имя");
    if (lastName !== undefined && (!lastName || lastName.length > 80)) return fail("Некорректная фамилия");
    if (phone !== undefined && phone.length > 30) return fail("Некорректный номер телефона");
    if (region !== undefined && region.length > 120) return fail("Название региона слишком длинное");
    if (bio !== undefined && bio.length > 2000) return fail("Описание слишком длинное");
    if (age !== undefined && (!Number.isInteger(age) || age < 6 || age > 120)) return fail("Некорректный возраст");

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { firstName, lastName, phone, region, bio, age },
    });
    const data = userDto(updated);
    return ok({ ...data, avatar: absoluteMediaUrl(request.nextUrl.origin, data.avatar) });
  } catch (error) {
    return serverError(error);
  }
}
