'use client'

import { EventArray, eventsArray } from '@/app/lib/events'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

const Events = () => {

    const [events, setEvents] = useState<EventArray[]>([])

    useEffect(() => {
        setEvents(eventsArray)
    }, [])

    const nextSlide = (id: string) => {
        setEvents(prev =>
            prev.map(event =>
                event.id === id
                    ? {
                        ...event,
                        currentSlide:
                            (event.currentSlide + 1) % event.eventPhoto.length
                    }
                    : event
            )
        )
    }

    const prevSlide = (id: string) => {
        setEvents(prev =>
            prev.map(event =>
                event.id === id
                    ? {
                        ...event,
                        currentSlide:
                            (event.currentSlide - 1 + event.eventPhoto.length) %
                            event.eventPhoto.length
                    }
                    : event
            )
        )
    }

    const goToSlide = (id: string, index: number) => {
        setEvents(prev =>
            prev.map(event =>
                event.id === id
                    ? { ...event, currentSlide: index }
                    : event
            )
        )
    }

    const renderSlider = (
        images: string[],
        item: EventArray
    ) => {
        if (!images || images.length === 0) {
            return (
                <div className="relative w-[60%] aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Изображения отсутствуют</p>
                </div>
            )
        }

        return (
            <div className="relative md:w-[60%] w-full overflow-hidden rounded-lg">
                <div className="relative aspect-video bg-gray-100">
                    {images.map((src, index) => (
                        <div
                            key={index}
                            className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
                                index === item.currentSlide
                                    ? 'opacity-100'
                                    : 'opacity-0 pointer-events-none'
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
                            onClick={() => prevSlide(item.id)}
                            className="absolute cursor-pointer left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
                            aria-label="Предыдущее изображение"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            onClick={() => nextSlide(item.id)}
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
                                    onClick={() => goToSlide(item.id, index)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                        index === item.currentSlide
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
        )
    }

    return (
    <div className="w-full mt-8">
        <h1 className="text-3xl text-black font-semibold text-center mt-8">События и праздники</h1>
        <div className="w-full mt-8 mb-8">
                <div className="w-full h-4 bg-[#FFA100]"></div>
                <div className="w-full h-4 bg-[#FF7C00]"></div>
                <div className="w-full h-4 bg-[#FF4500]"></div>
            </div>
        <div className='flex flex-col w-full items-center md:px-15 px-5 py-10 gap-7'>
            {events.map(item => (
                <div className='w-full' key={item.id}>
                <div className="w-full flex flex-col gap-5">
                    <div className="">
                        <h1 className='font-semibold text-2xl text-center'>{item.name}</h1>
                    </div>

                    <div className="w-full flex flex-col gap-5">
                        {renderSlider(item.eventPhoto, item)}
                        <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                        <p className="text-lg">{item.eventDescription[item.currentSlide]}</p>
                    </div>
                    <Link href={item.learnMore[item.currentSlide]} target="_blank" className="px-12 py-4 md:w-64  rounded-full text-center bg-[#FFB840] text-black md:text-lg text-md hover:bg-[#FFCB73] cursor-pointer duration-200">Узнать больше</Link>
                    </div>
                </div>
                {item.id < "4" && (
                    <img src="/images/flags.png" alt="" className='w-full' />
                )}
                </div>
            ))}
        </div>
    </div>
    )
}

export default Events