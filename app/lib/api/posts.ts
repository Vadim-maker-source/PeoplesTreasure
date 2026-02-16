'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { getCurrentUser } from "./user";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";
import { peoples } from "../peoples";
import { sendModerationEmail } from "../nodemailer";

export type PostWithAuthor = {
  id: string;
  title: string;
  content: string;
  ethnicGroupId: string | null;
  images: string[];
  tags: string[];
  likes: number;
  likedByUser?: boolean;
  author: {
    id?: string
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    verified?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  commentsCount: number;
};

type UpdatePostData = {
  title: string
  content: string
  tags: string[]
  ethnicGroupId: string | null
  existingImages: string[]
  newImages: File[]
  newVideos: File[]
}

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
  videos: File[];
};

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
      if (file.size > 50 * 1024 * 1024) {
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
        images: mediaUrls,
        authorId: user.id,
        status: 'pending', // По умолчанию на модерации
      },
      include: {
        author: {
          select: { 
            firstName: true, 
            lastName: true, 
            email: true,
            id: true 
          },
        },
      },
    });

    // Отправка уведомления админу
    try {
      await sendModerationEmail({
        postId: post.id,
        postTitle: post.title,
        authorName: `${user.firstName} ${user.lastName}`,
        authorEmail: user.email,
      });
    } catch (emailError) {
      console.error('Ошибка отправки email админу:', emailError);
      // Не прерываем создание поста из-за ошибки email
    }

    revalidatePath('/');
    revalidatePath('/posts');
    revalidatePath('/admin/moderate');
    
    return { 
      success: true, 
      message: 'Пост успешно создан и отправлен на модерацию!',
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

// Функция для модерации поста
export async function moderatePost(postId: string, action: 'approve' | 'reject') {
  try {
    const user = await getCurrentUser();
    
    // Проверяем, что пользователь - админ (id = 1)
    if (!user || user.id !== '1') {
      return { 
        success: false, 
        error: 'Доступ запрещен. Только администратор может модерировать посты' 
      };
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!post) {
      return { success: false, error: 'Пост не найден' };
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
      },
    });

    // Здесь можно добавить отправку email автору о результате модерации
    // await sendModerationResultEmail(post.author.email, post.title, action);

    revalidatePath('/');
    revalidatePath('/posts');
    revalidatePath('/forum');
    revalidatePath('/admin/moderate');

    return { 
      success: true, 
      message: `Пост успешно ${action === 'approve' ? 'одобрен' : 'отклонен'}`,
      post: updatedPost
    };

  } catch (error) {
    console.error('Ошибка модерации поста:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка сервера',
    };
  }
}

// Функция для получения постов на модерацию
export async function getPendingPosts() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.id !== '1') {
      throw new Error('Доступ запрещен');
    }

    const posts = await prisma.post.findMany({
      where: {
        status: 'pending',
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return posts.map(post => ({
      ...post,
      commentsCount: post._count.comments,
    }));

  } catch (error) {
    console.error('Ошибка загрузки постов на модерацию:', error);
    throw new Error('Не удалось загрузить посты на модерацию');
  }
}

export async function getPendingPostsCount() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.id !== '1') {
      return 0;
    }

    const count = await prisma.post.count({
      where: {
        status: 'pending',
      },
    });

    return count;
  } catch (error) {
    console.error('Ошибка получения количества постов на модерацию:', error);
    return 0;
  }
}

export async function getAllPosts(
  page: number = 1, 
  limit: number = 10,
  sortBy: 'newest' | 'popular' = 'newest'
) {
  try {
    const user = await getCurrentUser();
    const skip = (page - 1) * limit;
    
    let orderBy = {};
    if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'popular') {
      orderBy = [
        { likes: 'desc' },
        { createdAt: 'desc' }
      ];
    }
    
    const posts = await prisma.post.findMany({
      where: {
        status: 'approved', // Только одобренные посты
      },
      skip,
      take: limit,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            verified: true
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    const totalCount = await prisma.post.count({
      where: {
        status: 'approved',
      },
    });
    const totalPages = Math.ceil(totalCount / limit);

    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      let likedByUser = false;
      if (user) {
        likedByUser = post.likes > 0 && user.id === post.authorId;
      }
      
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        ethnicGroupId: post.ethnicGroupId,
        images: post.images,
        tags: post.tags,
        likes: post.likes,
        likedByUser,
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        commentsCount: post._count.comments,
      };
    }));

    return {
      posts: postsWithLikes,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error(error);
    throw new Error('Не удалось загрузить посты');
  }
}

// Обновленная функция getPostsByEthnicGroup (только одобренные)
export async function getPostsByEthnicGroup(
  ethnicGroupId: string, 
  page: number = 1, 
  limit: number = 10,
  sortBy: 'newest' | 'popular' = 'newest'
) {
  try {
    const user = await getCurrentUser();
    const skip = (page - 1) * limit;
    
    let orderBy = {};
    if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'popular') {
      orderBy = [
        { likes: 'desc' },
        { createdAt: 'desc' }
      ];
    }
    
    const posts = await prisma.post.findMany({
      where: {
        ethnicGroupId,
        status: 'approved', // Только одобренные посты
      },
      skip,
      take: limit,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            verified: true
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    const totalCount = await prisma.post.count({
      where: { 
        ethnicGroupId,
        status: 'approved',
      },
    });
    
    const totalPages = Math.ceil(totalCount / limit);

    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      let likedByUser = false;
      if (user) {
        likedByUser = post.likes > 0 && user.id === post.authorId;
      }
      
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        ethnicGroupId: post.ethnicGroupId,
        images: post.images,
        tags: post.tags,
        likes: post.likes,
        likedByUser,
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        commentsCount: post._count.comments,
      };
    }));

    return {
      posts: postsWithLikes,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error(error);
    throw new Error('Не удалось загрузить посты по выбранному народу');
  }
}

