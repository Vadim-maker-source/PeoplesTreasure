import type { Metadata } from "next";
import { Geist, Nunito, Unbounded } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-unbounded',
});

const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-unbounded',
});

export const metadata: Metadata = {
  title: "Сокровища Народов | Исследуй культуру народов России!",
  description: "«Сокровища народов» — это просветительский проект, созданный с целью сохранения и популяризации культурного наследия народов России. Наша миссия — показать всё разнообразие и глубину традиций, ремёсел, языков и обычаев, чтобы это богатство стало ближе и понятнее каждому. Мы верим, что настоящие сокровища — это те нити, из которых соткана уникальная ткань нашей общей истории и идентичности. Присоединяйтесь к исследованию!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`
          ${unbounded.variable}
          ${geistSans.variable}
          ${geistSans.className}
          ${nunito.variable} 
          antialiased scroll-smooth bg-[#FFF9F9]
        `}
      >
        {children}
      </body>
    </html>
  );
}
