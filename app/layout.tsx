import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased scroll-smooth bg-[#FFF9F9]`}
      >
        {children}
      </body>
    </html>
  );
}
