'use client';

import React, { useState } from 'react';
import { importMusicFromSoundCloud } from '@/app/lib/api/music-service';
import { toast } from 'sonner';
import { Upload, Search, Music, Globe } from 'lucide-react';
import Link from 'next/link';

export default function MusicImportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  const handleImport = async () => {
    if (!searchQuery.trim()) {
      toast.error('Введите поисковый запрос');
      return;
    }

    setIsImporting(true);
    const result = await importMusicFromSoundCloud(searchQuery);
    
    if (result.success) {
      toast.success(result.message);
      setImportResults(result);
      setSearchQuery('');
    } else {
      toast.error(result.error || 'Ошибка импорта');
    }
    setIsImporting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Хедер */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Импорт музыки из SoundCloud
          </h1>
          <p className="text-gray-600">
            Найдите и импортируйте музыку для вашей коллекции
          </p>
        </div>

        {/* Основная форма */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <div className="space-y-6">
            {/* Поисковый запрос */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Что ищем? *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Например: 'indie rock', 'lo-fi', 'electronic' или имя исполнителя"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleImport()}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Укажите жанр, стиль или имя исполнителя
              </p>
            </div>

            {/* Примеры запросов */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Популярные запросы:</h4>
              <div className="flex flex-wrap gap-2">
                {['indie rock', 'lo-fi', 'electronic', 'hip hop', 'jazz', 'ambient', 'chillout', 'classical'].map(query => (
                  <button
                    key={query}
                    onClick={() => setSearchQuery(query)}
                    className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 text-sm"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>

            {/* Кнопка импорта */}
            <button
              onClick={handleImport}
              disabled={isImporting || !searchQuery.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Импорт...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Импортировать музыку
                </>
              )}
            </button>
          </div>
        </div>

        {/* Результаты */}
        {importResults && (
          <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Music className="text-purple-600" />
              Результаты импорта
            </h3>
            
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">
                Успешно импортировано {importResults.importedCount} треков
              </p>
            </div>

            {importResults.tracks && importResults.tracks.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Новые треки:</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {importResults.tracks.map((track: any) => (
                    <div key={track.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <img
                        src={track.thumbnailUrl}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.title}</p>
                        <p className="text-sm text-gray-600 truncate">{track.artist}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.floor(track.duration / 60000)}:
                        {Math.floor((track.duration % 60000) / 1000).toString().padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <Link
                href="/music"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                <Globe size={20} />
                Перейти к музыке
              </Link>
            </div>
          </div>
        )}

        {/* Инструкция */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h4 className="font-bold text-blue-900 mb-3">📚 Как это работает:</h4>
          <ul className="space-y-2 text-blue-800">
            <li>1. Введите поисковый запрос (жанр, стиль или исполнитель)</li>
            <li>2. Система найдет до 15 треков на SoundCloud</li>
            <li>3. Треки автоматически импортируются в вашу базу</li>
            <li>4. Пользователи могут лайкать треки и добавлять в плейлисты</li>
            <li>5. Вся музыка доступна на странице /music</li>
          </ul>
        </div>
      </div>
    </div>
  );
}