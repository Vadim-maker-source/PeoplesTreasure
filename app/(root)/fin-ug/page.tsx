'use client'

import React, { useState } from 'react'

const FinUg = () => {

  const [currentSlide, setCurrentSlide] = useState(0);
  
  const foodImages = [
    { src: '/images/finFood1.png', alt: 'Буузы' },
    { src: '/images/finFood2.webp', alt: 'сүүтэй цай' },
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
        <h1 className="text-3xl text-black font-semibold text-center mt-8">Финно-Угорские народы</h1>
      <div className="w-full mt-8 mb-8">
        <div className="w-full h-4 bg-[#FFA100]"></div>
        <div className="w-full h-4 bg-[#FF7C00]"></div>
        <div className="w-full h-4 bg-[#FF4500]"></div>
      </div>

<div className="w-full md:px-15 px-5 py-10">
      <img src="/images/fin-ugMain.png" alt="" className='w-full rounded-xl' />
</div>

      <div className="flex flex-col md:px-15 px-5 gap-10 pb-15">
        <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full break-all rounded-lg">
            <p className="text-lg">Финно-угорские народы — древнейшие обитатели лесной зоны Восточной Европы и Урала, «лесные» люди, чья культура сформирована в глубокой гармонии с природой. Они представляют западную ветвь уральской языковой семьи и известны своим спокойным, созерцательным характером, богатой мифологией и удивительной вышивкой.
            </p>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/peopleGroup.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Численность</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Крупнейшие: мордва (мокша и эрзя, ~700 тыс.), удмурты (~550 тыс.), марийцы (~500 тыс.), коми (~200 тыс.). Средние и малые: карелы (~40 тыс.), коми-пермяки (~55 тыс.), ханты (~31 тыс.), манси (~12 тыс.), вепсы (~6 тыс.), ижорцы, водь (сотни человек). Многие находятся на грани исчезновения.</p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/fch.png" alt="" className="" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/langFamily.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Языковая семья</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Уральская языковая семья, финно-угорская ветвь. Делится на группы: прибалтийско-финская (карелы, вепсы, ижорцы, водь), волжская (марийцы, мордва), пермская (коми, удмурты) и угорская (ханты, манси). Языки между группами не взаимопонятны.
                </p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/reg.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Регион проживания</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Компактно в своих республиках: Мордовия, Марий Эл, Удмуртия, Республика Коми, Карелия. А также в автономиях: Ханты-Мансийский АО — Югра, Ямало-Ненецкий АО (ханты, манси). Рассеяны в Кировской, Нижегородской, Пермской, Ленинградской, Тверской областях.</p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/finReg.png" alt="" className="" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/traditions.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Традиции</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Основаны на культе природы и почитании предков. Центральная идея — жизнь в равновесии с миром. Традиции скромности, неконфликтности, «тихого» упрямства. Сильна родовая и соседская взаимопомощь. Большую роль играли общинные сходы и советы старейшин.
                </p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/food.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Еда</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Сытная, простая, «лесная» и «деревенская». Основа — хлеб (часто ячменный или ржаной), пироги-ватрушки с разнообразной начинкой (перепечи у удмуртов). Обилие выпечки. Из мяса — баранина, говядина, птица; у угров — оленина и строганина из рыбы. Кислые супы (щавелевый), каши, дикоросы (грибы, ягоды). Ключевой напиток — пиво, имевшее сакральное значение в обрядах.
                </p>
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
                <p className="text-lg">Белоснежный (у многих народов) холст, богато украшенный вышивкой — главная визитная карточка. Вышивка (красный, черный, синий узор) — это не просто декор, а сакральный оберег, рассказывающий о мире. Женский: рубаха-туника, передник, пояс-оберег, сложный головной убор (сорока, тастар, айшон), нагрудные украшения. Мужской: холщовая рубаха, штаны, кафтан-зипун.
                </p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/finSuit.jpg" alt="" className="rounded-lg" />
            </div>

        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/guitar.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Фольклор</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Эпические песни и сказания о богатырях и создании мира (марийские, мордовские). Богатейший пласт лирических песен, плачей, заговоров. Волшебные сказки с лесными духами. У угров — медвежьи праздники с театрализованными представлениями, мифы о небесном всаднике или женщине-лосихе, давшей жизнь роду. Музыкальные инструменты: гусли (кюсле, кырган), жалейки, варганы.
                </p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/finFolklor.png" alt="" className="" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/guitar.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Язык</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Финно-угорские языки России находятся в разной степени сохранности. Государственные в республиках, но под сильным давлением русского. Марийский имеет две литературные нормы. Угорские языки (хантыйский, мансийский) — полисинтетические, с десятками диалектов, многие из которых бесписьменны. Ключевая угроза — потеря языковой передачи в семьях.
                </p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/globus.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Происхождение</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Восходят к древней уральской общности, предположительно сформировавшейся в районе Урала или Западной Сибири. Их предки начали расселяться на запад и юг несколько тысячелетий назад, ассимилируя древнейшее население и вступая в контакты с индо-ираноязычными, а затем тюркскими и славянскими племенами. Являются автохтонным (коренным) населением своих территорий.</p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/hist.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black font-semibold">Исторические события</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg">Длительное сосуществование с тюркскими народами (Волжская Булгария, Казанское ханство), оказавшее сильное культурное влияние. Постепенное вхождение в состав Русского государства (XI-XVI вв.), сопровождавшееся христианизацией, но часто поверхностной (сохранилось «двоеверие»). Угры Сибири (ханты, манси) пережили эпоху колонизации и промышленного освоения, поставившего под угрозу их традиционный уклад.</p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <img src="/images/finHist.png" alt="" className="rounded-lg" />
            </div>
        </div>

      </div>

    </div>
  )
}

export default FinUg