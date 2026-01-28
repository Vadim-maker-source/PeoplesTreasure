'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { peoples } from '@/app/lib/peoples';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type Peoples = {
    id: string
    name: string
    description: string
    population: number
    languageFamily: string
    region: string
    traditions: string[]
    food: string[]
    photoFood: string[]
    suit: string[]
    suitPhoto: string[]
    folklor: string[]
    language?: string
    prois: string
    historyEvents: string[]
    photos: string[]
}

const PeoplePage = () => {
    const params = useParams();
    const [people, setPeople] = useState<Peoples | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentFoodSlide, setCurrentFoodSlide] = useState(0);
    const [currentSuitSlide, setCurrentSuitSlide] = useState(0);
    const [currentPhotoSlide, setCurrentPhotoSlide] = useState(0);

    useEffect(() => {
        const peopleName = params.slug as string;
        
        if (!peopleName) {
            setIsLoading(false);
            return;
        }

        const decodedName = decodeURIComponent(peopleName);
        const foundPeople = peoples.find(p => 
            p.name.toLowerCase() === decodedName.toLowerCase()
        );
        
        setPeople(foundPeople || null);
        setIsLoading(false);
        
        if (!foundPeople) {
            console.log(`Народ "${decodedName}" не найден в базе данных`);
        }
    }, [params.slug]);

    const nextFoodSlide = () => {
        if (people?.photoFood) {
            setCurrentFoodSlide((prev) => (prev + 1) % people.photoFood.length);
        }
    };

    const prevFoodSlide = () => {
        if (people?.photoFood) {
            setCurrentFoodSlide((prev) => (prev - 1 + people.photoFood.length) % people.photoFood.length);
        }
    };

    const goToFoodSlide = (index: number) => {
        setCurrentFoodSlide(index);
    };

    const nextSuitSlide = () => {
        if (people?.suitPhoto) {
            setCurrentSuitSlide((prev) => (prev + 1) % people.suitPhoto.length);
        }
    };

    const prevSuitSlide = () => {
        if (people?.suitPhoto) {
            setCurrentSuitSlide((prev) => (prev - 1 + people.suitPhoto.length) % people.suitPhoto.length);
        }
    };

    const goToSuitSlide = (index: number) => {
        setCurrentSuitSlide(index);
    };

    const nextPhotoSlide = () => {
        if (people?.photos) {
            setCurrentPhotoSlide((prev) => (prev + 1) % people.photos.length);
        }
    };

    const prevPhotoSlide = () => {
        if (people?.photos) {
            setCurrentPhotoSlide((prev) => (prev - 1 + people.photos.length) % people.photos.length);
        }
    };

    const goToPhotoSlide = (index: number) => {
        setCurrentPhotoSlide(index);
    };

    const formatPopulation = (num: number) => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)} млн`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)} тыс`;
        }
        return num.toString();
    };

    const renderSlider = (images: string[], currentSlide: number, nextSlide: () => void, prevSlide: () => void, goToSlide: (index: number) => void) => {
        if (!images || images.length === 0) {
            return (
                <div className="relative w-[60%] aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Изображения отсутствуют</p>
                </div>
            );
        }

        return (
            <div className="relative w-[60%] overflow-hidden rounded-lg">
                <div className="relative aspect-video bg-gray-100">
                    {images.map((src, index) => (
                        <div
                            key={index}
                            className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
                                index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                        >
                            <img
                                src={src}
                                alt={`Изображение ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                {index + 1} / {images.length}
                            </div>
                        </div>
                    ))}
                </div>

                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevSlide}
                            className="absolute cursor-pointer left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
                            aria-label="Предыдущее изображение"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        
                        <button
                            onClick={nextSlide}
                            className="absolute cursor-pointer right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
                            aria-label="Следующее изображение"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                        index === currentSlide 
                                            ? 'bg-white scale-125' 
                                            : 'bg-white/60 hover:bg-white/80'
                                    }`}
                                    aria-label={`Перейти к слайду ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderList = (items: string[]) => {
        if (!items || items.length === 0) return null;
        
        return (
            <ul className="list-disc pl-5 mt-2 space-y-1">
                {items.map((item, index) => (
                    <li key={index} className="text-lg">{item}</li>
                ))}
            </ul>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFF9F9] py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center gap-2 text-xl">
                        <Loader2 className="animate-spin text-[#FF7340]" />
                        <p className="text-[#FFB840] text-xl">Загрузка информации о народе...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!people) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">Народ не найден</h1>
                    <p className="text-gray-600 mb-4">К сожалению, информация о данном народе отсутствует</p>
                    <Link
                        href="/" 
                        className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-300"
                    >
                        Вернуться на главную
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mt-8">
            <h1 className="text-3xl text-black font-semibold text-center mt-8">{people.name}</h1>
            
            <div className="w-full mt-8 mb-8">
                <div className="w-full h-4 bg-[#FFA100]"></div>
                <div className="w-full h-4 bg-[#FF7C00]"></div>
                <div className="w-full h-4 bg-[#FF4500]"></div>
            </div>

            <div className="w-full px-15 py-10">
                {people.photos && people.photos.length > 0 ? (
                    renderSlider(people.photos, currentPhotoSlide, nextPhotoSlide, prevPhotoSlide, goToPhotoSlide)
                ) : (
                    <div className="w-full aspect-video bg-gray-200 rounded-xl flex items-center justify-center">
                        <p className="text-gray-500">Изображение отсутствует</p>
                    </div>
                )}
            </div>

            <div className="flex flex-col px-15 gap-10 pb-15">
                <div className="px-3 py-2 bg-[#FFF0F0] w-[60%] break-all rounded-lg">
                    <p className="text-lg">{people.description}</p>
                </div>

                <div className="flex flex-col gap-10">
                    <div className="flex items-center gap-2">
                        <img src="/images/peopleGroup.png" alt="" className="w-8" />
                        <h1 className="text-3xl text-black font-semibold">Численность</h1>
                    </div>

                    <div className="px-3 py-2 bg-[#FFF0F0] w-[60%] rounded-lg">
                        <p className="text-lg">{formatPopulation(people.population)} человек</p>
                    </div>
                </div>

                <div className="flex flex-col gap-10">
                    <div className="flex items-center gap-2">
                        <img src="/images/langFamily.png" alt="" className="w-8" />
                        <h1 className="text-3xl text-black font-semibold">Языковая семья</h1>
                    </div>

                    <div className="px-3 py-2 bg-[#FFF0F0] w-[60%] rounded-lg">
                        <p className="text-lg">{people.languageFamily}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-10">
                    <div className="flex items-center gap-2">
                        <img src="/images/reg.png" alt="" className="w-8" />
                        <h1 className="text-3xl text-black font-semibold">Регион проживания</h1>
                    </div>

                    <div className="px-3 py-2 bg-[#FFF0F0] w-[60%] rounded-lg">
                        <p className="text-lg">{people.region}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-10">
                    <div className="flex items-center gap-2">
                        <img src="/images/traditions.png" alt="" className="w-8" />
                        <h1 className="text-3xl text-black font-semibold">Традиции</h1>
                    </div>

                    <div className="px-3 py-2 bg-[#FFF0F0] w-[60%] rounded-lg">
                        {people.traditions && people.traditions.length > 0 ? (
                            <>
                                {renderList(people.traditions)}
                            </>
                        ) : (
                            <p className="text-lg">Информация о традициях отсутствует</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-10">
                    <div className="flex items-center gap-2">
                        <img src="/images/food.png" alt="" className="w-8" />
                        <h1 className="text-3xl text-black font-semibold">Еда</h1>
                    </div>

                    <div className="px-3 py-2 bg-[#FFF0F0] w-[60%] rounded-lg">
                        {people.food && people.food.length > 0 ? (
                            renderList(people.food)
                        ) : (
                            <p className="text-lg">Информация о еде отсутствует</p>
                        )}
                    </div>

                    {people.photoFood && people.photoFood.length > 0 && (
                        renderSlider(people.photoFood, currentFoodSlide, nextFoodSlide, prevFoodSlide, goToFoodSlide)
                    )}
                </div>

                <div className="flex flex-col gap-10">
                    <div className="flex items-center gap-2">
                        <img src="/images/suite.png" alt="" className="w-3" />
                        <h1 className="text-3xl text-black font-semibold">Костюм</h1>
                    </div>

                    <div className="px-3 py-2 bg-[#FFF0F0] w-[60%] rounded-lg">
                        {people.suit && people.suit.length > 0 ? (
                            renderList(people.suit)
                        ) : (
                            <p className="text-lg">Информация о костюмах отсутствует</p>
                        )}
                    </div>

                    {people.suitPhoto && people.suitPhoto.length > 0 && (
                        renderSlider(people.suitPhoto, currentSuitSlide, nextSuitSlide, prevSuitSlide, goToSuitSlide)
                    )}
                </div>

                <div className="flex flex-col gap-10">
                    <div className="flex items-center gap-2">
                        <img src="/images/guitar.png" alt="" className="w-8" />
                        <h1 className="text-3xl text-black font-semibold">Фольклор</h1>
                    </div>

                    <div className="px-3 py-2 bg-[#FFF0F0] w-[60%] rounded-lg">
                        {people.folklor && people.folklor.length > 0 ? (
                            renderList(people.folklor)
                        ) : (
                            <p className="text-lg">Информация о фольклоре отсутствует</p>
                        )}
                    </div>
                </div>

                {people.language && (
                    <div className="flex flex-col gap-10">
                        <div className="flex items-center gap-2">
                            <img src="/images/guitar.png" alt="" className="w-8" />
                            <h1 className="text-3xl text-black font-semibold">Язык</h1>
                        </div>

                        <div className="px-3 py-2 bg-[#FFF0F0] w-[60%] rounded-lg">
                            <p className="text-lg">{people.language}</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-10">
                    <div className="flex items-center gap-2">
                        <img src="/images/globus.png" alt="" className="w-8" />
                        <h1 className="text-3xl text-black font-semibold">Происхождение</h1>
                    </div>

                    <div className="px-3 py-2 bg-[#FFF0F0] w-[60%] rounded-lg">
                        <p className="text-lg">{people.prois}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-10">
                    <div className="flex items-center gap-2">
                        <img src="/images/hist.png" alt="" className="w-8" />
                        <h1 className="text-3xl text-black font-semibold">Исторические события</h1>
                    </div>

                    <div className="px-3 py-2 bg-[#FFF0F0] w-[60%] rounded-lg">
                        {people.historyEvents && people.historyEvents.length > 0 ? (
                            renderList(people.historyEvents)
                        ) : (
                            <p className="text-lg">Информация об исторических событиях отсутствует</p>
                        )}
                    </div>
                </div>
                <Link href={`/quiz/narod/${people.id}`}>
                <button className="px-15 py-5 bg-[#FFB840] rounded-full cursor-pointer hover:opacity-80 text-xl duration-200">
                    Пройти викторину
                </button>
                </Link>
            </div>
        </div>
    );
};

export default PeoplePage;