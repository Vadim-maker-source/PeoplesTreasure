import type { NextRequest } from "next/server";
import { ethnicGroupQuestions } from "@/app/lib/questions";
import { peoples } from "@/app/lib/peoples";
import { prisma } from "@/app/lib/prisma";
import { consumeRateLimit } from "@/app/lib/rate-limit";
import { requireMobileUser } from "../../../../_lib/auth";
import { fail, ok, serverError } from "../../../../_lib/response";

type Context = { params: Promise<{ ethnicGroupId: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const user = await requireMobileUser(request);
    if (!user) return fail("Необходима авторизация", 401, "UNAUTHORIZED");
    const limit = await consumeRateLimit("mobile-quiz", user.id, 30, 10 * 60 * 1000);
    if (!limit.allowed) return fail("Слишком много попыток", 429, "RATE_LIMITED");
    const { ethnicGroupId } = await context.params;
    const questions = ethnicGroupQuestions[ethnicGroupId];
    const person = peoples.find(item => item.id === ethnicGroupId);
    if (!questions || !person) return fail("Тест не найден", 404, "NOT_FOUND");
    const submitted = (await request.json()).answers;
    if (!Array.isArray(submitted) || submitted.length !== questions.length) return fail("Ответьте на все вопросы");

    const answers = questions.map(question => {
      const answer = submitted.find((item: unknown) => typeof item === "object" && item !== null && Number((item as { questionId?: unknown }).questionId) === question.id) as { selectedIndex?: unknown } | undefined;
      const selectedIndex = Number(answer?.selectedIndex);
      const isCorrect = Number.isInteger(selectedIndex) && selectedIndex === question.correctAnswer;
      return { questionId: question.id, selectedIndex, isCorrect, correctIndex: question.correctAnswer, explanation: question.explanation || null };
    });
    const score = answers.filter(answer => answer.isCorrect).length;
    const total = questions.length;
    const passed = score === total;
    const course = await prisma.course.upsert({
      where: { userId_ethnicGroupId: { userId: user.id, ethnicGroupId } },
      create: { userId: user.id, ethnicGroupId, ethnicGroupName: person.name, score, completed: passed, completedAt: passed ? new Date() : null, answers },
      update: { score, completed: passed, completedAt: passed ? new Date() : null, answers },
    });
    return ok({ score, total, percentage: Math.round(score / total * 100), passed, answers, courseId: course.id });
  } catch (error) {
    return serverError(error);
  }
}
