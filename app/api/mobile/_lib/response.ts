import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(message: string, status = 400, code = "BAD_REQUEST") {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function serverError(error: unknown) {
  console.error(error);
  return fail("Внутренняя ошибка сервера", 500, "INTERNAL_ERROR");
}
