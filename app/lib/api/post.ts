'use server';

import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { peoples } from '@/app/lib/peoples';
import { getCurrentUser } from './user';
import { prisma } from '../prisma';

type CreatePostData = {
    title: string;
    content: string;
    ethnicGroupId: string;
    tags: string;
    images: File[];
  };

export async function uploadImage(file: File) {
    try {
      if (file.size > 5 * 1024 * 1024) {
        return { 
          success: false, 
          error: `Изображение "${file.name}" превышает максимальный размер 5MB` 
        };
      }
  
      if (!file.type.startsWith('image/')) {
        return { 
          success: false, 
          error: `Файл "${file.name}" не является изображением` 
        };
      }
  
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `posts/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      
      const blob = await put(fileName, file, {
        access: 'public',
        contentType: file.type,
      });
      
      return { 
        success: true, 
        url: blob.url 
      };
  
    } catch (error) {
      console.error(error);
      return { 
        success: false, 
        error: `Ошибка загрузки изображения ${file.name}` 
      };
    }
  }
  
  export async function createPost(formData: CreatePostData) {
    try {
  
      const user = await getCurrentUser();
      
      if (!user) {
        return { 
          success: false, 
          error: 'Необходима авторизация для создания поста' 
        };
      }
  
      const ethnicGroup = peoples.find(p => p.id === formData.ethnicGroupId);
      
      if (!ethnicGroup) {
        return { 
          success: false, 
          error: 'Выбранный народ не найден' 
        };
      }
  
      const imageUrls: string[] = [];
      
      for (const file of formData.images) {
        try {
          if (file.size > 5 * 1024 * 1024) {
            return { 
              success: false, 
              error: `Изображение "${file.name}" превышает максимальный размер 5MB` 
            };
          }
  
          if (!file.type.startsWith('image/')) {
            return { 
              success: false, 
              error: `Файл "${file.name}" не является изображением` 
            };
          }
  
          const fileExtension = file.name.split('.').pop() || 'jpg';
          const fileName = `posts/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
          
          const blob = await put(fileName, file, {
            access: 'public',
            contentType: file.type,
          });
          
          imageUrls.push(blob.url);
        } catch (uploadError) {
          console.error(uploadError);
          return { 
            success: false, 
            error: `Ошибка загрузки изображения ${file.name}` 
          };
        }
      }
  
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 10);
  
      const post = await prisma.post.create({
        data: {
          title: formData.title.trim(),
          content: formData.content.trim(),
          ethnicGroupId: formData.ethnicGroupId || null,
          tags: tagsArray,
          images: imageUrls,
          authorId: user.id,
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
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
      console.error(error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Не удалось создать пост',
        isAuthError: error instanceof Error && 
          (error.message === 'Необходима авторизация для создания поста')
      };
    }
  }