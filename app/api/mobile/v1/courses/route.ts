import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireMobileUser } from "../../_lib/auth";
import { fail, ok, serverError } from "../../_lib/response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const courses = await prisma.course.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
    return ok(courses.map(course => ({
      id: course.id,
      ethnicGroupId: course.ethnicGroupId,
      ethnicGroupName: course.ethnicGroupName,
      score: course.score,
      completed: course.completed,
      completedAt: course.completedAt?.toISOString() || null,
      updatedAt: course.updatedAt.toISOString(),
    })));
  } catch (error) {
    return serverError(error);
  }
}
