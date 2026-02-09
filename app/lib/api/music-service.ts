'use server';

import { prisma } from "../prisma";
import { SimpleSoundCloudParser } from "../soundcloud";
import { getCurrentUser } from "./user";
import { revalidatePath } from "next/cache";

export type MusicTrack = {
  id: string;
  soundcloudId: string;
  title: string;
  artist: string;
  artistId?: string;
  artistAvatar?: string;
  genre?: string;
  duration: number;
  tags: string[];
  description?: string;
  permalinkUrl: string;
  streamUrl?: string;
  thumbnailUrl: string;
  likesCount: number;
  playbackCount: number;
  likedByUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Импорт треков
export async function importMusicFromSoundCloud(searchQuery: string) {
  try {
    const parser = new SimpleSoundCloudParser();
    const tracks = await parser.searchTracks(searchQuery, 15);

    const importedTracks = [];

    for (const soundcloudTrack of tracks) {
      try {
        // Проверяем, есть ли уже такой трек
        const existingTrack = await prisma.musicTrack.findUnique({
          where: { soundcloudId: soundcloudTrack.id.toString() }
        });

        if (existingTrack) {
          console.log(`Трек "${soundcloudTrack.title}" уже есть в базе`);
          continue;
        }

        // Создаем трек
        const trackData = parser.mapToMusicTrack(soundcloudTrack);
        const musicTrack = await prisma.musicTrack.create({
          data: trackData
        });

        importedTracks.push(musicTrack);
        console.log(`Импортирован: ${musicTrack.title} - ${musicTrack.artist}`);
      } catch (error) {
        console.error(`Ошибка импорта трека ${soundcloudTrack.title}:`, error);
      }
    }

    revalidatePath('/music');
    revalidatePath('/admin/music');

    return {
      success: true,
      importedCount: importedTracks.length,
      tracks: importedTracks,
      message: `Импортировано ${importedTracks.length} треков`
    };
  } catch (error) {
    console.error('Error importing music:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка импорта музыки'
    };
  }
}

// Получить все треки
export async function getMusicTracks(
  page: number = 1,
  limit: number = 20,
  genre?: string,
  sortBy: 'newest' | 'popular' | 'likes' = 'newest'
) {
  try {
    const user = await getCurrentUser();
    const skip = (page - 1) * limit;

    let orderBy = {};
    switch (sortBy) {
      case 'popular':
        orderBy = { playbackCount: 'desc' };
        break;
      case 'likes':
        orderBy = { likesCount: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const where = genre ? { genre } : {};

    const [tracks, totalCount] = await Promise.all([
      prisma.musicTrack.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.musicTrack.count({ where })
    ]);

    // Проверяем лайки пользователя
    let userLikes: string[] = [];
    if (user) {
      const likes = await prisma.userMusicLike.findMany({
        where: { userId: user.id },
        select: { musicTrackId: true }
      });
      userLikes = likes.map(like => like.musicTrackId);
    }

    const tracksWithLikes = tracks.map(track => ({
      ...track,
      likedByUser: userLikes.includes(track.id),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      tracks: tracksWithLikes,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting music tracks:', error);
    return {
      success: false,
      error: 'Не удалось загрузить музыку'
    };
  }
}

// Поиск музыки
export async function searchMusicTracks(
  query: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const user = await getCurrentUser();
    const skip = (page - 1) * limit;

    const [tracks, totalCount] = await Promise.all([
      prisma.musicTrack.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { artist: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
            { genre: { contains: query, mode: 'insensitive' } }
          ]
        },
        skip,
        take: limit,
        orderBy: { playbackCount: 'desc' },
      }),
      prisma.musicTrack.count({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { artist: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
            { genre: { contains: query, mode: 'insensitive' } }
          ]
        }
      })
    ]);

    // Проверяем лайки пользователя
    let userLikes: string[] = [];
    if (user) {
      const likes = await prisma.userMusicLike.findMany({
        where: { userId: user.id },
        select: { musicTrackId: true }
      });
      userLikes = likes.map(like => like.musicTrackId);
    }

    const tracksWithLikes = tracks.map(track => ({
      ...track,
      likedByUser: userLikes.includes(track.id),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      tracks: tracksWithLikes,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error searching music:', error);
    return {
      success: false,
      error: 'Не удалось выполнить поиск'
    };
  }
}

// Поставить/убрать лайк
export async function toggleMusicLike(trackId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const existingLike = await prisma.userMusicLike.findUnique({
      where: {
        userId_musicTrackId: {
          userId: user.id,
          musicTrackId: trackId
        }
      }
    });

    if (existingLike) {
      // Убираем лайк
      await prisma.userMusicLike.delete({
        where: { id: existingLike.id }
      });

      await prisma.musicTrack.update({
        where: { id: trackId },
        data: {
          likesCount: { decrement: 1 }
        }
      });

      revalidatePath('/music');
      return {
        success: true,
        liked: false,
        likesCount: await getTrackLikesCount(trackId)
      };
    } else {
      // Ставим лайк
      await prisma.userMusicLike.create({
        data: {
          userId: user.id,
          musicTrackId: trackId
        }
      });

      await prisma.musicTrack.update({
        where: { id: trackId },
        data: {
          likesCount: { increment: 1 }
        }
      });

      revalidatePath('/music');
      return {
        success: true,
        liked: true,
        likesCount: await getTrackLikesCount(trackId)
      };
    }
  } catch (error) {
    console.error('Error toggling music like:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось поставить лайк',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

// Получить количество лайков трека
async function getTrackLikesCount(trackId: string): Promise<number> {
  const track = await prisma.musicTrack.findUnique({
    where: { id: trackId },
    select: { likesCount: true }
  });
  return track?.likesCount || 0;
}

// Получить лайкнутые треки пользователя
export async function getUserLikedTracks(page: number = 1, limit: number = 20) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const skip = (page - 1) * limit;

    const [likes, totalCount] = await Promise.all([
      prisma.userMusicLike.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          musicTrack: true
        }
      }),
      prisma.userMusicLike.count({ where: { userId: user.id } })
    ]);

    const tracks = likes.map(like => ({
      ...like.musicTrack,
      likedByUser: true
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      tracks,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting liked tracks:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось загрузить понравившиеся треки',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

// Получить популярные треки
export async function getPopularTracks(limit: number = 10) {
  try {
    const user = await getCurrentUser();
    
    const tracks = await prisma.musicTrack.findMany({
      take: limit,
      orderBy: [
        { playbackCount: 'desc' },
        { likesCount: 'desc' }
      ]
    });

    // Проверяем лайки пользователя
    let userLikes: string[] = [];
    if (user) {
      const likes = await prisma.userMusicLike.findMany({
        where: { userId: user.id },
        select: { musicTrackId: true }
      });
      userLikes = likes.map(like => like.musicTrackId);
    }

    const tracksWithLikes = tracks.map(track => ({
      ...track,
      likedByUser: userLikes.includes(track.id),
    }));

    return {
      success: true,
      tracks: tracksWithLikes
    };
  } catch (error) {
    console.error('Error getting popular tracks:', error);
    return {
      success: false,
      error: 'Не удалось загрузить популярные треки'
    };
  }
}

// Создать плейлист
export async function createPlaylist(name: string, description?: string, isPublic: boolean = true) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const playlist = await prisma.playlist.create({
      data: {
        userId: user.id,
        name,
        description,
        isPublic
      }
    });

    revalidatePath('/music/playlists');
    return {
      success: true,
      playlist,
      message: 'Плейлист создан'
    };
  } catch (error) {
    console.error('Error creating playlist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось создать плейлист',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

// Получить плейлисты пользователя
export async function getUserPlaylists() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        tracks: {
          include: {
            musicTrack: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    return {
      success: true,
      playlists
    };
  } catch (error) {
    console.error('Error getting playlists:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось загрузить плейлисты',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

// Добавить трек в плейлист
export async function addTrackToPlaylist(playlistId: string, trackId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    // Проверяем, что плейлист принадлежит пользователю
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      throw new Error('Плейлист не найден');
    }

    if (playlist.userId !== user.id) {
      throw new Error('Это не ваш плейлист');
    }

    // Получаем текущий максимальный order
    const lastTrack = await prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { order: 'desc' }
    });

    const order = lastTrack ? lastTrack.order + 1 : 0;

    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId,
        musicTrackId: trackId,
        order
      }
    });

    revalidatePath(`/music/playlists/${playlistId}`);
    return {
      success: true,
      playlistTrack,
      message: 'Трек добавлен в плейлист'
    };
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось добавить трек',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

// Удалить трек из плейлиста
export async function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist || playlist.userId !== user.id) {
      throw new Error('Доступ запрещен');
    }

    await prisma.playlistTrack.delete({
      where: {
        playlistId_musicTrackId: {
          playlistId,
          musicTrackId: trackId
        }
      }
    });

    revalidatePath(`/music/playlists/${playlistId}`);
    return {
      success: true,
      message: 'Трек удален из плейлиста'
    };
  } catch (error) {
    console.error('Error removing track from playlist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось удалить трек',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}