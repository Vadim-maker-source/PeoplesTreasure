import Link from 'next/link'
import React from 'react'

const Home = () => {
  return (
    <div className="w-full h-full scroll-smooth overflow-hidden">
      <div className="w-full h-full">

            <img src="/images/main-bg2.png" alt="" className="w-full" />
            <div className="button-go">
              <a href="#narodi"><button className="lg:px-12 lg:py-4 lg:w-64 md:px-8 md:py-2 py-1 md:w-32 w-24 text-center rounded-full bg-[#FFB840] text-black lg:text-lg md:text-md text-sm cursor-pointer hover:opacity-80 duration-200">Поехали!</button></a>
            </div>

      </div>

      <div className="w-full" id='narodi'>
        <div className="w-full px-[11%] py-10 bg-[#FFF0F0] flex lg:flex-row flex-col items-center justify-between gap-10">
          <img src="/images/home/kavkaz.png" alt="" className="rounded-3xl" />
          <div className="flex flex-col gap-16 items-start justify-end w-full">
            <div className="flex flex-col items-start w-full gap-6">
              <h1 className="text-2xl font-bold">Народы Северного Кавказа</h1>
              <p className="text-lg">Народы Северного Кавказа — это уникальное многонациональное сообщество (более 50 этносов), проживающее на юге России. Коренные народы (чеченцы, аварцы, черкесы, осетины и др.) отличаются культом гостеприимства, уважением к старшим, сложными традициями и в основном исповедуют ислам суннитского толка, за исключением православных осетин.</p>
            </div>
            <Link href="/kavkaz" className="px-12 py-4 md:w-72 rounded-full text-center bg-[#FFB840] text-black md:text-lg text-md hover:bg-[#FFCB73] cursor-pointer duration-200">Узнать больше</Link>
          </div>
        </div>

        <div className="w-full flex justify-center">
          <img src="/images/railway.png" alt="" />
        </div>

        <div className="w-full px-[11%] py-10 bg-[#FFF0F0] flex lg:flex-row flex-col items-center justify-between gap-10">
          <img src="/images/home/image 6.png" alt="" className="rounded-3xl" />
          <div className="flex flex-col gap-16 items-start justify-end w-full">
            <div className="flex flex-col items-start w-full gap-6">
              <h1 className="text-2xl font-bold">Тюркские народы</h1>
              <p className="text-lg font-sans">Тюркские народы — это многочисленная этноязыковая общность (более 40 этносов), объединяющая народы от Юго-Восточной Европы до Северо-Восточной Азии. Коренные народы (турки, узбеки, казахи, татары, азербайджанцы и др.) отличаются богатым кочевым наследием, развитыми традициями декоративно-прикладного искусства, особым почтением к предкам и в большинстве своем исповедуют ислам суннитского толка, за исключением православных чувашей и гагаузов, а также тувинцев-буддистов и якутов-шаманистов.</p>
            </div>
            <Link href="/turki" className="px-12 py-4 md:w-72 rounded-full text-center bg-[#FFB840] text-black md:text-lg text-md hover:bg-[#FFCB73] cursor-pointer duration-200">Узнать больше</Link>
          </div>
        </div>

        <div className="w-full flex justify-center">
          <img src="/images/railwayTrain.png" alt="" />
        </div>

        <div className="w-full px-[11%] py-10 bg-[#FFF0F0] flex lg:flex-row flex-col items-center justify-between gap-10">
          <img src="/images/home/fin.png" alt="" className="rounded-3xl" />
          <div className="flex flex-col gap-16 items-start justify-end w-full">
            <div className="flex flex-col items-start w-full gap-6">
              <h1 className="text-2xl font-bold">Финно-угорские народы</h1>
              <p className="text-lg">Финно-угорские народы — это крупная этноязыковая группа (около 25 этносов), населяющая территории Северной и Центральной Европы, а также значительную часть России. Коренные народы (венгры, финны, эстонцы, мордва, удмурты, мари, карелы и др.) отличаются глубокой привязанностью к лесной культуре, самобытным фольклором с акцентом на мифологию и силы природы, и в основном исповедуют христианство (протестантизм и православие), сохраняя при этом в ряде регионов элементы традиционных верований и шаманизма.</p>
            </div>
            <Link href="/fin-ug" className="px-12 py-4 md:w-72 rounded-full text-center bg-[#FFB840] text-black md:text-lg text-md hover:bg-[#FFCB73] cursor-pointer duration-200">Узнать больше</Link>
          </div>
        </div>

        <div className="w-full flex justify-center">
          <img src="/images/railway.png" alt="" />
        </div>

        <div className="w-full px-[11%] py-10 bg-[#FFF0F0] flex lg:flex-row flex-col items-center justify-between gap-10">
          <img src="/images/home/mong.png" alt="" className="rounded-3xl" />
          <div className="flex flex-col gap-16 items-start justify-end w-full">
            <div className="flex flex-col items-start w-full gap-6">
              <h1 className="text-2xl font-bold">Монгольские народы</h1>
              <p className="text-lg">Монгольские народы — это этноязыковая общность (около 10 этносов), исторически сформировавшаяся в Центральной Азии и объединенная родством языков и общей историей великих кочевых империй. Коренные народы (монголы, буряты, калмыки, ойраты и др.) отличаются уникальной культурой «ноядной» цивилизации, мастерством верховой езды, традициями горлового пения и в большинстве своем исповедуют буддизм (тибетская школа Гелуг), сохраняя глубокое почтение к древнему шаманизму и культу Вечного Синего Неба (Тенгри).</p>
            </div>
            <Link href="/mongoly" className="px-12 py-4 md:w-72  rounded-full text-center bg-[#FFB840] text-black md:text-lg text-md hover:bg-[#FFCB73] cursor-pointer duration-200">Узнать больше</Link>
          </div>
        </div>

      </div>

      <div className="w-full p-10 hidden xl:flex flex-col items-center justify-center bg-[#FFF0F0] mt-24 mb-10" id='map'>
        <img src="/images/mapppN.png" className="w-[1331.2px]" />
        <div className="flex items-start">
        <div className="tatari flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold underline"><Link href="/Татары">Татары</Link></p></div>

        <div className="bashkiri flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold underline"><Link href="/Башкиры">Башкиры</Link></p></div>

        <div className="komi flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Коми</p></div>

        <div className="armyane flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Армяне</p></div>
        <div className="chechenci flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Чеченцы</p></div>
        <div className="nenci flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold underline"><Link href="/Ненцы">Ненцы</Link></p></div>
        <div className="russians flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Русские</p></div>
        <div className="manci flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Манси</p></div>
        <div className="hanti flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Ханты</p></div>
        <div className="chuvashi flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Чуваши</p></div>
        <div className="tiva flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Тыва</p></div>
        {/* <div className=" flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Башкиры</p></div> */}
        {/* <div className=" flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Башкиры</p></div> */}
        {/* <div className=" flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Башкиры</p></div> */}
        {/* <div className=" flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Башкиры</p></div> */}
        {/* <div className=" flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Башкиры</p></div> */}
        {/* <div className=" flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Башкиры</p></div> */}
        {/* <div className=" flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Башкиры</p></div> */}
        {/* <div className=" flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Башкиры</p></div> */}
        {/* <div className=" flex items-center gap-1"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold">Башкиры</p></div> */}

        </div>
        <div className="chukchi flex items-center gap-1 absolute"><div className="h-4 aspect-square bg-red-600 rounded-full"></div><p className="text-white font-bold underline"><Link href="/Чукчи">Чукчи</Link></p></div>
        <p className="text-4xl text-[#FFA100] font-bold">Нажимай на название народа. Знакомься с его культурой!</p>
        <p className="text-md text-[#FFCB73] font-bold mt-4">*В данной версии сайта кликабельны ссылки: Татары, Башкиры, Ненцы, Чукчи</p>
      </div>
      <div className="xl:hidden block px-6 py-8">
      <div className="text-2xl text-[#FFA100] font-bold flex flex-col items-center gap-4">Также познакомьтесь с:
        <div className="grid grid-cols-2 grid-rows-2 gap-x-10 gap-y-2">
          <p className="text-[#FF7340] hover:opacity-80 font-bold underline"><Link href="/Татары">Татарами</Link></p>
          <p className="text-[#FF7340] hover:opacity-80 font-bold underline"><Link href="/Башкиры">Башкирами</Link></p>
          <p className="text-[#FF7340] hover:opacity-80 font-bold underline"><Link href="/Ненцы">Ненцами</Link></p>
          <p className="text-[#FF7340] hover:opacity-80 font-bold underline"><Link href="/Чукчи">Чукчами</Link></p>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Home