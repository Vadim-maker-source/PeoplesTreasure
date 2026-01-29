'use client'

import React, { useState } from 'react'

const Mongoly = () => {

  const [currentSlide, setCurrentSlide] = useState(0);
  
  const foodImages = [
    { src: '/images/mongFood1.jpg', alt: 'Буузы' },
    { src: '/images/mongFood2.jfif', alt: 'сүүтэй цай' },
    { src: '/images/mongFood3.jfif', alt: 'Калмыцкий чай' },
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
    { src: '/images/mongSuit1.jpg', alt: 'дэгэл' },
    { src: '/images/mongSuit2.jpg', alt: 'цегдег' },
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
        <h1 className="text-3xl text-black font-semibold text-center mt-8">Монгольские народы</h1>
      <div className="w-full mt-8 mb-8">
        <div className="w-full h-4 bg-[#FFA100]"></div>
        <div className="w-full h-4 bg-[#FF7C00]"></div>
        <div className="w-full h-4 bg-[#FF4500]"></div>
      </div>

<div className="w-full md:px-15 px-5 py-10">
      <img src="/images/mongolyMain.png" alt="" className='w-full rounded-xl' />
</div>

      <div className="flex flex-col md:px-15 px-5 gap-10 pb-15">
        <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full break-all rounded-lg">
            <p className="text-lg">Монгольские народы России — это наследники великой степной империи, сохранившие уникальный синтез кочевой культуры и глубокой буддийской философии. Они живут на стыке степей, гор и тайги, что определяет их самобытный уклад.</p>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/peopleGroup.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Численность</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Два основных народа: буряты (~460 тыс.) и калмыки (~180 тыс.). Это коренные народы Сибири и Европейской России соответственно.</p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/mch.png" alt="" className="" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/langFamily.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Языковая семья</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Монгольская ветвь алтайской языковой семьи. Языки близкородственны, бурятский и калмыцкий (ойратский) диалекты входят в общемонгольский языковой континуум и исторически взаимопонятны.</p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/reg.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Регион проживания</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg"> Буряты: Республика Бурятия, Агинский Бурятский округ в Забайкальском крае, Иркутская область (Усть-Ордынский Бурятский округ). Калмыки: Республика Калмыкия — единственный регион в Европе, где монголоязычный народ и буддизм являются титульными.</p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/mongReg.png" alt="" className="" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/traditions.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Традиции</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Основаны на «трех столпах»: кочевом скотоводстве (конь, верблюд, овца), тибетском буддизме (ламаизм) школы Гелуг и древнем комплексе дошаманских и шаманских верований. Культ вежливости, степенного достоинства, почитания старших и духов местности (эжинов).</p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/food.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Еда</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Кухня кочевников-скотоводов. Основа — мясо (баранина, конина, у бурят — также говядина), молочные продукты (кислые и сушеные). Национальные блюда: позы/буузы (большие пельмени на пару), ботого (суп с мясом и тестом), сушеный творог (аарса, хуруд), соленый чай с молоком и маслом (джа, сүүтэй цай), кумыс из кобыльего молока. Калмыцкий чай часто варят с солью, перцем и маслом.</p>
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
                <p className="text-lg">Приспособлен для верховой езды и степного климата. Мужской: правозапашной халат (дэгэл, бииз) с высоким воротником, подпоясанный кушаком, шапка с ушами или остроконечная. Женский: халат-халат (дэгэл, цегдег) часто без пояса, с богатой отделкой парчой и серебром, сложные прически и украшения (серьги-«жоро», нагрудники). У калмычек — уникальные шапочки и шпильки для волос.</p>
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
                <p className="text-lg">Героический эпос: «Гэсэр» у бурят, «Джангар» у калмыков — гигантские эпические циклы, повествующие о борьбе богатырей с чудовищами за справедливость. Лирические песни, протяжные (уряал, ут дун), благопожелания (ереел, йорял), сказки. Музыкальные инструменты: морин хуур (скрипка с лошадиной головой) — символ бурятской культуры, домбры, флейты.</p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/mongFolklor.png" alt="" className="" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/guitar.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Язык</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Бурятский и калмыцкий (ойратский) языки. Письменность: исторически — старомонгольское вертикальное письмо, в XVII веке калмыки и часть бурят приняли ясное письмо (тодо бичиг), созданное Зая-Пандитой. В советское время — латиница, затем кириллица. Сегодня в Бурятии и Калмыкии идет возрождение старомонгольской письменности.</p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/globus.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Происхождение</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Восходят к общемонгольскому этносу, сформировавшемуся в Центральной Азии. Буряты — результат смешения пришедших в Прибайкалье монгольских племен с местными тюркскими и эвенкийскими родами. Калмыки (ойраты) — потомки западномонгольских племен, совершивших в XVII веке великий исход из Джунгарии в низовья Волги.</p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/hist.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Исторические события</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Ключевое: принятие тибетского буддизма (XVII-XVIII вв.), ставшего основой культуры. Вхождение в состав России: бурятских земель (XVII в.) и Калмыцкого ханства (XVII в.). Трагическая страница: депортация всего калмыцкого народа в Сибирь (1943-1957) по обвинению в коллаборационизме. В постсоветское время — религиозное и культурное возрождение, укрепление связей с монгольским миром (Монголия, Китай).</p>
            </div>
        </div>

      </div>

    </div>
  )
}

export default Mongoly