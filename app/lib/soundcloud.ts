import axios from 'axios';

const SOUNDCLOUD_CLIENT_ID = process.env.NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID;
const BASE_URL = 'https://api-v2.soundcloud.com';

export interface SoundCloudTrack {
  id: number;
  title: string;
  user: {
    id: number;
    username: string;
    avatar_url: string;
  };
  genre: string | null;
  tag_list: string;
  description: string | null;
  duration: number;
  permalink_url: string;
  stream_url: string | null;
  artwork_url: string;
  likes_count: number;
  playback_count: number;
  created_at: string;
}

export class SimpleSoundCloudParser {
  private clientId: string;

  constructor(clientId?: string) {
    this.clientId = clientId || SOUNDCLOUD_CLIENT_ID || '';
    if (!this.clientId) {
      console.warn('SoundCloud Client ID не найден');
    }
  }

  // Поиск треков
  async searchTracks(query: string, limit: number = 20): Promise<SoundCloudTrack[]> {
    try {
      const url = `${BASE_URL}/search/tracks`;
      const response = await axios.get(url, {
        params: {
          q: query,
          client_id: this.clientId,
          limit,
          linked_partitioning: 1
        }
      });

      return response.data.collection || [];
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw new Error(`Поиск не удался: ${error}`);
    }
  }

  // Поиск по жанру
  async searchByGenre(genre: string, limit: number = 20): Promise<SoundCloudTrack[]> {
    return this.searchTracks(`genre:"${genre}"`, limit);
  }

  // Получить трек по ID
  async getTrack(trackId: number): Promise<SoundCloudTrack> {
    try {
      const url = `${BASE_URL}/tracks/${trackId}`;
      const response = await axios.get(url, {
        params: { client_id: this.clientId }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting track ${trackId}:`, error);
      throw new Error(`Трек не найден: ${error}`);
    }
  }

  // Парсинг тегов
  parseTags(tagList: string): string[] {
    if (!tagList) return [];
    return tagList.split('" ')
      .map(tag => tag.replace(/"/g, '').trim())
      .filter(tag => tag.length > 0);
  }

  // Преобразование в нашу модель
  mapToMusicTrack(track: SoundCloudTrack): any {
    return {
      soundcloudId: track.id.toString(),
      title: track.title,
      artist: track.user.username,
      artistId: track.user.id.toString(),
      artistAvatar: track.user.avatar_url,
      genre: track.genre || null,
      duration: track.duration,
      tags: this.parseTags(track.tag_list),
      description: track.description || null,
      permalinkUrl: track.permalink_url,
      streamUrl: track.stream_url ? `${track.stream_url}?client_id=${this.clientId}` : null,
      thumbnailUrl: track.artwork_url || track.user.avatar_url,
      likesCount: track.likes_count,
      playbackCount: track.playback_count,
    };
  }
}