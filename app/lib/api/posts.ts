'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { getCurrentUser } from "./user";
import { uploadImage } from "./post";

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
}

export async function getAllPosts(
  page: number = 1, 
  limit: number = 10,
  sortBy: 'newest' | 'popular' = 'newest'
) {
  try {
    const user = await getCurrentUser();
    const skip = (page - 1) * limit;
    
    let posts;
    if (sortBy === 'popular') {
      // Для популярных постов сначала получим ID постов с наибольшим количеством лайков
      const popularPostIds = await prisma.like.groupBy({
        by: ['postId'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        skip,
        take: limit,
      });

      // Получаем посты по этим ID
      posts = await prisma.post.findMany({
        where: {
          id: {
            in: popularPostIds.map(item => item.postId),
          },
        },
        include: {
          author: { 
            select: { 
              id: true, 
              firstName: true, 
              lastName: true, 
              avatar: true, 
              email: true 
            } 
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });

      // Сохраняем порядок сортировки по популярности
      posts.sort((a, b) => {
        const aIndex = popularPostIds.findIndex(item => item.postId === a.id);
        const bIndex = popularPostIds.findIndex(item => item.postId === b.id);
        return aIndex - bIndex;
      });
    } else {
      // Для сортировки по дате
      posts = await prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { 
            select: { 
              id: true, 
              firstName: true, 
              lastName: true, 
              avatar: true, 
              email: true 
            } 
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });
    }

    const totalCount = await prisma.post.count();
    const totalPages = Math.ceil(totalCount / limit);

    // Проверяем лайки пользователя для каждого поста
    const postsWithUserLike = await Promise.all(posts.map(async (post) => {
      let likedByUser = false;
      if (user) {
        const userLike = await prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: user.id,
              postId: post.id,
            },
          },
        });
        likedByUser = !!userLike;
      }

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        ethnicGroupId: post.ethnicGroupId,
        images: post.images,
        tags: post.tags,
        likes: post._count.likes,
        likedByUser,
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        commentsCount: post._count.comments,
      };
    }));

    return {
      posts: postsWithUserLike,
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

export async function getPostById(id: string) {
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });

  if (!post) return null;

  // Проверяем, лайкнул ли пользователь пост
  let likedByUser = false;
  if (user) {
    const userLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: id,
        },
      },
    });
    likedByUser = !!userLike;
  }

  return {
    ...post,
    likes: post._count.likes,
    likedByUser,
    commentsCount: post.comments.length,
  };
}

export async function getPostsByEthnicGroup(
  ethnicGroupId: string, 
  page: number = 1, 
  limit: number = 10,
  sortBy: 'newest' | 'popular' = 'newest'
) {
  try {
    const user = await getCurrentUser();
    const skip = (page - 1) * limit;
    
    let posts;
    if (sortBy === 'popular') {
      // Для популярных постов сначала получим ID постов с наибольшим количеством лайков
      const popularPostIds = await prisma.like.groupBy({
        by: ['postId'],
        where: {
          post: {
            ethnicGroupId,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        skip,
        take: limit,
      });

      // Получаем посты по этим ID
      posts = await prisma.post.findMany({
        where: {
          id: {
            in: popularPostIds.map(item => item.postId),
          },
          ethnicGroupId,
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
              likes: true,
            },
          },
        },
      });

      // Сохраняем порядок сортировки по популярности
      posts.sort((a, b) => {
        const aIndex = popularPostIds.findIndex(item => item.postId === a.id);
        const bIndex = popularPostIds.findIndex(item => item.postId === b.id);
        return aIndex - bIndex;
      });
    } else {
      // Для сортировки по дате
      posts = await prisma.post.findMany({
        where: { ethnicGroupId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
              likes: true,
            },
          },
        },
      });
    }

    const totalCount = await prisma.post.count({
      where: { ethnicGroupId },
    });
    
    const totalPages = Math.ceil(totalCount / limit);

    // Проверяем лайки пользователя для каждого поста
    const postsWithUserLike = await Promise.all(posts.map(async (post) => {
      let likedByUser = false;
      if (user) {
        const userLike = await prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: user.id,
              postId: post.id,
            },
          },
        });
        likedByUser = !!userLike;
      }

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        ethnicGroupId: post.ethnicGroupId,
        images: post.images,
        tags: post.tags,
        likes: post._count.likes,
        likedByUser,
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        commentsCount: post._count.comments,
      };
    }));

    return {
      posts: postsWithUserLike,
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

export async function getPopularPosts(limit: number = 10) {
  try {
    // Получаем ID популярных постов
    const popularPostIds = await prisma.like.groupBy({
      by: ['postId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    // Получаем посты по этим ID
    const posts = await prisma.post.findMany({
      where: {
        id: {
          in: popularPostIds.map(item => item.postId),
        },
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    // Сохраняем порядок сортировки по популярности
    posts.sort((a, b) => {
      const aIndex = popularPostIds.findIndex(item => item.postId === a.id);
      const bIndex = popularPostIds.findIndex(item => item.postId === b.id);
      return aIndex - bIndex;
    });

    // Формируем результат
    const result = posts.map((post) => {
      const likesCount = popularPostIds.find(item => item.postId === post.id)?._count.id || 0;
      
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        ethnicGroupId: post.ethnicGroupId,
        images: post.images,
        tags: post.tags,
        likes: likesCount,
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        commentsCount: post._count.comments,
      };
    });

    return result;
  } catch (error) {
    console.error(error);
    throw new Error('Не удалось загрузить популярные посты');
  }
}

export async function toggleLike(postId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Необходима авторизация');

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      
      const likesCount = await prisma.like.count({
        where: { postId }
      });

      return { 
        success: true, 
        liked: false,
        likes: likesCount
      };
    }

    await prisma.like.create({
      data: {
        userId: user.id,
        postId,
      },
    });

    const likesCount = await prisma.like.count({
      where: { postId }
    });

    return {
      success: true,
      liked: true,
      likes: likesCount
    };
  } catch (error) {
    console.error(error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Не удалось взаимодействовать с лайком',
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

export async function deleteComment(id: string, authorId: string, commentId: string) {
  try {
    if (id !== authorId) {
      throw new Error('Не ваш комментарий');
    }

    const comment = await prisma.comment.delete({
      where: { id: commentId }
    });

    revalidatePath(`/posts/${comment.postId}`);

    return {
      success: true
    };
  } catch (error) {
    console.error(error);
    return {
      success: false, 
      error: error instanceof Error ? error.message : 'Не удалось удалить комментарий',
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
      isAuthError: error instanceof Error && (error.message === 'Необходима авторизация' || error.message === 'Это не ваш комментарий')
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

    await prisma.like.deleteMany({
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
    const user = await getCurrentUser();
    if (!user) throw new Error('Необходима авторизация');

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Пост не найден');
    if (post.authorId !== user.id) throw new Error('Это не ваш пост');

    const uploadedImages: string[] = [];

    for (const file of data.newImages) {
      const url = await uploadImage(file);
      uploadedImages.push(String(url?.url));
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: data.title,
        content: data.content,
        tags: data.tags,
        ethnicGroupId: data.ethnicGroupId,
        images: [...data.existingImages, ...uploadedImages]
      }
    });

    revalidatePath('/forum');
    revalidatePath(`/posts/${postId}`);

    return { success: true, post: updatedPost };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка обновления'
    };
  }
}