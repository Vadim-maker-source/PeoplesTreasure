import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { consumeRateLimit } from "@/app/lib/rate-limit";
import { requireMobileUser } from "../../../../_lib/auth";
import { commentDto, publicOrigin } from "../../../../_lib/dto";
import { fail, ok, serverError } from "../../../../_lib/response";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const rateLimit = await consumeRateLimit("mobile-comment", user.id, 30, 5 * 60 * 1000);
    if (!rateLimit.allowed) return fail("Слишком много комментариев", 429, "RATE_LIMITED");
    const { id: postId } = await context.params;
    const body = await request.json();
    const content = String(body.content || "").trim();
    if (!content || content.length > 2000) return fail("Комментарий должен содержать от 1 до 2000 символов");
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { status: true } });
    if (!post || post.status !== "approved") return fail("Публикация не найдена", 404, "NOT_FOUND");
    const comment = await prisma.comment.create({
      data: { content, postId, authorId: user.id },
      include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true } } },
    });
    return ok(commentDto(publicOrigin(request), comment), 201);
  } catch (error) {
    return serverError(error);
  }
}
