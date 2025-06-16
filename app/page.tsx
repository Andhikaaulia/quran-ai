"use client";

import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { SurahCard } from "./components/SurahCard";
import { LastReadCard } from "./components/LastReadCard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { IoSearch } from "react-icons/io5";
import { QuranService, Surah } from "@/app/services/quran";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("sura");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [errorFetchingSurahs, setErrorFetchingSurahs] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const quranService = QuranService.getInstance();
        const fetchedSurahs = await quranService.getAllSurahs();
        setSurahs(fetchedSurahs);
      } catch (error: any) {
        console.error("Error fetching surahs:", error);
        setErrorFetchingSurahs(error.message || "Gagal memuat daftar surah.");
      } finally {
        setLoadingSurahs(false);
      }
    };

    fetchSurahs();
  }, []);

  const lastReadSurahs = [
    {
      surahName: "Al-Baqarah",
      verseInfo: "Verse 285",
      surahNumber: 2,
    },
    {
      surahName: "Al-Mumtahanah",
      verseInfo: "Verse 9",
      surahNumber: 60,
    },
    {
      surahName: "Al-Mulk",
      verseInfo: "Verse 1",
      surahNumber: 67,
    },
  ];

  const juz = Array.from({ length: 30 }, (_, i) => ({
    name: `Juz ${i + 1}`,
    nameArabic: `جزء ${i + 1}`,
    numberOfAyahs: (i + 1) * 10, // Dummy value, actual will be fetched on click
    revelationType: "-",
    number: i + 1,
  }));

  const hizb = Array.from({ length: 60 }, (_, i) => ({
    name: `Hizb ${i + 1}`,
    nameArabic: `حزب ${i + 1}`,
    numberOfAyahs: (i + 1) * 5, // Dummy value
    revelationType: "-",
    number: i + 1,
  }));

  const ruku = Array.from({ length: 558 }, (_, i) => ({
    name: `Ruku ${i + 1}`,
    nameArabic: `ركوع ${i + 1}`,
    numberOfAyahs: (i + 1) * 2, // Dummy value
    revelationType: "-",
    number: i + 1,
  }));

  const filteredSurahs = surahs.filter((surah) =>
    surah.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surah.nameArabic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar onToggleSearch={() => setShowSearchBar(!showSearchBar)} />
      <div className="container mx-auto px-4 py-8">
        {/* Last Read Section - Hidden */}
        {/* <h2 className="text-2xl font-bold mb-4">Terakhir Dibaca</h2>
        <div className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar mb-8">
          {lastReadSurahs.map((item, index) => (
            <LastReadCard
              key={index}
              surahName={item.surahName}
              verseInfo={item.verseInfo}
              surahNumber={item.surahNumber}
            />
          ))}
        </div> */}

        {/* Filter Navigation and Content */}
        <Tabs defaultValue="sura" value={activeFilter} onValueChange={setActiveFilter} className="w-full flex flex-col items-center">
          <TabsList className="mb-8">
            <TabsTrigger
              value="sura"
              className="px-4 py-2"
            >
              Surah
            </TabsTrigger>
            <TabsTrigger
              value="juz"
              className="px-4 py-2"
            >
              Juz
            </TabsTrigger>
            <TabsTrigger
              value="hizb"
              className="px-4 py-2"
            >
              Hizb
            </TabsTrigger>
            <TabsTrigger
              value="ruku"
              className="px-4 py-2"
            >
              Ruku
            </TabsTrigger>
          </TabsList>

          {showSearchBar && (
            <div className="mb-4 w-full flex justify-center">
              <Input
                type="text"
                placeholder="Cari Surah, Juz, Hizb, atau Ruku..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md"
              />
            </div>
          )}

          <TabsContent value="sura" className="w-full">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loadingSurahs ? (
                <div className="col-span-full flex justify-center items-center h-48">
                  <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                  <span className="text-lg text-primary">Memuat Surah...</span>
                </div>
              ) : errorFetchingSurahs ? (
                <div className="col-span-full text-center text-red-500 text-lg">
                  Error: {errorFetchingSurahs}
                </div>
              ) : (
                filteredSurahs.map((surah) => (
                  <SurahCard key={surah.number} {...surah} showAiIcon={true} type="surah" />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="juz" className="w-full">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {juz.map((juzItem) => (
                <SurahCard key={juzItem.number} {...juzItem} showAiIcon={false} type="juz" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hizb" className="w-full">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {hizb.map((hizbItem) => (
                <SurahCard key={hizbItem.number} {...hizbItem} showAiIcon={false} type="hizb" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ruku" className="w-full">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ruku.map((rukuItem) => (
                <SurahCard key={rukuItem.number} {...rukuItem} showAiIcon={false} type="ruku" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
