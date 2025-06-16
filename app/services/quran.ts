export const QURAN_API_BASE_URL = "https://api.alquran.cloud/v1";

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  nameArabic: string; // Assuming this will be populated from the 'name' field that contains Arabic.
}

export interface SurahDetail {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayas: Ayah[];
  sajda: boolean;
  ruku: number;
  hizbQuarter: number;
  juz: number;
  manzil: number;
  page: number;
  nameArabic: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
  indonesianText?: string; // Make optional as it's added dynamically
}

export interface JuzData {
  number: number;
  name: string;
  nameArabic: string;
  ayas: Ayah[];
}

export interface HizbData {
  number: number;
  name: string;
  nameArabic: string;
  ayas: Ayah[];
}

export interface RukuData {
  number: number;
  name: string;
  nameArabic: string;
  ayas: Ayah[];
}

export class QuranService {
  private static instance: QuranService;

  private constructor() {}

  public static getInstance(): QuranService {
    if (!QuranService.instance) {
      QuranService.instance = new QuranService();
    }
    return QuranService.instance;
  }

  public async getAllSurahs(): Promise<Surah[]> {
    try {
      const response = await fetch(`${QURAN_API_BASE_URL}/surah`);
      if (!response.ok) {
        throw new Error(`Error fetching surahs: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data.map((surah: any) => ({
        number: surah.number,
        name: surah.englishName,
        englishName: surah.englishName,
        englishNameTranslation: surah.englishNameTranslation,
        numberOfAyahs: surah.numberOfAyahs,
        revelationType: surah.revelationType === "Meccan" ? "Makkiyah" : "Madaniyah",
        nameArabic: surah.name,
      }));
    } catch (error) {
      console.error("Failed to fetch all surahs:", error);
      throw error;
    }
  }

  public async getSurahDetail(surahNumber: number): Promise<SurahDetail> {
    try {
      const arabicResponse = await fetch(`/api/quran?type=surah&number=${surahNumber}&edition=quran-uthmani`);
      if (!arabicResponse.ok) {
        throw new Error(`Error fetching Arabic surah detail: ${arabicResponse.statusText}`);
      }
      const arabicData = (await arabicResponse.json()).data;
      const arabicAyas = arabicData.ayahs || [];

      const indonesianResponse = await fetch(`/api/quran?type=surah&number=${surahNumber}&edition=id.indonesian`);
      if (!indonesianResponse.ok) {
        throw new Error(`Error fetching Indonesian surah detail: ${indonesianResponse.statusText}`);
      }
      const indonesianData = (await indonesianResponse.json()).data;
      const indonesianAyas = indonesianData.ayahs || [];

      if (arabicAyas.length !== indonesianAyas.length) {
        console.warn("Ayat count mismatch between Arabic and Indonesian editions.");
      }

      const combinedAyas = arabicAyas.map((ayah: any, index: number) => ({
        number: ayah.number,
        text: ayah.text,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        manzil: ayah.manzil,
        page: ayah.page,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
        sajda: ayah.sajda,
        indonesianText: indonesianAyas[index] ? indonesianAyas[index].text : "Terjemahan tidak tersedia",
      }));

      return {
        number: arabicData.number,
        name: arabicData.englishName,
        englishName: arabicData.englishName,
        englishNameTranslation: arabicData.englishNameTranslation,
        numberOfAyahs: arabicData.numberOfAyahs,
        revelationType: arabicData.revelationType === "Meccan" ? "Makkiyah" : "Madaniyah",
        ayas: combinedAyas,
        sajda: arabicData.sajda,
        ruku: arabicData.ruku,
        hizbQuarter: arabicData.hizbQuarter,
        juz: arabicData.juz,
        manzil: arabicData.manzil,
        page: arabicData.page,
        nameArabic: arabicData.name,
      };
    } catch (error) {
      console.error(`Failed to fetch surah detail for ${surahNumber}:`, error);
      throw error;
    }
  }

  public async getJuzData(juzNumber: number): Promise<JuzData> {
    try {
      const arabicResponse = await fetch(`/api/quran?type=juz&number=${juzNumber}&edition=quran-uthmani`);
      if (!arabicResponse.ok) {
        throw new Error(`Error fetching Arabic juz data: ${arabicResponse.statusText}`);
      }
      const arabicData = (await arabicResponse.json()).data;
      const arabicAyas = arabicData.ayahs || [];

      const indonesianResponse = await fetch(`/api/quran?type=juz&number=${juzNumber}&edition=id.indonesian`);
      if (!indonesianResponse.ok) {
        throw new Error(`Error fetching Indonesian juz data: ${indonesianResponse.statusText}`);
      }
      const indonesianData = (await indonesianResponse.json()).data;
      const indonesianAyas = indonesianData.ayahs || [];

      if (arabicAyas.length !== indonesianAyas.length) {
        console.warn("Ayat count mismatch between Arabic and Indonesian editions.");
      }

      const combinedAyas = arabicAyas.map((ayah: any, index: number) => ({
        number: ayah.number,
        text: ayah.text,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        manzil: ayah.manzil,
        page: ayah.page,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
        sajda: ayah.sajda,
        indonesianText: indonesianAyas[index] ? indonesianAyas[index].text : "Terjemahan tidak tersedia",
      }));

      return {
        number: juzNumber,
        name: `Juz ${juzNumber}`,
        nameArabic: `جزء ${juzNumber}`,
        ayas: combinedAyas,
      };
    } catch (error) {
      console.error(`Failed to fetch juz ${juzNumber}:`, error);
      throw error;
    }
  }

  public async getHizbData(hizbNumber: number): Promise<HizbData> {
    try {
      const arabicResponse = await fetch(`/api/quran?type=hizbQuarter&number=${hizbNumber}&edition=quran-uthmani`);
      if (!arabicResponse.ok) {
        throw new Error(`Error fetching Arabic hizb data: ${arabicResponse.statusText}`);
      }
      const arabicData = (await arabicResponse.json()).data;
      const arabicAyas = arabicData.ayahs || [];

      const indonesianResponse = await fetch(`/api/quran?type=hizbQuarter&number=${hizbNumber}&edition=id.indonesian`);
      if (!indonesianResponse.ok) {
        throw new Error(`Error fetching Indonesian hizb data: ${indonesianResponse.statusText}`);
      }
      const indonesianData = (await indonesianResponse.json()).data;
      const indonesianAyas = indonesianData.ayahs || [];

      if (arabicAyas.length !== indonesianAyas.length) {
        console.warn("Ayat count mismatch between Arabic and Indonesian editions.");
      }

      const combinedAyas = arabicAyas.map((ayah: any, index: number) => ({
        number: ayah.number,
        text: ayah.text,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        manzil: ayah.manzil,
        page: ayah.page,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
        sajda: ayah.sajda,
        indonesianText: indonesianAyas[index] ? indonesianAyas[index].text : "Terjemahan tidak tersedia",
      }));

      return {
        number: hizbNumber,
        name: `Hizb ${hizbNumber}`,
        nameArabic: `حزب ${hizbNumber}`,
        ayas: combinedAyas,
      };
    } catch (error) {
      console.error(`Failed to fetch hizb ${hizbNumber}:`, error);
      throw error;
    }
  }

  public async getRukuData(rukuNumber: number): Promise<RukuData> {
    try {
      const arabicResponse = await fetch(`/api/quran?type=ruku&number=${rukuNumber}&edition=quran-uthmani`);
      if (!arabicResponse.ok) {
        throw new Error(`Error fetching Arabic ruku data: ${arabicResponse.statusText}`);
      }
      const arabicData = (await arabicResponse.json()).data;
      const arabicAyas = arabicData.ayahs || [];

      const indonesianResponse = await fetch(`/api/quran?type=ruku&number=${rukuNumber}&edition=id.indonesian`);
      if (!indonesianResponse.ok) {
        throw new Error(`Error fetching Indonesian ruku data: ${indonesianResponse.statusText}`);
      }
      const indonesianData = (await indonesianResponse.json()).data;
      const indonesianAyas = indonesianData.ayahs || [];

      if (arabicAyas.length !== indonesianAyas.length) {
        console.warn("Ayat count mismatch between Arabic and Indonesian editions.");
      }

      const combinedAyas = arabicAyas.map((ayah: any, index: number) => ({
        number: ayah.number,
        text: ayah.text,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        manzil: ayah.manzil,
        page: ayah.page,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
        sajda: ayah.sajda,
        indonesianText: indonesianAyas[index] ? indonesianAyas[index].text : "Terjemahan tidak tersedia",
      }));

      return {
        number: rukuNumber,
        name: `Ruku ${rukuNumber}`,
        nameArabic: `ركوع ${rukuNumber}`,
        ayas: combinedAyas,
      };
    } catch (error) {
      console.error(`Failed to fetch ruku ${rukuNumber}:`, error);
      throw error;
    }
  }
} 