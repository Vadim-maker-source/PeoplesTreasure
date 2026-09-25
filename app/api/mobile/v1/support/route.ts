import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { consumeRateLimit } from "@/app/lib/rate-limit";
import { requireMobileUser } from "../../_lib/auth";
import { fail, ok, serverError } from "../../_lib/response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const tickets = await prisma.support.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return ok(tickets.map(ticket => ({ ...ticket, createdAt: ticket.createdAt.toISOString(), updatedAt: ticket.updatedAt.toISOString() })));
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const limit = await consumeRateLimit("mobile-support", user.id, 5, 60 * 60 * 1000);
    if (!limit.allowed) return fail("Слишком много обращений", 429, "RATE_LIMITED");
    const body = await request.json();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    if (!subject || subject.length > 150) return fail("Некорректная тема");
    if (!message || message.length > 5000) return fail("Некорректное сообщение");
    const ticket = await prisma.support.create({ data: { userId: user.id, subject, message } });
    return ok({ ...ticket, createdAt: ticket.createdAt.toISOString(), updatedAt: ticket.updatedAt.toISOString() }, 201);
  } catch (error) {
    return serverError(error);
  }
}
