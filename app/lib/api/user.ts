'use server';

import { hash, compare } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import transporter from '../nodemailer';
import { prisma } from '../prisma';
import { consumeRateLimit } from '../rate-limit';
import { uploadFile } from '../storage';

export type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  password: string;
  confirmPassword?: string;
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  phone: string;
  role: string;
  avatar?: string | null;
  region?: string | null;
  bio?: string | null;
  verified: boolean;
  unreadSupportCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithRelations = User & {
  posts?: any[];
  comments?: any[];
  _count?: {
    posts?: number;
    comments?: number;
    favorites?: number;
  };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const verificationLifetimeMs = 15 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function verificationHash(email: string, code: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('Сервер авторизации не настроен');
  return createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');
}

function hashesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function sendVerificationCode(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!emailPattern.test(email)) return { error: 'Неверный формат email' };

  try {
    const requestHeaders = await headers();
    const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || 'local';
    const [emailLimit, ipLimit] = await Promise.all([
      consumeRateLimit('verification-email', email, 3, verificationLifetimeMs),
      consumeRateLimit('verification-ip', ip, 20, verificationLifetimeMs),
    ]);
    if (!emailLimit.allowed || !ipLimit.allowed) {
      return { error: 'Слишком много запросов. Попробуйте позже.' };
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) return { success: true };

    const code = randomInt(100000, 1000000).toString();
    await prisma.emailVerification.upsert({
      where: { email },
      create: {
        email,
        tokenHash: verificationHash(email, code),
        expiresAt: new Date(Date.now() + verificationLifetimeMs),
      },
      update: {
        tokenHash: verificationHash(email, code),
        expiresAt: new Date(Date.now() + verificationLifetimeMs),
        sentAt: new Date(),
        attempts: 0,
      },
    });

    await transporter.sendMail({
      from: `"Сокровища Народов" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Код подтверждения регистрации',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px"><h1 style="color:#FF7340">Сокровища Народов</h1><p>Ваш код подтверждения:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>Код действителен 15 минут.</p></div>`,
      text: `Ваш код подтверждения: ${code}\nКод действителен 15 минут.`,
    });

    return { success: true };
  } catch (error) {
    console.error('Ошибка отправки кода:', error);
    await prisma.emailVerification.deleteMany({ where: { email } }).catch(() => undefined);
    return { error: 'Не удалось отправить код подтверждения. Попробуйте позже.' };
  }
}

export async function createUser(data: RegisterData, verificationCode: string) {
  try {
    const errors: string[] = [];

    if (!data.firstName?.trim()) errors.push("Имя обязательно");
    if (!data.lastName?.trim()) errors.push("Фамилия обязательна");
    if (!data.email?.trim()) errors.push("Email обязателен");
    if (!data.password) errors.push("Пароль обязателен");
    if (!data.phone?.trim()) errors.push("Телефон обязателен");
    if (!data.age) errors.push("Возраст обязателен");

    if (errors.length > 0) {
      return { error: errors.join(". ") };
    }

    if (data.password.length < 8 || data.password.length > 128) {
      return { error: 'Пароль должен содержать от 8 до 128 символов' };
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
      return { error: 'Пароли не совпадают' };
    }

    const email = normalizeEmail(data.email);
    if (!emailPattern.test(email)) {
      return { error: 'Неверный формат email' };
    }

    if (data.age < 6 || data.age > 120) {
      return { error: 'Возраст должен быть от 6 до 120 лет' };
    }
    if (data.firstName.trim().length > 80 || data.lastName.trim().length > 80) {
      return { error: 'Имя или фамилия слишком длинные' };
    }
    if (data.phone.trim().length > 30) {
      return { error: 'Номер телефона слишком длинный' };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { error: 'Не удалось завершить регистрацию' };
    }

    const verification = await prisma.emailVerification.findUnique({ where: { email } });
    if (!verification || verification.expiresAt <= new Date() || verification.attempts >= 5) {
      return { error: 'Код истёк. Запросите новый код.' };
    }

    const claimedAttempt = await prisma.emailVerification.updateMany({
      where: {
        email,
        tokenHash: verification.tokenHash,
        expiresAt: { gt: new Date() },
        attempts: { lt: 5 },
      },
      data: { attempts: { increment: 1 } },
    });
    if (claimedAttempt.count !== 1) return { error: 'Код истёк. Запросите новый код.' };

    const submittedHash = verificationHash(email, verificationCode.trim());
    if (!hashesMatch(verification.tokenHash, submittedHash)) {
      return { error: 'Неверный код подтверждения' };
    }

    const hashedPassword = await hash(data.password, 12);

    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          email,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          age: data.age,
          phone: data.phone.trim(),
          password: hashedPassword,
          role: 'USER',
          verified: true,
          emailVerified: new Date(),
        }
      });
      await transaction.emailVerification.delete({ where: { email } });
      return createdUser;
    });

    const { password, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      message: 'Регистрация успешна!'
    };

  } catch (error: any) {
    console.error(error);

    if (error.code === 'P2002') {
      return { error: 'Пользователь с таким email уже существует' };
    }

    return { error: 'Произошла ошибка при регистрации. Попробуйте позже.' };
  }
}

