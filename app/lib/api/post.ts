'use server';

import { revalidatePath } from 'next/cache';
import { peoples } from '@/app/lib/peoples';
import { getCurrentUser } from './user';
import { prisma } from '../prisma';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

const s3Client = new S3Client({
  endpoint: process.env.YANDEX_ENDPOINT?.trim() || "https://storage.yandexcloud.net",
  region: process.env.YANDEX_REGION || "ru-central1",
  credentials: {
    accessKeyId: process.env.YANDEX_ACCESS!,
    secretAccessKey: process.env.YANDEX_SECRET!,
  },
  forcePathStyle: true,
});

type CreatePostData = {
  title: string;
  content: string;
  ethnicGroupId: string;
  tags: string;
  images: File[];
  videos: File[]; // Добавляем видео
};

// Функция для проверки типа файла
function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const ext = file.name.split('.').pop()?.toLowerCase() || 
    (isVideoFile(file) ? 'mp4' : 'jpg');
  
  const safeExt = isVideoFile(file) 
    ? ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext) ? ext : 'mp4'
    : ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  
  const key = `posts/${Date.now()}-${randomBytes(6).toString('hex')}.${safeExt}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.YANDEX_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return { 
    url: `https://storage.yandexcloud.net/peoples-treasure/${key}`
  };
}

export async function createPost(formData: CreatePostData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Необходима авторизация для создания поста' };
    }

    if (!peoples.some(p => p.id === formData.ethnicGroupId)) {
      return { success: false, error: 'Выбранный народ не найден' };
    }

    const mediaUrls: string[] = [];
    
    // Загрузка изображений
    for (const file of formData.images) {
      if (file.size > 5 * 1024 * 1024) {
        return { 
          success: false, 
          error: `Изображение "${file.name}" превышает лимит 5 МБ` 
        };
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return { 
          success: false, 
          error: `Недопустимый формат изображения "${file.name}". Разрешены: JPG, PNG, WebP, GIF` 
        };
      }

      try {
        const { url } = await uploadFile(file);
        mediaUrls.push(url);
      } catch (err) {
        console.error('Ошибка загрузки файла:', file.name, err);
        return { 
          success: false, 
          error: `Ошибка загрузки "${file.name}": ${err instanceof Error ? err.message : 'Серверная ошибка'}` 
        };
      }
    }

    // Загрузка видео
    for (const file of formData.videos) {
      if (file.size > 50 * 1024 * 1024) { // 50MB для видео
        return { 
          success: false, 
          error: `Видео "${file.name}" превышает лимит 50 МБ` 
        };
      }
      
      const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedTypes.includes(file.type)) {
        return { 
          success: false, 
          error: `Недопустимый формат видео "${file.name}". Разрешены: MP4, WebM, MOV, AVI` 
        };
      }

      try {
        const { url } = await uploadFile(file);
        mediaUrls.push(url);
      } catch (err) {
        console.error('Ошибка загрузки видео:', file.name, err);
        return { 
          success: false, 
          error: `Ошибка загрузки "${file.name}": ${err instanceof Error ? err.message : 'Серверная ошибка'}` 
        };
      }
    }

    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag && tag.length <= 30)
      .slice(0, 10);

    const post = await prisma.post.create({
      data: {
        title: formData.title.trim().slice(0, 200),
        content: formData.content.trim(),
        ethnicGroupId: formData.ethnicGroupId,
        tags: tagsArray,
        images: mediaUrls, // Сохраняем все медиа в одном массиве
        authorId: user.id,
      },
      include: {
        author: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    revalidatePath('/');
    revalidatePath('/posts');
    
    return { 
      success: true, 
      message: 'Пост успешно создан!',
      postId: post.id,
      redirectUrl: `/posts/${post.id}`,
    };

  } catch (error) {
    console.error('Критическая ошибка создания поста:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка сервера',
    };
  }
}