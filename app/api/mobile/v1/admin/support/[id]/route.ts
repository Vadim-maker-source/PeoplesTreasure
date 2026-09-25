import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireMobileUser } from "../../../../_lib/auth";
import { fail, ok, serverError } from "../../../../_lib/response";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireMobileUser(request, true);
    if (!user) return fail("Доступ запрещён", 403, "FORBIDDEN");
    const { id } = await context.params;
    const body = await request.json();
    const answer = body.answer === undefined ? undefined : String(body.answer).trim();
    if (answer !== undefined && (!answer || answer.length > 5000)) return fail("Некорректный ответ");
    const ticket = await prisma.support.update({
      where: { id },
      data: {
        ...(answer !== undefined ? { answer, status: "answered", isReadByUser: false } : {}),
        ...(body.close === true ? { status: "closed" } : {}),
        isReadByAdmin: true,
      },
    });
    return ok({ ...ticket, createdAt: ticket.createdAt.toISOString(), updatedAt: ticket.updatedAt.toISOString() });
  } catch (error) {
    return serverError(error);
  }
}
