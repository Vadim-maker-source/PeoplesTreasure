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
    const action = String((await request.json()).action || "");
    if (action !== "approve" && action !== "reject") return fail("Неизвестное действие");
    const post = await prisma.post.update({ where: { id }, data: { status: action === "approve" ? "approved" : "rejected" } });
    return ok({ id: post.id, status: post.status });
  } catch (error) {
    return serverError(error);
  }
}
