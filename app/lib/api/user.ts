'use server';

import { hash, compare } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { revalidatePath } from 'next/cache';
import transporter from '../nodemailer';
import { prisma } from '../prisma';

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

export async function sendVerificationCode(email: string, code: string) {
  try {
    const mailOptions = {
      from: `"Сокровища Народов" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Код подтверждения регистрации',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF7340; font-size: 28px; margin: 0;">Сокровища Народов</h1>
            <p style="color: #666; font-size: 16px;">Подтверждение email адреса</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px; text-align: center;">
            <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">
              Ваш код подтверждения
            </h2>
            
            <div style="background: linear-gradient(135deg, #FF7340, #FF8A5C); padding: 20px; border-radius: 8px;">
              <span style="font-size: 30px; font-weight: bold; letter-spacing: 8px; color: white;">
                ${code}
              </span>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Код действителен в течение 15 минут.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; text-align: center;">
            <p>Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
          </div>
        </div>
      `,
      text: `Ваш код подтверждения: ${code}\nКод действителен в течение 15 минут.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Код подтверждения отправлен:', info.messageId);
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка отправки кода:', error);
    return { 
      error: 'Не удалось отправить код подтверждения. Попробуйте позже.' 
    };
  }
}

export async function createUser(
  data: RegisterData
) {
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

    if (data.password.length < 6) {
      return { error: 'Пароль должен содержать минимум 6 символов' };
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
      return { error: 'Пароли не совпадают' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { error: 'Неверный формат email' };
    }

    if (data.age < 6 || data.age > 120) {
      return { error: 'Возраст должен быть от 6 до 120 лет' };
    }

    // Проверка существующего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return { error: 'Пользователь с таким email уже существует' };
    }

    // Создаем пользователя
    const hashedPassword = await hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        age: data.age,
        phone: data.phone.trim(),
        password: hashedPassword,
        role: 'USER',
      }
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