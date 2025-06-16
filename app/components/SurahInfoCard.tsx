"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface SurahInfoCardProps {
  surahNumber: number;
  surahName: string;
  englishTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export function SurahInfoCard({
  surahNumber,
  surahName,
  englishTranslation,
  numberOfAyahs,
  revelationType,
}: SurahInfoCardProps) {
  return (
    <Card className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 overflow-hidden mb-8 shadow-md rounded-lg relative">
      <CardContent className="flex p-4 items-center justify-between">
        <div className="flex flex-col space-y-1">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{surahName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{englishTranslation}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{numberOfAyahs} Ayat</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{revelationType}</p>
        </div>
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
          <Image
            src="/images/kaaba.png" // You might need to add a Kaaba image to your public/images folder
            alt="Kaaba"
            layout="fill"
            objectFit="contain"
            className="opacity-70"
          />
        </div>
      </CardContent>
    </Card>
  );
} 