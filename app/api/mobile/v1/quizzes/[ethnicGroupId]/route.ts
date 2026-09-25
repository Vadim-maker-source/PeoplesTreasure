import { ethnicGroupQuestions } from "@/app/lib/questions";
import { peoples } from "@/app/lib/peoples";
import { fail, ok } from "../../../_lib/response";

type Context = { params: Promise<{ ethnicGroupId: string }> };

export async function GET(_request: Request, context: Context) {
  const { ethnicGroupId } = await context.params;
  const questions = ethnicGroupQuestions[ethnicGroupId];
  const person = peoples.find(item => item.id === ethnicGroupId);
  if (!questions || !person) return fail("Тест не найден", 404, "NOT_FOUND");
  return ok({
    ethnicGroupId,
    title: `Тест: ${person.name}`,
    questions: questions.map(question => ({ id: question.id, text: question.text, options: question.options })),
  });
}
