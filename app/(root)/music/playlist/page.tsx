'use client';

import React, { useEffect, useState } from 'react';
import { getUserPlaylists, createPlaylist } from '@/app/lib/api/music-service';
import { toast } from 'sonner';
import { Plus, ListMusic, Music, Play, Pause, Heart, MoreVertical } from 'lucide-react';
import Link from 'next/link';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    setIsLoading(true);
    const result = await getUserPlaylists();
    
    if (result.success) {
      setPlaylists(result.playlists || []);
    } else if (result.isAuthError) {
      toast.error('Необходима авторизация');
    } else {
      toast.error(result.error || 'Ошибка загрузки плейлистов');
    }
    setIsLoading(false);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error('Введите название плейлиста');
      return;
    }

    const result = await createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    
    if (result.success) {
      toast.success(result.message);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setShowCreateForm(false);
      loadPlaylists();
    } else {
      toast.error(result.error || 'Ошибка создания плейлиста');
    }
  };

  const getTotalDuration = (tracks: any[]) => {
    if (!tracks || tracks.length === 0) return '0:00';
    const totalMs = tracks.reduce((sum, pt) => sum + (pt.musicTrack?.duration || 0), 0);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Хедер */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Мои плейлисты
              </h1>
              <p className="text-gray-600 mt-2">
                Создавайте и управляйте своими музыкальными коллекциями
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:opacity-90"
            >
              <Plus size={20} />
              Создать плейлист
            </button>
          </div>
        </div>

        {/* Форма создания плейлиста */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-xl shadow-lg border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Создать новый плейлист</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название плейлиста *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Мой новый плейлист"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание (опционально)
                </label>
                <textarea
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Опишите ваш плейлист..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreatePlaylist}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90"
                >
                  Создать
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPlaylistName('');
                    setNewPlaylistDesc('');
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Список плейлистов */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="mt-4 text-gray-500">Загрузка плейлистов...</p>
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
            <ListMusic size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              У вас пока нет плейлистов
            </h3>
            <p className="text-gray-600 mb-6">
              Создайте свой первый плейлист, чтобы сохранять любимые треки
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:opacity-90"
            >
              <Plus size={20} />
              Создать первый плейлист
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map(playlist => (
              <Link
                key={playlist.id}
                href={`/music/playlists/${playlist.id}`}
                className="group bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-purple-600">
                        {playlist.name}
                      </h3>
                      {playlist.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                    </div>
                    <div className="text-gray-400">
                      <ListMusic size={20} />
                    </div>
                  </div>

                  {/* Обложки треков */}
                  {playlist.tracks && playlist.tracks.length > 0 ? (
                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-2">
                        {playlist.tracks.slice(0, 4).map((pt: any, index: number) => (
                          <div key={index} className="relative aspect-square">
                            <img
                              src={pt.musicTrack?.thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover rounded"
                            />
                            {index === 3 && playlist.tracks.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                                <span className="text-white font-bold text-lg">
                                  +{playlist.tracks.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 h-32 bg-gray-100 rounded flex items-center justify-center">
                      <Music size={32} className="text-gray-300" />
                    </div>
                  )}

                  {/* Статистика */}
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Music size={14} />
                        {playlist.tracks?.length || 0} треков
                      </span>
                      {playlist.tracks && playlist.tracks.length > 0 && (
                        <span>{getTotalDuration(playlist.tracks)}</span>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${playlist.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {playlist.isPublic ? 'Публичный' : 'Приватный'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Инструкция */}
        <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Как использовать плейлисты:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <Plus className="text-purple-600" size={20} />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Создавайте</h4>
              <p className="text-gray-600 text-sm">Создайте плейлист для любой темы или настроения</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-3">
                <Music className="text-pink-600" size={20} />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Добавляйте треки</h4>
              <p className="text-gray-600 text-sm">Нажимайте "..." на треке и выбирайте "Добавить в плейлист"</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Play className="text-blue-600" size={20} />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Слушайте</h4>
              <p className="text-gray-600 text-sm">Воспроизводите весь плейлист или отдельные треки</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}