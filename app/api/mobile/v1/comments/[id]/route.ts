import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireMobileUser } from "../../../_lib/auth";
import { commentDto, publicOrigin } from "../../../_lib/dto";
import { fail, ok, serverError } from "../../../_lib/response";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const { id } = await context.params;
    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) return fail("Комментарий не найден", 404, "NOT_FOUND");
    if (existing.authorId !== user.id && user.role !== "ADMIN") return fail("Недостаточно прав", 403, "FORBIDDEN");
    const content = String((await request.json()).content || "").trim();
    if (!content || content.length > 2000) return fail("Некорректный комментарий");
    const comment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true } } },
    });
    return ok(commentDto(publicOrigin(request), comment));
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const { id } = await context.params;
    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) return fail("Комментарий не найден", 404, "NOT_FOUND");
    if (existing.authorId !== user.id && user.role !== "ADMIN") return fail("Недостаточно прав", 403, "FORBIDDEN");
    await prisma.comment.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
