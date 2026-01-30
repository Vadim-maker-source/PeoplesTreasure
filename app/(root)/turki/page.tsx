'use client'

import React, { useState } from 'react'

const Turki = () => {

  const [currentSlide, setCurrentSlide] = useState(0);
  
  const foodImages = [
    { src: '/images/tFood1.png', alt: '' },
    { src: '/images/tFood2.jpg', alt: '' },
    { src: '/images/tFood3.jfif', alt: '' },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % foodImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + foodImages.length) % foodImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const [currentSuiteSlide, setCurrentSuiteSlide] = useState(0);
  
  const suiteImages = [
    { src: '/images/tSuit1.jpg', alt: 'дэгэл' },
    { src: '/images/tSuit2.jpg', alt: 'цегдег' },
  ];

  const nextSuiteSlide = () => {
    setCurrentSuiteSlide((prev) => (prev + 1) % suiteImages.length);
  };

  const prevSuiteSlide = () => {
    setCurrentSuiteSlide((prev) => (prev - 1 + suiteImages.length) % suiteImages.length);
  };

  const goToSuiteSlide = (index: number) => {
    setCurrentSuiteSlide(index);
  };

  return (
    <div className="w-full mt-8">
        <h1 className="text-3xl text-black font-semibold text-center mt-8">Тюркские народы</h1>
      <div className="w-full mt-8 mb-8">
        <div className="w-full h-4 bg-[#FFA100]"></div>
        <div className="w-full h-4 bg-[#FF7C00]"></div>
        <div className="w-full h-4 bg-[#FF4500]"></div>
      </div>

<div className="w-full md:px-15 px-5 py-10">
      <img src="/images/turkiMain.png" alt="" className='w-full rounded-xl' />
</div>

      <div className="flex flex-col md:px-15 px-5 gap-10 pb-15">
        <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full break-all rounded-lg">
            <p className="text-lg">Тюркские народы России — это наследники кочевых империй и оседлых государств, рассеянные от предгорий Кавказа до арктической Якутии. Их объединяет общее языковое происхождение, но разделяют история, хозяйственный уклад и культура, вобравшая влияния соседних цивилизаций.</p>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/peopleGroup.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Численность</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Крупнейшие: татары (~5 млн), башкиры (~1.5 млн), чуваши (~1.4 млн), казахи (~1 млн в приграничных областях). Средние: якуты (~500 тыс.), кумыки (~600 тыс.), тувинцы (~300 тыс.). Малые: карачаевцы, балкарцы, алтайцы, шорцы, долганы, тофалары.</p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/tch.png" alt="" className="" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/langFamily.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Языковая семья</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Тюркская ветвь алтайской языковой семьи. Языки внутри ветви часто взаимопонятны (особенно у соседей), но якутский, чувашский и горско-кавказские тюркские языки сильно обособлены.</p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/reg.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Регион проживания</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Крупные анклавы в Поволжье и Приуралье (татары, башкиры, чуваши), на Северном Кавказе (кумыки, карачаевцы, балкарцы, ногайцы), в Южной Сибири (тувинцы, хакасы, алтайцы, шорцы), в Якутии и на Крайнем Севере (якуты, долганы). Исторически — от степи до тайги и тундры.
                </p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/turkiReg.png" alt="" className="" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/traditions.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Традиции</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Основаны на сочетании кочевых и оседлых ценностей. Культ коня и воинской доблести у степняков, почитание природы и духов местности — у таежников и горцев. Сильны традиции коллективного труда (помочи), гостеприимства и почтения к старшим (аксакалам). Значима общинная солидарность.</p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/food.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Еда</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Доминирует мясо-молочная направленность. Ключевые элементы: мясо (конина, баранина, у якутов — оленина и конина), кисломолочные продукты (кумыс, айран, катык), тесто (лепешки, лапша, пельмени). Национальные блюда: татарский элеш и чак-чак, башкирский бишбармак, якутские строганина и лепешки-караси, тувинская кровяная колбаса.</p>
            </div>

            <div className="relative md:w-[60%] w-full overflow-hidden rounded-lg">
            <div className="relative aspect-video bg-gray-100">
              {foodImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {index + 1} / {foodImages.length}
                  </div>
                </div>
              ))}
            </div>

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
              {foodImages.map((_, index) => (
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
          </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/suite.png" alt="" className="w-3" />
                <h1 className="text-3xl text-black font-semibold">Костюм</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Единства нет, уклад определяет форму. У степняков-кочевников — удобная для верховой еды распашная одежда, меховые шапки и халаты. У оседлых народов (татары, чуваши) — рубахи, камзолы, богатая вышивка. У якутов — меховая одежда для экстремального холода. Женский костюм всегда включал много украшений (нагрудные, височные), головные уборы (калфак у татар, башкир) указывали на возраст и статус.</p>
            </div>

            <div className="relative md:w-[60%] w-full overflow-hidden rounded-lg">
            <div className="relative aspect-video bg-gray-100">
              {suiteImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
                    index === currentSuiteSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {index + 1} / {suiteImages.length}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={prevSuiteSlide}
              className="absolute cursor-pointer left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
              aria-label="Предыдущее изображение"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={nextSuiteSlide}
              className="absolute cursor-pointer right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
              aria-label="Следующее изображение"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {suiteImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSuiteSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSuiteSlide 
                      ? 'bg-white scale-125' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                  aria-label={`Перейти к слайду ${index + 1}`}
                />
              ))}
            </div>
          </div>

        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/guitar.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Фольклор</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Героический эпос — сердце культуры: якутский Олонхо, алтайский Маадай-Кара, башкирский Урал-батыр. Также развиты лирические песни, сказки, пословицы. Горловое пение (хоомей) у тувинцев, алтайцев, якутов — уникальное явление, имитирующее звуки природы. Музыкальные инструменты: домбра, курай (башкирский духовой), хомус (варган).
                </p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/tFolklor.png" alt="" className="" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/language.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Язык</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Все относятся к тюркской группе, но сильно различаются. Чувашский — единственный живой представитель булгарской подгруппы. Якутский — самый северный тюркский язык с большой долей монгольской и палеоазиатской лексики. Письменность: исторически руны (орхоно-енисейская), затем арабская графика, с 1930-х — кириллица.
                </p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/globus.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Происхождение</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Восходят к единой тюркской общности, сформировавшейся в степях Центральной Азии. Расселение по Евразии волнами миграций (гунны, булгары, кипчаки) и создание государств (Волжская Булгария, Золотая Орда, Сибирское ханство). Местные субстраты (финно-угорский, палеоазиатский, кавказский) создали уникальный облик каждого народа.</p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/tProish.png" alt="" className="" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/hist.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Исторические события</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Ключевые вехи: принятие ислама волжскими булгарами (X в.) и Золотой Ордой, определившее культуру татар, башкир, кавказских тюрков; присоединение к России (XVI-XVIII вв.); христианизация чувашей и части татар; Якутское казачество и освоение Сибири; депортация карачаевцев и балкарцев (1943-44); рост национального самосознания в конце XX века.
                </p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/tHist.png" alt="" className="" />
            </div>
        </div>

      </div>

    </div>
  )
}

export default Turki