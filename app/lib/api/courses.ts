'use server'

import { prisma } from '../prisma';
import { getCurrentUser } from './user';
import { ethnicGroupQuestions } from '../questions';

export type Question = {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

export type TestResult = {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  answers: {
    questionId: number;
    selectedAnswer: number;
    selectedOption?: string;
  }[];
};

export async function getOrCreateTest(
    ethnicGroupId: string,
    ethnicGroupName: string
  ) {
    try {
      const user = await getCurrentUser();
      if (!user) return { success: false, error: 'Необходима авторизация' };

      let course = await prisma.course.findUnique({
        where: {
          userId_ethnicGroupId: {
            userId: user.id,
            ethnicGroupId,
          },
        },
      });

      if (!course) {
        course = await prisma.course.create({
          data: {
            userId: user.id,
            ethnicGroupId,
            ethnicGroupName,
            completed: false,
            score: 0,
          },
        });
      }

      return {
        success: true,
        course,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось получить курс',
      };
    }
  }

  export async function submitTestResults(
    ethnicGroupId: string,
    ethnicGroupName: string,
    results: TestResult
  ) {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return {
          success: true,
          message: 'Войдите в аккаунт для сохранения результатов',
          userAuthenticated: false,
        };
      }

      const canonicalQuestions = ethnicGroupQuestions[ethnicGroupId];
      if (!canonicalQuestions?.length) {
        return { success: false, error: 'Тест не найден' };
      }

      if (!Array.isArray(results.answers) || results.answers.length !== canonicalQuestions.length) {
        return { success: false, error: 'Некорректные ответы теста' };
      }

      const answers = canonicalQuestions.map((question) => {
        const submitted = results.answers.find((answer) => answer.questionId === question.id);
        const selectedOption = submitted?.selectedOption;
        const correctOption = question.options[question.correctAnswer];
        return {
          questionId: question.id,
          selectedAnswer: typeof submitted?.selectedAnswer === 'number' ? submitted.selectedAnswer : -1,
          selectedOption: typeof selectedOption === 'string' ? selectedOption : '',
          isCorrect: selectedOption === correctOption,
        };
      });
      const score = answers.filter((answer) => answer.isCorrect).length;
      const total = canonicalQuestions.length;
      const passed = score === total;
      const now = new Date();

      const course = await prisma.course.upsert({
        where: {
          userId_ethnicGroupId: {
            userId: user.id,
            ethnicGroupId,
          },
        },
        update: {
          completed: passed,
          score,
          answers,
          completedAt: passed ? now : null,
          updatedAt: now,
        },
        create: {
          userId: user.id,
          ethnicGroupId,
          ethnicGroupName,
          completed: passed,
          score,
          answers,
          completedAt: passed ? now : null,
        },
      });

      const certificateUrl = null;

      return {
        success: true,
        course: { ...course, certificateUrl },
        passed,
        score,
        total,
        userAuthenticated: true,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось сохранить результаты',
      };
    }
  }

export async function getUserCourses() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Необходима авторизация');

    const courses = await prisma.course.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return {
      success: true,
      courses,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось получить курсы',
    };
  }
}

export async function checkCourseCompletion(ethnicGroupId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, completed: false };

    const course = await prisma.course.findUnique({
      where: {
        userId_ethnicGroupId: {
          userId: user.id,
          ethnicGroupId,
        },
      },
    });

    return {
      success: true,
      completed: course?.completed || false,
      course,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось проверить курс',
    };
  }
}