export async function getUserById(id: string): Promise<UserWithRelations | null> {
  try {
    const session = await getServerSession(authOptions);
    const canSeePrivateData = session?.user?.id === id || session?.user?.role === 'ADMIN';
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        phone: true,
        role: true,
        avatar: true,
        region: true,
        bio: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        posts: {
          where: canSeePrivateData ? undefined : { status: 'approved' },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            content: true,
            images: true,
            tags: true,
            likes: true,
            ethnicGroupId: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              }
            },
            _count: {
              select: {
                comments: true,
              }
            }
          }
        },
        comments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            post: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        _count: {
          select: {
            posts: true,
            comments: true,
          }
        }
      }
    });

    if (!user) return null;

    if (!canSeePrivateData) {
      const { email, phone, age, role, ...publicUser } = user;
      return publicUser as any;
    }

    return user as any;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        phone: true,
        role: true,
        avatar: true,
        region: true,
        bio: true,
        verified: true,
        unreadSupportCount: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          }
        }
      }
    });

    if (!user) return null;

    return user as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  age?: number;
  phone?: string;
  bio?: string;
  ethnicities?: string[];
  region?: string;
  avatar?: string;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Не авторизован' };
    }
    if (data.firstName && !data.firstName.trim()) {
      return { error: 'Имя не может быть пустым' };
    }

    if (data.lastName && !data.lastName.trim()) {
      return { error: 'Фамилия не может быть пустой' };
    }

    if (data.age && (data.age < 6 || data.age > 120)) {
      return { error: 'Возраст должен быть от 6 до 120 лет' };
    }
    if (data.firstName && data.firstName.trim().length > 80) return { error: 'Имя слишком длинное' };
    if (data.lastName && data.lastName.trim().length > 80) return { error: 'Фамилия слишком длинная' };
    if (data.phone && data.phone.trim().length > 30) return { error: 'Номер телефона слишком длинный' };
    if (data.bio && data.bio.trim().length > 2000) return { error: 'Описание слишком длинное' };
    if (data.region && data.region.trim().length > 120) return { error: 'Название региона слишком длинное' };

    const updateData: any = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.age !== undefined) updateData.age = data.age;
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.bio !== undefined) updateData.bio = data.bio?.trim();
    if (data.ethnicities !== undefined) updateData.ethnicities = data.ethnicities;
    if (data.region !== undefined) updateData.region = data.region?.trim();
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        phone: true,
        role: true,
        avatar: true,
        region: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    revalidatePath('/profile');
    revalidatePath('/settings');

    return {
      success: true,
      user: updatedUser,
      message: 'Профиль успешно обновлен'
    };
  } catch (error) {
    console.error(error);
    return { error: 'Ошибка при обновлении профиля' };
  }
}

export async function deleteAccount(password: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Не авторизован' };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true }
    });

    if (!user?.password) {
      return { error: 'Пользователь не найден' };
    }

    const isValid = await compare(password, user.password);

    if (!isValid) {
      return { error: 'Неверный пароль' };
    }

    await prisma.$transaction([
      prisma.post.deleteMany({
        where: { authorId: session.user.id }
      }),
      prisma.comment.deleteMany({
        where: { authorId: session.user.id }
      }),
      prisma.account.deleteMany({
        where: { userId: session.user.id }
      }),
      prisma.session.deleteMany({
        where: { userId: session.user.id }
      }),
      prisma.user.delete({
        where: { id: session.user.id }
      })
    ]);

    return {
      success: true,
      message: 'Аккаунт успешно удален'
    };
  } catch (error) {
    console.error(error);
    return { error: 'Ошибка при удалении аккаунта' };
  }
}

export async function updateAvatar(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Не авторизован' };
    }

    const file = formData.get('avatar') as File;

    if (!file) {
      return { error: 'Файл не выбран' };
    }

    if (!file.type.startsWith('image/')) {
      return { error: 'Можно загружать только изображения' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { error: 'Размер файла не должен превышать 5MB' };
    }

    const uploadedFile = await uploadFile(file, 'image');

    if (!uploadedFile?.url) {
      return { error: 'Не удалось загрузить файл' };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: uploadedFile.url },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        phone: true,
        role: true,
        avatar: true,
        region: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    revalidatePath('/profile');
    revalidatePath(`/profile/${session.user.id}`);

    return {
      success: true,
      user: updatedUser,
      message: 'Аватар успешно обновлен'
    };
  } catch (error) {
    console.error('Error updating avatar:', error);
    return { error: 'Ошибка при обновлении аватара' };
  }
}

export async function removeAvatar() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Не авторизован' };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        phone: true,
        role: true,
        avatar: true,
        region: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    revalidatePath('/profile');
    revalidatePath(`/profile/${session.user.id}`);

    return {
      success: true,
      user: updatedUser,
      message: 'Аватар удален'
    };
  } catch (error) {
    console.error('Error removing avatar:', error);
    return { error: 'Ошибка при удалении аватара' };
  }
}
