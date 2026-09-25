import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireMobileUser } from "../../../_lib/auth";
import { postDto, publicOrigin } from "../../../_lib/dto";
import { fail, ok, serverError } from "../../../_lib/response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request, true);
    if (!user) return fail("Доступ запрещён", 403, "FORBIDDEN");
    const posts = await prisma.post.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true } },
        _count: { select: { comments: true } },
      },
    });
    return ok(posts.map(post => postDto(publicOrigin(request), post)));
  } catch (error) {
    return serverError(error);
  }
}
