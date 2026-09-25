'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { getCurrentUser } from "./user";
import { peoples } from "../peoples";
import { sendModerationEmail } from "../nodemailer";
import { isAdmin, requireAdmin } from "../authorization";
import { uploadFile } from "../storage";
import { consumeRateLimit } from "../rate-limit";

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
    email?: string;
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

type CreatePostData = {
  title: string;
  content: string;
  ethnicGroupId: string;
  tags: string;
  images: File[];
  videos: File[];
};

export async function createPost(formData: CreatePostData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Необходима авторизация для создания поста' };
    }
    const rateLimit = await consumeRateLimit('create-post', user.id, 10, 60 * 60 * 1000);
    if (!rateLimit.allowed) return { success: false, error: 'Слишком много публикаций. Попробуйте позже.' };

    if (!peoples.some(p => p.id === formData.ethnicGroupId)) {
      return { success: false, error: 'Выбранный народ не найден' };
    }

    const title = formData.title.trim();
    const content = formData.content.trim();
    if (!title || title.length > 200) return { success: false, error: 'Заголовок должен содержать от 1 до 200 символов' };
    if (!content || content.length > 20000) return { success: false, error: 'Текст должен содержать от 1 до 20000 символов' };
    if (formData.images.length > 10 || formData.videos.length > 5) return { success: false, error: 'Слишком много медиафайлов' };
    const totalBytes = [...formData.images, ...formData.videos].reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > 60 * 1024 * 1024) return { success: false, error: 'Общий размер файлов превышает 60 МБ' };

    const mediaUrls: string[] = [];

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
        const { url } = await uploadFile(file, 'image');
        mediaUrls.push(url);
      } catch (err) {
        console.error('Ошибка загрузки файла:', file.name, err);
        return {
          success: false,
          error: `Ошибка загрузки "${file.name}": ${err instanceof Error ? err.message : 'Серверная ошибка'}`
        };
      }
    }

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
        const { url } = await uploadFile(file, 'video');
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
        title,
        content,
        ethnicGroupId: formData.ethnicGroupId,
        tags: tagsArray,
        images: mediaUrls,
        authorId: user.id,
        status: 'pending',
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

    try {
      await sendModerationEmail({
        postId: post.id,
        postTitle: post.title,
        authorName: `${user.firstName} ${user.lastName}`,
        authorEmail: user.email,
      });
    } catch (emailError) {
      console.error(emailError);
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

export async function moderatePost(postId: string, action: 'approve' | 'reject') {
  try {
    const user = await getCurrentUser();

    if (!isAdmin(user)) {
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

export async function getPendingPosts() {
  try {
    await requireAdmin();

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
    await requireAdmin();

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
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
    const skip = (safePage - 1) * safeLimit;

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
        status: 'approved',
      },
      skip,
      take: safeLimit,
      orderBy,
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
    const totalPages = Math.ceil(totalCount / safeLimit);

    const likedPostIds = new Set(user ? (await prisma.postLike.findMany({
      where: { userId: user.id, postId: { in: posts.map(post => post.id) } },
      select: { postId: true },
    })).map(like => like.postId) : []);
    const postsWithLikes = posts.map((post) => {
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        ethnicGroupId: post.ethnicGroupId,
        images: post.images,
        tags: post.tags,
        likes: post.likes,
        likedByUser: likedPostIds.has(post.id),
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        commentsCount: post._count.comments,
      };
    });

    return {
      posts: postsWithLikes,
      pagination: {
        currentPage: safePage,
        totalPages,
        totalCount,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  } catch (error) {
    console.error(error);
    throw new Error('Не удалось загрузить посты');
  }
}

export async function getPostsByEthnicGroup(
  ethnicGroupId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'newest' | 'popular' = 'newest'
) {
  try {
    const user = await getCurrentUser();
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
    const skip = (safePage - 1) * safeLimit;

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
        status: 'approved',
      },
      skip,
      take: safeLimit,
      orderBy,
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

    const totalPages = Math.ceil(totalCount / safeLimit);

    const likedPostIds = new Set(user ? (await prisma.postLike.findMany({
      where: { userId: user.id, postId: { in: posts.map(post => post.id) } },
      select: { postId: true },
    })).map(like => like.postId) : []);
    const postsWithLikes = posts.map((post) => {
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        ethnicGroupId: post.ethnicGroupId,
        images: post.images,
        tags: post.tags,
        likes: post.likes,
        likedByUser: likedPostIds.has(post.id),
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        commentsCount: post._count.comments,
      };
    });

    return {
      posts: postsWithLikes,
      pagination: {
        currentPage: safePage,
        totalPages,
        totalCount,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  } catch (error) {
    console.error(error);
    throw new Error('Не удалось загрузить посты по выбранному народу');
  }
}

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

    const isAuthor = user && post.authorId === user.id;
    const admin = isAdmin(user);

    if (post.status !== 'approved' && !isAuthor && !admin) {
      return null;
    }

    const likedByUser = user ? Boolean(await prisma.postLike.findUnique({
      where: { userId_postId: { userId: user.id, postId: post.id } },
      select: { postId: true },
    })) : false;

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
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
    const posts = await prisma.post.findMany({
      where: { status: 'approved' },
      take: safeLimit,
      orderBy: {
        likes: 'desc',
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
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
        select: { status: true }
      });

      if (!post || post.status !== 'approved') {
        throw new Error('Пост не найден');
      }

      const existingLike = await prisma.postLike.findUnique({
        where: { userId_postId: { userId: user.id, postId } },
      });
      const result = await prisma.$transaction(async transaction => {
        if (existingLike) {
          await transaction.postLike.delete({ where: { userId_postId: { userId: user.id, postId } } });
        } else {
          await transaction.postLike.create({ data: { userId: user.id, postId } });
        }
        const likes = await transaction.postLike.count({ where: { postId } });
        await transaction.post.update({ where: { id: postId }, data: { likes } });
        return likes;
      });

      return {
        success: true,
        likes: result,
        liked: !existingLike,
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
      const rateLimit = await consumeRateLimit('create-comment', user.id, 30, 5 * 60 * 1000);
      if (!rateLimit.allowed) throw new Error('Слишком много комментариев. Попробуйте позже.');

      const cleanContent = content.trim();
      if (!cleanContent || cleanContent.length > 2000) throw new Error('Комментарий должен содержать от 1 до 2000 символов');
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { status: true } });
      if (!post || post.status !== 'approved') throw new Error('Публикация недоступна');

      const comment = await prisma.comment.create({
        data: {
          content: cleanContent,
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

export async function deleteComment(_id: string, _authorId: string, commentId: string){
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Необходима авторизация');
    const existingComment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!existingComment) throw new Error('Комментарий не найден');
    if (existingComment.authorId !== user.id && !isAdmin(user)) throw new Error('Не ваш комментарий');

    const comment = await prisma.comment.delete({
      where: { id: commentId }
    })

    revalidatePath(`/posts/${comment.postId}`);

    return{
      success: true
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось удалить комментарий',
      isAuthError: error instanceof Error && (error.message === 'Не ваш комментарий' || error.message === 'Необходима авторизация')
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

    const cleanContent = content.trim();
    if (!cleanContent || cleanContent.length > 2000) throw new Error('Комментарий должен содержать от 1 до 2000 символов');

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: cleanContent,
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
    if (data.ethnicGroupId && !peoples.some(person => person.id === data.ethnicGroupId)) {
      throw new Error('Выбранный народ не найден')
    }
    const title = data.title.trim()
    const content = data.content.trim()
    if (!title || title.length > 200) throw new Error('Заголовок должен содержать от 1 до 200 символов')
    if (!content || content.length > 20000) throw new Error('Текст должен содержать от 1 до 20000 символов')
    const existingImages = data.existingImages.filter(url => post.images.includes(url))
    if (data.newImages.length > 10 || data.newVideos.length > 5 || existingImages.length + data.newImages.length + data.newVideos.length > 15) {
      throw new Error('Слишком много медиафайлов')
    }
    const totalBytes = [...data.newImages, ...data.newVideos].reduce((sum, file) => sum + file.size, 0)
    if (totalBytes > 60 * 1024 * 1024) throw new Error('Общий размер файлов превышает 60 МБ')

    const uploadedMedia: string[] = []

    for (const file of data.newImages) {
      const url = await uploadFile(file, 'image')
      uploadedMedia.push(String(url?.url))
    }

    for (const file of data.newVideos) {
      const url = await uploadFile(file, 'video')
      uploadedMedia.push(String(url?.url))
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        tags: data.tags.map(tag => tag.trim()).filter(tag => tag.length > 0 && tag.length <= 30).slice(0, 10),
        ethnicGroupId: data.ethnicGroupId,
        images: [...existingImages, ...uploadedMedia],
        status: 'pending',
      }
    })

    await sendModerationEmail({
      postId: updatedPost.id,
      postTitle: updatedPost.title,
      authorName: `${user.firstName} ${user.lastName}`,
      authorEmail: user.email,
    }).catch(error => console.error(error))

    revalidatePath('/forum')
    revalidatePath(`/posts/${postId}`)

    return { success: true, post: updatedPost, message: 'Изменения отправлены на повторную модерацию' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка обновления'
    }
  }
}
