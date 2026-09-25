import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireMobileUser } from "../../../../_lib/auth";
import { fail, ok, serverError } from "../../../../_lib/response";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const { id: postId } = await context.params;
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { status: true } });
    if (!post || post.status !== "approved") return fail("Публикация не найдена", 404, "NOT_FOUND");

    const result = await prisma.$transaction(async transaction => {
      const existing = await transaction.postLike.findUnique({ where: { userId_postId: { userId: user.id, postId } } });
      if (existing) await transaction.postLike.delete({ where: { userId_postId: { userId: user.id, postId } } });
      else await transaction.postLike.create({ data: { userId: user.id, postId } });
      const likes = await transaction.postLike.count({ where: { postId } });
      await transaction.post.update({ where: { id: postId }, data: { likes } });
      return { liked: !existing, likes };
    });
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}