// Обновленная функция getPostById (показываем пост только если он одобрен или автор/админ)
export async function getPostById(id: string) {
  try {
    const user = await getCurrentUser();
    
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            bio: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                verified: true
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    // Проверяем доступ к посту
    const isAuthor = user && post.authorId === user.id;
    const isAdmin = user && user.id === '1';
    
    // Если пост не одобрен и пользователь не автор и не админ - не показываем
    if (post.status !== 'approved' && !isAuthor && !isAdmin) {
      return null;
    }

    let likedByUser = false;
    if (user) {
      likedByUser = post.likes > 0 && user.id === post.authorId;
    }

    return {
      ...post,
      likedByUser,
      commentsCount: post._count.comments,
    };
  } catch (error) {
    console.error(error);
    throw new Error('Не удалось загрузить пост');
  }
}

export async function getPopularPosts(limit: number = 10) {
  try {
    const posts = await prisma.post.findMany({
      take: limit,
      orderBy: {
        likes: 'desc',
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            verified: true
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      ethnicGroupId: post.ethnicGroupId,
      images: post.images,
      tags: post.tags,
      likes: post.likes,
      author: post.author,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      commentsCount: post._count.comments,
    }));
  } catch (error) {
    console.error(error);
    throw new Error('Не удалось загрузить популярные посты');
  }
}

export async function toggleLike(postId: string) {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error('Необходима авторизация');
      }
  
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { likes: true, authorId: true }
      });
  
      if (!post) {
        throw new Error('Пост не найден');
      }
  
      const newLikes = post.likes > 0 ? post.likes - 1 : post.likes + 1;
      
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          likes: newLikes,
        },
      });
  
      return {
        success: true,
        likes: updatedPost.likes,
        liked: newLikes > post.likes,
      };
    } catch (error) {
      console.error(error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Не удалось поставить лайк',
        isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
      };
    }
  }
  



export async function createComment(postId: string, content: string) {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error('Необходима авторизация');
      }
  
      const comment = await prisma.comment.create({
        data: {
          content: content.trim(),
          authorId: user.id,
          postId,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              verified: true
            },
          },
        },
      });
  
    revalidatePath(`/posts/${postId}`);
      
    return {
      success: true,
      comment,
    };
  } catch (error) {
    console.error(error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Не удалось создать комментарий',
        isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
      };
  }
}

export async function deleteComment(id: string, authorId: string, commentId: string){
  try {
    if (id !== authorId) {
      throw new Error('Не ваш комментарий');
    }

    const comment = await prisma.comment.delete({
      where: { id: commentId }
    })

    revalidatePath(`/posts/${comment.id}`);

    return{
      success: true
    }
  } catch (error) {
    console.error(error)
    return {
      success: false, 
      error: error instanceof Error ? error.message : 'Не удалось создать комментарий',
      isAuthError: error instanceof Error && error.message === 'Не ваш комментарий'
    };
  }
}

export async function updateComment(commentId: string, content: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new Error('Комментарий не найден');
    }

    if (comment.authorId !== user.id) {
      throw new Error('Это не ваш комментарий');
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            verified: true
          },
        },
      },
    });

    revalidatePath(`/posts/${comment.postId}`);
    
    return {
      success: true,
      comment: updatedComment,
    };
  } catch (error) {
    console.error(error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Не удалось обновить комментарий',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация' || error === 'Это не ваш комментарий'
    };
  }
}

export async function deletePost(postId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (!post) {
      throw new Error('Пост не найден');
    }

    if (post.authorId !== user.id) {
      throw new Error('Это не ваш пост');
    }

    await prisma.comment.deleteMany({
      where: { postId }
    });

    await prisma.post.delete({
      where: { id: postId }
    });

    revalidatePath('/forum');
    revalidatePath(`/posts/${postId}`);
    
    return {
      success: true,
      message: 'Пост успешно удалён'
    };
  } catch (error) {
    console.error(error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Не удалось удалить пост',
      isAuthError: error instanceof Error && 
        (error.message === 'Необходима авторизация' || error.message === 'Это не ваш пост')
    };
  }
}

export async function updatePost(postId: string, data: UpdatePostData) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Необходима авторизация')

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new Error('Пост не найден')
    if (post.authorId !== user.id) throw new Error('Это не ваш пост')

    const uploadedMedia: string[] = []

    // Загрузка новых изображений
    for (const file of data.newImages) {
      const url = await uploadFile(file)
      uploadedMedia.push(String(url?.url))
    }

    // Загрузка новых видео
    for (const file of data.newVideos) {
      const url = await uploadFile(file)
      uploadedMedia.push(String(url?.url))
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: data.title,
        content: data.content,
        tags: data.tags,
        ethnicGroupId: data.ethnicGroupId,
        images: [...data.existingImages, ...uploadedMedia]
      }
    })

    revalidatePath('/forum')
    revalidatePath(`/posts/${postId}`)

    return { success: true, post: updatedPost }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка обновления'
    }
  }
}