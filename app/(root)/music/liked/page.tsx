'use client';

import React, { useEffect, useState } from 'react';
import { getUserLikedTracks, toggleMusicLike } from '@/app/lib/api/music-service';
import { toast } from 'sonner';
import { Heart, Play, Pause, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LikedMusicPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadLikedTracks();
  }, [currentPage]);

  const loadLikedTracks = async () => {
    setIsLoading(true);
    const result = await getUserLikedTracks(currentPage, 20);
    
    if (result.success) {
      setTracks(result.tracks || []);
      setTotalPages(result.pagination?.totalPages || 1);
    } else if (result.isAuthError) {
      toast.error('Необходима авторизация');
    } else {
      toast.error(result.error || 'Ошибка загрузки');
    }
    setIsLoading(false);
  };

  const handleToggleLike = async (trackId: string) => {
    const result = await toggleMusicLike(trackId);
    if (result.success && !result.liked) {
      // Если лайк убран, удаляем трек из списка
      setTracks(prev => prev.filter(track => track.id !== trackId));
      toast.success('Удалено из понравившихся');
    } else if (result.success) {
      toast.success('Добавлено в понравившиеся');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Хедер */}
        <div className="mb-8">
          <Link
            href="/music"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Назад к музыке
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Понравившиеся треки
              </h1>
              <p className="text-gray-600 mt-2">
                Все треки, которые вы добавили в избранное
              </p>
            </div>
            <div className="flex items-center gap-2 text-pink-600">
              <Heart size={24} fill="currentColor" />
              <span className="text-xl font-bold">{tracks.length}</span>
            </div>
          </div>
        </div>

        {/* Список треков */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
              <p className="mt-4 text-gray-500">Загрузка...</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-16 text-center">
              <Heart size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Нет понравившихся треков
              </h3>
              <p className="text-gray-600 mb-6">
                Добавляйте треки в избранное, нажимая на сердечко
              </p>
              <Link
                href="/music"
                className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700"
              >
                <Heart size={20} />
                Найти музыку
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tracks.map((track, index) => (
                <div 
                  key={track.id}
                  className={`p-6 hover:bg-gray-50 ${currentTrack === track.id ? 'bg-pink-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Номер и обложка */}
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center text-gray-500 font-medium">
                        {index + 1}
                      </div>
                      <div className="relative">
                        <img
                          src={track.thumbnailUrl}
                          alt={track.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <button
                          onClick={() => handlePlayTrack(track.id)}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity"
                        >
                          {currentTrack === track.id && isPlaying ? (
                            <Pause size={20} className="text-white" />
                          ) : (
                            <Play size={20} className="text-white ml-1" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Информация */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="pr-4">
                          <h3 className="font-bold text-gray-900 truncate">{track.title}</h3>
                          <p className="text-gray-600 truncate">{track.artist}</p>
                          {track.genre && (
                            <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                              {track.genre}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <button
                            onClick={() => handleToggleLike(track.id)}
                            className="p-2 text-pink-500 hover:text-pink-600"
                          >
                            <Heart size={20} fill="currentColor" />
                          </button>
                          <span className="text-sm text-gray-500">
                            {formatDuration(track.duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Аудиоплеер */}
                  {currentTrack === track.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
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
                <div className="p-6 border-t border-gray-100">
                  <div className="flex justify-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                      >
                        ← Назад
                      </button>
                      <span className="px-4 py-2">
                        Страница {currentPage} из {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                      >
                        Вперед →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}