'use client'

import React, { useState } from 'react'

const Kavkaz = () => {

  const [currentSlide, setCurrentSlide] = useState(0);
  
  const foodImages = [
    { src: '/images/kFood1.png', alt: 'Хинкали' },
    { src: '/images/kFood2.webp', alt: 'Чурек' },
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
        <h1 className="text-3xl text-black dark:text-white font-semibold text-center mt-8">Народы Северного Кавказа</h1>
      <div className="w-full mt-8 mb-8">
        <div className="w-full h-4 bg-[#FFA100]"></div>
        <div className="w-full h-4 bg-[#FF7C00]"></div>
        <div className="w-full h-4 bg-[#FF4500]"></div>
      </div>

<div className="w-full md:px-15 px-5 py-10">
      <img src="/images/kMain.png" alt="" className='w-full rounded-xl' />
</div>

      <div className="flex flex-col md:px-15 px-5 gap-10 pb-15">
        <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full break-all rounded-lg">
            <p className="text-lg text-black">Кавказцы-Это коренные этносы, чья культура сформировалась в суровых горных условиях. Их отличает невероятное разнообразие при глубокой общности ключевых ценностей.</p>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/peopleGroup.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black dark:text-white font-semibold">Численность</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg text-black">От миллионов (чеченцы, аварцы) до десятков тысяч (многие народы Дагестана). Это плотная мозаика больших и малых народов.</p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-2xl">
                <img src="/images/kch.png" alt="" className="w-full" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/langFamily.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black dark:text-white font-semibold">Языковая семья</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg text-black">Нахско-дагестанская, абхазо-адыгская, тюркская и иранская. Их языки часто взаимонепонятны даже внутри одной семьи, что создает уникальное лингвистическое разнообразие.</p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/reg.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black dark:text-white font-semibold">Регион проживания</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg text-black">Компактно в республиках от Черного до Каспийского морей: Дагестан, Чечня, Ингушетия, Северная Осетия, Кабардино-Балкария, Карачаево-Черкесия, Адыгея. Исторически осваивали ярусы от высокогорий до равнин.</p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-2xl">
                <img src="/images/kReg.png" alt="" className="w-full" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/traditions.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black dark:text-white font-semibold">Традиции</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg text-black">Основаны на священном кодексе чести (Адыгэ Хабзэ, Нахчалла). Главные столпы: абсолютное гостеприимство, железное уважение к старшим, родовая солидарность и понятие «яхь» — стремление к личному и родовому превосходству в доблести и благородстве. Это система самоуправления через советы старейшин и строгих социальных регуляторов. Табу, обычаи примирения и коллективная ответственность часто были сильнее писаных законов. Традиция куначества (побратимства) скрепляла связи между людьми и народами.</p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/food.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black dark:text-white font-semibold">Еда</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg text-black">Сытная и простая пища горца: баранина и говядина, лепешки (чурек), отварные кусочки теста с мясом (хинкал), кисломолочные продукты (айран) и сыры. Еда — символ достатка и щедрости, центральный элемент любого застолья.</p>
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
                <h1 className="text-3xl text-black dark:text-white font-semibold">Костюм</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg text-black">Мужская черкеска с газырями и папаха — это визитная карточка кавказца, символ достоинства и готовности к бою. Женский костюм — это закрытое, но изысканно отделанное платье, подчеркивающее скромность, осанку и благородство хозяйки.
                </p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-2xl">
                <img src="/images/kSuit.jpg" alt="" className="rounded-lg w-full" />
            </div>

        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/guitar.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black dark:text-white font-semibold">Фольклор</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg text-black">Общий фундамент — героический Нартский эпос. Его дополняют песни о легендарных абреках и исторических битвах. Танец «лезгинка» в разных вариациях — это не просто пляска, а пластичное выражение духа: мужская мощь и гордость против женской грации и сдержанности.</p>
            </div>

            <div className=" bg-[#FFF0F0] md:w-[60%] w-full rounded-2xl">
                <img src="/images/kFolklor.png" alt="" className="w-full" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/language.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black dark:text-white font-semibold">Язык</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg text-black">Каждый народ бережно хранит свой язык как главный маркер идентичности. Многие находятся под угрозой исчезновения. Письменность в основном на кириллице, но с глубокими историческими пластами арабских и тюркских заимствований.
                </p>
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/globus.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black dark:text-white font-semibold">Происхождение</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg text-black">Автохтоны Кавказа. Их формирование — результат смешения древнейшего местного населения с волнами пришлых кочевников (скифы, аланы, тюрки) в изоляции горных ущелий, что и породило такое этническое богатство.
                </p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-2xl">
                <img src="/images/kProish.png" alt="" className="w-full" />
            </div>
        </div>

        <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
                <img src="/images/hist.png" alt="" className="w-8" />
                <h1 className="text-3xl text-black dark:text-white font-semibold">Исторические события</h1>
            </div>

            <div className="px-3 py-2 bg-[#FFF0F0] md:w-[60%] w-full rounded-lg">
                <p className="text-lg text-black">Общая судьба определилась Кавказской войной XIX века, трагедией мухаджирства (исхода) и сталинской депортацией. Эти травмы сплотили народы и закалили их волю к сохранению себя. Современный период — это сложный путь от конфликтов 1990-х к сегодняшней стабилизации.</p>
            </div>

            <div className="bg-[#FFF0F0] md:w-[60%] w-full rounded-2xl">
                <img src="/images/kHist.png" alt="" className="w-full" />
            </div>
        </div>

      </div>

    </div>
  )
}

export default Kavkaz