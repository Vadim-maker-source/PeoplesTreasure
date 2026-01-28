'use server'

import { prisma } from '../prisma';
import { getCurrentUser } from './user';

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
    correctAnswer: number;
    isCorrect: boolean;
  }[];
};

export async function getOrCreateTest(
    userId: string,
    ethnicGroupId: string, 
    ethnicGroupName: string
  ) {
    try {
      let course = await prisma.course.findUnique({
        where: {
          userId_ethnicGroupId: {
            userId,
            ethnicGroupId,
          },
        },
      });
  
      if (!course) {
        course = await prisma.course.create({
          data: {
            userId,
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
  
      const passed = results.passed;
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
          score: results.score,
          answers: results.answers,
          completedAt: passed ? now : null,
          updatedAt: now,
        },
        create: {
          userId: user.id,
          ethnicGroupId,
          ethnicGroupName,
          completed: passed,
          score: results.score,
          answers: results.answers,
          completedAt: passed ? now : null,
        },
      });
  
      let certificateUrl = null;
  
      return {
        success: true,
        course: { ...course, certificateUrl },
        passed,
        score: results.score,
        total: results.total,
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