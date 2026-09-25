import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireMobileUser } from "../../../_lib/auth";
import { fail, ok, serverError } from "../../../_lib/response";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const { id } = await context.params;
    const ticket = await prisma.support.findUnique({ where: { id } });
    if (!ticket) return fail("Обращение не найдено", 404, "NOT_FOUND");
    if (ticket.userId !== user.id && user.role !== "ADMIN") return fail("Недостаточно прав", 403, "FORBIDDEN");
    const body = await request.json();
    const updated = await prisma.support.update({
      where: { id },
      data: {
        ...(body.read === true && ticket.userId === user.id ? { isReadByUser: true } : {}),
        ...(body.close === true && ticket.userId === user.id ? { status: "closed" } : {}),
      },
    });
    return ok({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
  } catch (error) {
    return serverError(error);
  }
}
