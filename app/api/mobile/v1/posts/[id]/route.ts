import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { peoples } from "@/app/lib/peoples";
import { requireMobileUser } from "../../../_lib/auth";
import { commentDto, postDto, publicOrigin } from "../../../_lib/dto";
import { allowedMediaUrls } from "../../../_lib/media";
import { fail, ok, serverError } from "../../../_lib/response";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireMobileUser(request);
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true } },
        comments: {
          take: 100,
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true } } },
        },
        _count: { select: { comments: true } },
      },
    });
    if (!post || (post.status !== "approved" && post.authorId !== user?.id && user?.role !== "ADMIN")) {
      return fail("Публикация не найдена", 404, "NOT_FOUND");
    }
    const liked = user ? Boolean(await prisma.postLike.findUnique({ where: { userId_postId: { userId: user.id, postId: post.id } } })) : false;
    const origin = publicOrigin(request);
    return ok({
      ...postDto(origin, post, liked),
      comments: post.comments.map(comment => commentDto(origin, comment)),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const { id } = await context.params;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return fail("Публикация не найдена", 404, "NOT_FOUND");
    if (existing.authorId !== user.id && user.role !== "ADMIN") return fail("Недостаточно прав", 403, "FORBIDDEN");
    const body = await request.json();
    const title = String(body.title ?? existing.title).trim();
    const content = String(body.content ?? existing.content).trim();
    const ethnicGroupId = String(body.ethnicGroupId ?? existing.ethnicGroupId ?? "");
    const tags = Array.isArray(body.tags) ? body.tags.map((value: unknown) => String(value).trim()).filter((value: string) => value && value.length <= 30).slice(0, 10) : existing.tags;
    const media = allowedMediaUrls(body.media, existing.images);
    if (!title || title.length > 200) return fail("Некорректный заголовок");
    if (!content || content.length > 20000) return fail("Некорректный текст");
    if (!peoples.some(person => person.id === ethnicGroupId)) return fail("Выбранный народ не найден");

    const post = await prisma.post.update({
      where: { id },
      data: { title, content, ethnicGroupId, tags, images: media, status: user.role === "ADMIN" ? existing.status : "pending" },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true } },
        _count: { select: { comments: true } },
      },
    });
    return ok(postDto(publicOrigin(request), post));
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const { id } = await context.params;
    const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
    if (!post) return fail("Публикация не найдена", 404, "NOT_FOUND");
    if (post.authorId !== user.id && user.role !== "ADMIN") return fail("Недостаточно прав", 403, "FORBIDDEN");
    await prisma.post.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
