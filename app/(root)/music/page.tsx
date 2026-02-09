'use client';

import React, { useEffect, useState } from 'react';
import { getMusicTracks, toggleMusicLike, searchMusicTracks, getPopularTracks } from '@/app/lib/api/music-service';
import { getCurrentUser } from '@/app/lib/api/user';
import { toast } from 'sonner';
import { Play, Pause, Heart, Search, Filter, Music, TrendingUp, ListMusic, Plus } from 'lucide-react';
import Link from 'next/link';

export default function MusicPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [popularTracks, setPopularTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'likes'>('newest');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadMusic();
    loadPopularMusic();
  }, [currentPage, sortBy, genreFilter]);

  useEffect(() => {
    // Извлекаем уникальные жанры
    const uniqueGenres = Array.from(new Set(tracks.map(track => track.genre).filter(Boolean)));
    setGenres(uniqueGenres as string[]);
  }, [tracks]);

  const loadMusic = async () => {
    setIsLoading(true);
    const result = await getMusicTracks(currentPage, 20, genreFilter || undefined, sortBy);
    
    if (result.success) {
      setTracks(result.tracks || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalCount(result.pagination?.totalCount || 0);
    } else {
      toast.error(result.error || 'Ошибка загрузки музыки');
    }
    setIsLoading(false);
  };

  const loadPopularMusic = async () => {
    const result = await getPopularTracks(5);
    if (result.success) {
      setPopularTracks(result.tracks || []);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMusic();
      return;
    }

    setIsLoading(true);
    const result = await searchMusicTracks(searchQuery);
    
    if (result.success) {
      setTracks(result.tracks || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalCount(result.pagination?.totalCount || 0);
      setCurrentPage(1);
    } else {
      toast.error(result.error || 'Ошибка поиска');
    }
    setIsLoading(false);
  };

  const handleToggleLike = async (trackId: string) => {
    const result = await toggleMusicLike(trackId);
    if (result.success) {
      // Обновляем состояние
      setTracks(prev => prev.map(track => 
        track.id === trackId 
          ? { ...track, likedByUser: result.liked, likesCount: result.likesCount || track.likesCount }
          : track
      ));
      
      setPopularTracks(prev => prev.map(track => 
        track.id === trackId 
          ? { ...track, likedByUser: result.liked, likesCount: result.likesCount || track.likesCount }
          : track
      ));
      
      toast.success(result.liked ? 'Добавлено в понравившиеся' : 'Удалено из понравившихся');
    } else if (result.isAuthError) {
      toast.error('Для добавления в понравившиеся необходимо авторизоваться');
    } else {
      toast.error(result.error || 'Ошибка');
    }
  };

  const handlePlayTrack = (trackId: string) => {
    if (currentTrack === trackId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(trackId);
      setIsPlaying(true);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Музыкальная коллекция
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Слушайте, сохраняйте и создавайте свои плейлисты
            </p>
            
            {/* Поиск */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Поиск треков или исполнителей..."
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-purple-600 px-6 py-2 rounded-xl hover:bg-gray-100 font-medium"
                >
                  Найти
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Основной контент */}
          <div className="lg:w-2/3">
            {/* Фильтры и сортировка */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <Filter size={20} className="text-gray-500" />
                  <span className="font-medium text-gray-700">Сортировка:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setSortBy('newest')}
                      className={`px-4 py-2 rounded-lg transition-colors ${sortBy === 'newest' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      Новые
                    </button>
                    <button
                      onClick={() => setSortBy('popular')}
                      className={`px-4 py-2 rounded-lg transition-colors ${sortBy === 'popular' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      Популярные
                    </button>
                    <button
                      onClick={() => setSortBy('likes')}
                      className={`px-4 py-2 rounded-lg transition-colors ${sortBy === 'likes' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      Лайки
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-700">Жанр:</span>
                  <select
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Все жанры</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Треки */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                  <p className="mt-4 text-gray-500">Загрузка музыки...</p>
                </div>
              ) : tracks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                  <Music size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Музыка не найдена</p>
                  <p className="text-gray-400 mt-2">Попробуйте другой запрос или проверьте позже</p>
                </div>
              ) : (
                <>
                  {tracks.map(track => (
                    <div 
                      key={track.id}
                      className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-all ${currentTrack === track.id ? 'ring-2 ring-purple-500' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Обложка и кнопка play */}
                        <div className="relative group">
                          <img
                            src={track.thumbnailUrl}
                            alt={track.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <button
                            onClick={() => handlePlayTrack(track.id)}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {currentTrack === track.id && isPlaying ? (
                              <Pause size={24} className="text-white" />
                            ) : (
                              <Play size={24} className="text-white ml-1" />
                            )}
                          </button>
                        </div>

                        {/* Информация о треке */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="pr-4">
                              <h3 className="font-bold text-gray-900 truncate">{track.title}</h3>
                              <p className="text-gray-600 truncate">{track.artist}</p>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <button
                                onClick={() => handleToggleLike(track.id)}
                                className={`p-2 rounded-full hover:bg-gray-100 ${track.likedByUser ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                              >
                                <Heart size={20} fill={track.likedByUser ? 'currentColor' : 'none'} />
                              </button>
                              <span className="text-sm text-gray-500">
                                {formatDuration(track.duration)}
                              </span>
                            </div>
                          </div>

                          {/* Теги и статистика */}
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            {track.genre && (
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                {track.genre}
                              </span>
                            )}
                            
                            {track.tags && track.tags.slice(0, 3).map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm"
                              >
                                #{tag}
                              </span>
                            ))}

                            <div className="flex gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Play size={12} />
                                {formatCount(track.playbackCount)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart size={12} />
                                {formatCount(track.likesCount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Аудиоплеер */}
                      {currentTrack === track.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <audio
                            src={track.streamUrl}
                            autoPlay={isPlaying}
                            controls
                            className="w-full"
                            onEnded={() => setIsPlaying(false)}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Пагинация */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ← Назад
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg ${currentPage === pageNum ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Вперед →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Сайдбар */}
          <div className="lg:w-1/3">
            {/* Популярные треки */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className="text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">Популярные треки</h3>
              </div>
              
              <div className="space-y-4">
                {popularTracks.map((track, index) => (
                  <div 
                    key={track.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer group"
                    onClick={() => handlePlayTrack(track.id)}
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-purple-100 text-purple-700 rounded-lg font-bold">
                      {index + 1}
                    </div>
                    <img
                      src={track.thumbnailUrl}
                      alt={track.title}
                      className="w-12 h-12 rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{track.title}</p>
                      <p className="text-sm text-gray-600 truncate">{track.artist}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(track.id);
                      }}
                      className={`p-1 opacity-0 group-hover:opacity-100 ${track.likedByUser ? 'text-pink-500' : 'text-gray-400'}`}
                    >
                      <Heart size={16} fill={track.likedByUser ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Быстрые действия */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Быстрые действия</h3>
              <div className="space-y-3">
                <Link
                  href="/music/liked"
                  className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm border"
                >
                  <Heart size={20} className="text-pink-500" />
                  <div>
                    <p className="font-medium">Понравившиеся</p>
                    <p className="text-sm text-gray-500">Ваши лайкнутые треки</p>
                  </div>
                </Link>
                
                <Link
                  href="/music/playlists"
                  className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm border"
                >
                  <ListMusic size={20} className="text-purple-500" />
                  <div>
                    <p className="font-medium">Мои плейлисты</p>
                    <p className="text-sm text-gray-500">Создавайте коллекции</p>
                  </div>
                </Link>
                
                <Link
                  href="/admin/music/import"
                  className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm border"
                >
                  <Plus size={20} className="text-green-500" />
                  <div>
                    <p className="font-medium">Добавить музыку</p>
                    <p className="text-sm text-gray-500">Импорт из SoundCloud</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Статистика */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Статистика</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Всего треков:</span>
                  <span className="font-bold">{totalCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Популярных:</span>
                  <span className="font-bold">{popularTracks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Жанров:</span>
                  <span className="font-bold">{genres.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Плавающий аудиоплеер */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={tracks.find(t => t.id === currentTrack)?.thumbnailUrl}
                  alt="Current track"
                  className="w-10 h-10 rounded"
                />
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">
                    {tracks.find(t => t.id === currentTrack)?.title}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {tracks.find(t => t.id === currentTrack)?.artist}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleLike(currentTrack)}
                  className={`p-1 ${tracks.find(t => t.id === currentTrack)?.likedByUser ? 'text-pink-500' : 'text-gray-400'}`}
                >
                  <Heart size={16} fill={tracks.find(t => t.id === currentTrack)?.likedByUser ? 'currentColor' : 'none'} />
                </button>
              </div>
              
              <audio
                src={tracks.find(t => t.id === currentTrack)?.streamUrl}
                autoPlay
                controls
                className="flex-1 max-w-2xl"
                onEnded={() => {
                  setCurrentTrack(null);
                  setIsPlaying(false);
                }}
              />
              
              <button
                onClick={() => {
                  setCurrentTrack(null);
                  setIsPlaying(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}