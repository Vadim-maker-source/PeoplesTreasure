import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { peoples } from "@/app/lib/peoples";
import { consumeRateLimit } from "@/app/lib/rate-limit";
import { requireMobileUser } from "../../_lib/auth";
import { postDto } from "../../_lib/dto";
import { allowedMediaUrls } from "../../_lib/media";
import { fail, ok, serverError } from "../../_lib/response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
    const limit = Math.min(30, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 10));
    const group = request.nextUrl.searchParams.get("group");
    const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100);
    const sort = request.nextUrl.searchParams.get("sort") === "popular" ? "popular" : "newest";
    const where = {
      status: "approved",
      ...(group ? { ethnicGroupId: group } : {}),
      ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" as const } }, { content: { contains: query, mode: "insensitive" as const } }] } : {}),
    };
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sort === "popular" ? [{ likes: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);
    const liked = new Set(user ? (await prisma.postLike.findMany({
      where: { userId: user.id, postId: { in: posts.map(post => post.id) } },
      select: { postId: true },
    })).map(item => item.postId) : []);
    return ok({
      items: posts.map(post => postDto(request.nextUrl.origin, post, liked.has(post.id))),
      page,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const rateLimit = await consumeRateLimit("mobile-create-post", user.id, 10, 60 * 60 * 1000);
    if (!rateLimit.allowed) return fail("Слишком много публикаций", 429, "RATE_LIMITED");
    const body = await request.json();
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const ethnicGroupId = String(body.ethnicGroupId || "");
    const tags = Array.isArray(body.tags) ? body.tags.map((value: unknown) => String(value).trim()).filter((value: string) => value && value.length <= 30).slice(0, 10) : [];
    const media = allowedMediaUrls(body.media);
    if (!title || title.length > 200) return fail("Заголовок должен содержать от 1 до 200 символов");
    if (!content || content.length > 20000) return fail("Текст должен содержать от 1 до 20000 символов");
    if (!peoples.some(person => person.id === ethnicGroupId)) return fail("Выбранный народ не найден");

    const post = await prisma.post.create({
      data: { title, content, ethnicGroupId, tags, images: media, authorId: user.id, status: "pending" },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true } },
        _count: { select: { comments: true } },
      },
    });
    return ok(postDto(request.nextUrl.origin, post), 201);
  } catch (error) {
    return serverError(error);
  }
}
