"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, ChangeEvent, KeyboardEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { SurahInfoCard } from "@/app/components/SurahInfoCard";
import { FaCopy, FaShareAlt, FaBookmark, FaThumbtack, FaEye, FaEyeSlash, FaRobot } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIService } from "@/app/services/ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { QuranService, SurahDetail, Ayah, JuzData, HizbData, RukuData } from "@/app/services/quran";

interface ModelItem {
  id: string;
  name: string;
}

interface ModelFetchResult {
  models: ModelItem[];
  selectedModel: string;
  selectedProvider: "together" | "groq" | "openrouter";
}

interface VerseProps {
  verseNumber: number;
  arabicText: string;
  indonesianText: string;
  showTranslation: boolean;
  surahName: string;
  key?: number;
  type: "surah" | "juz" | "hizb" | "ruku";
  parentNumber: number;
}

const VerseItem: React.FC<VerseProps> = ({
  verseNumber,
  arabicText,
  indonesianText,
  showTranslation,
  surahName,
  type,
  parentNumber
}) => {
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [showVerseActions, setShowVerseActions] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [aiDialogMessages, setAiDialogMessages] = useState<string[]>([]);
  const [aiDialogLoading, setAiDialogLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<"together" | "groq" | "openrouter">("together");
  const [error, setError] = useState<string | null>(null);

  const handleAiIconClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAiResponse(true);
    const { models } = await fetchModelsForDialog();
    if (models.length > 0) {
      fetchVerseAiInfo(true);
    }
  };

  const fetchModelsForDialog = async (): Promise<ModelFetchResult> => {
    setAiDialogLoading(true);
    setError(null);
    let allModels: ModelItem[] = [];
    let defaultSelectedId: string = "";
    let foundProvider: "together" | "groq" | "openrouter" = "together";

    const providers = ["together", "groq", "openrouter"];

    for (const provider of providers) {
      try {
        const models = await AIService.getAvailableModels(provider as "together" | "groq" | "openrouter");
        if (models.length > 0) {
          allModels = models;
          const preferredModel = models.find((model: ModelItem) => 
            model.id.includes("together") || 
            model.id.includes("llama") || 
            model.id.includes("mixtral") || 
            model.id.includes("gemma")
          );
          defaultSelectedId = preferredModel ? preferredModel.id : models[0].id;
          foundProvider = provider as "together" | "groq" | "openrouter";
          break;
        }
      } catch (error) {
        console.error(`Error fetching models from ${provider}:`, error);
      }
    }

    if (allModels.length === 0) {
      setError("Tidak ada model AI yang tersedia dari penyedia manapun.");
    }

    setAvailableModels(allModels);
    setSelectedModel(defaultSelectedId);
    setSelectedProvider(foundProvider);
    setAiDialogLoading(false);
    
    return {
      models: allModels,
      selectedModel: defaultSelectedId,
      selectedProvider: foundProvider
    };
  };

  const fetchVerseAiInfo = async (initialLoad: boolean = false) => {
    setAiDialogLoading(true);
    if (initialLoad) {
      setAiDialogMessages([]);
    }
    setError(null);

    try {
      const prompt = `Berikan informasi lengkap tentang Ayat ke-${verseNumber} dari ${type === "surah" ? `Surah ${surahName}` : type === "juz" ? `Juz ${parentNumber}` : type === "hizb" ? `Hizb ${parentNumber}` : `Ruku ${parentNumber}`} ini (${arabicText} - ${indonesianText}).\\nSertakan informasi berikut dalam format poin-poin yang mudah dibaca, gunakan judul untuk setiap bagian, dan pastikan setiap judul dicetak tebal. Format judul harus seperti: ### **Nama Bagian**\\n\\n### **Arti Ayat**\\n### **Tafsir Ibnu Katsir dan Jalalain**\\n### **Asbabun Nuzul**\\n### **Pelajaran dari Ayat**\\n### **Ayat Serupa**:\\n- Sebutkan referensi ayat lain yang memiliki kesamaan makna atau konteks.`;
      const { models, selectedModel: modelId, selectedProvider: provider } = await fetchModelsForDialog();
      
      if (models.length === 0) {
        setAiDialogMessages(["Error: Tidak ada model AI yang tersedia. Silakan coba lagi nanti."]);
        setAiDialogLoading(false);
        return;
      }

      if (!modelId || !provider) {
        setAiDialogMessages(["Error: Model atau provider tidak tersedia. Silakan coba lagi nanti."]);
        setAiDialogLoading(false);
        return;
      }

      console.log('Sending request with:', {
        provider,
        model: modelId,
        prompt
      });

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          provider,
          model: modelId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal mendapatkan respons dari AI.');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let streamedResponse = '';

      if (!reader) {
        throw new Error("Tidak dapat membaca respons dari AI.");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        streamedResponse += chunk;
        if (initialLoad) {
          setAiDialogMessages([streamedResponse.replace(/<think>[\s\S]*?<\/think>/g, '')]);
        } else {
          setAiDialogMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('AI:')) {
              newMessages[newMessages.length - 1] = `AI: ${streamedResponse.replace(/<think>[\s\S]*?<\/think>/g, '')}`;
            } else {
              newMessages.push(`AI: ${streamedResponse.replace(/<think>[\s\S]*?<\/think>/g, '')}`);
            }
            return newMessages;
          });
        }
      }
    } catch (error: any) {
      console.error("Error fetching verse AI info:", error);
      setAiDialogMessages((prevMessages) => [
        ...prevMessages,
        `AI: Maaf, terjadi kesalahan saat memuat informasi: ${error.message || "Tidak diketahui"}.`,
      ]);
    } finally {
      setAiDialogLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (chatInput.trim() && !aiDialogLoading) {
      const userMessage = `Anda: ${chatInput}`;
      setAiDialogMessages((prevMessages) => [...prevMessages, userMessage]);
      setChatInput("");
      setAiDialogLoading(true);
      setError(null);

      try {
        const prompt = `Berdasarkan ${type === "surah" ? `Surah ${surahName}` : type === "juz" ? `Juz ${parentNumber}` : type === "hizb" ? `Hizb ${parentNumber}` : `Ruku ${parentNumber}`}:\\nAyat ke-${verseNumber}: ${arabicText} (${indonesianText})\\n\\nPertanyaan: ${chatInput}`;
        if (!selectedModel) {
          setAiDialogMessages(["Error: Tidak ada model AI yang tersedia. Silakan coba lagi nanti."]);
          setAiDialogLoading(false);
          return;
        }

        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            provider: selectedProvider,
            model: selectedModel,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Gagal mendapatkan respons dari AI.');
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let streamedResponse = '';

        if (!reader) {
          throw new Error("Tidak dapat membaca respons dari AI.");
        }

        setAiDialogMessages((prevMessages) => [...prevMessages, `AI: `]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          streamedResponse += chunk;
          setAiDialogMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('AI:')) {
              newMessages[newMessages.length - 1] = `AI: ${streamedResponse.replace(/<think>[\s\S]*?<\/think>/g, '')}`;
            } else {
              newMessages.push(`AI: ${streamedResponse.replace(/<think>[\s\S]*?<\/think>/g, '')}`);
            }
            return newMessages;
          });
        }
      } catch (error: any) {
        console.error("Error sending chat message:", error);
        setAiDialogMessages((prevMessages) => [
          ...prevMessages,
          `AI: Maaf, terjadi kesalahan saat mengirim pesan: ${error.message || "Tidak diketahui"}.`,
        ]);
      } finally {
        setAiDialogLoading(false);
      }
    }
  };

  const handleVerseClick = () => {
    setShowVerseActions(!showVerseActions);
  };

  const handleCopy = (e: React.MouseEvent) => { e.stopPropagation(); console.log(`Copy verse ${verseNumber}`); };
  const handleShare = (e: React.MouseEvent) => { e.stopPropagation(); console.log(`Share verse ${verseNumber}`); };
  const handleBookmark = (e: React.MouseEvent) => { e.stopPropagation(); console.log(`Bookmark verse ${verseNumber}`); };
  const handlePin = (e: React.MouseEvent) => { e.stopPropagation(); console.log(`Pin verse ${verseNumber}`); };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !aiDialogLoading) {
      handleChatSend();
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm flex flex-col items-start space-y-2 mb-4 cursor-pointer"
      onClick={handleVerseClick}
    >
      <div className="flex justify-between w-full items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-primary">{verseNumber}.</span>
          {showVerseActions && (
            <div className="flex items-center gap-2 ml-2">
              <Button variant="ghost" size="icon" onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
                <FaCopy />
                <span className="sr-only">Salin Ayat</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} className="text-muted-foreground hover:text-foreground transition-colors">
                <FaShareAlt />
                <span className="sr-only">Bagikan Ayat</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleBookmark} className="text-muted-foreground hover:text-foreground transition-colors">
                <FaBookmark />
                <span className="sr-only">Tandai Ayat</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={handlePin} className="text-muted-foreground hover:text-foreground transition-colors">
                <FaThumbtack />
                <span className="sr-only">Sematkan Ayat</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleAiIconClick} className="text-muted-foreground hover:text-foreground transition-colors">
                <Image src="/images/ai-icon.png" alt="AI Icon" width={16} height={16} />
                <span className="sr-only">Tanyakan AI</span>
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Reverting Arabic text styling to previous state */}
      <p className="text-right text-3xl leading-relaxed w-full" style={{ direction: "rtl" }}>{arabicText}</p>
      {showTranslation && (
        <p className="text-foreground text-md w-full">
          {indonesianText}
        </p>
      )}

      <Dialog open={showAiResponse} onOpenChange={setShowAiResponse}>
        <DialogContent className="sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl h-[calc(100vh-120px)] flex flex-col">
          <DialogHeader>
            <DialogTitle>Tentang Ayat {verseNumber} {type} {surahName}</DialogTitle>
            <DialogDescription>
              Tanyakan apa saja tentang ayat ini.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {aiDialogMessages.map((msg, index) => (
                <div key={index} className="p-2 rounded-lg bg-secondary text-secondary-foreground text-sm prose dark:prose-invert max-w-none whitespace-pre-wrap">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg}</ReactMarkdown>
                </div>
              ))}
              {aiDialogLoading && aiDialogMessages.length === 0 && (
                <div className="flex items-center justify-center p-4 text-muted-foreground">
                  <Loader2 size={16} />
                  <span className="ml-2">Sedang memuat informasi...</span>
                </div>
              )}
            </div>
            <div className="flex-none pt-4 border-t mt-4">
              <div className="flex gap-2">
                {false && ( // Still keeping this hidden as per previous request
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={aiDialogLoading}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Pilih Model AI" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  type="text"
                  placeholder={aiDialogLoading ? "Sedang memproses..." : "Ketik pertanyaan Anda..."}
                  value={chatInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="flex-grow"
                  disabled={aiDialogLoading}
                />
                <Button
                  onClick={handleChatSend}
                  disabled={aiDialogLoading}
                  className="min-w-[100px]"
                >
                  {aiDialogLoading ? (
                    <>
                      <Loader2 size={16} />
                      <span className="ml-2">Memproses</span>
                    </>
                  ) : (
                    "Kirim"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<SurahDetail | JuzData | HizbData | RukuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const type = params.type as "surah" | "juz" | "hizb" | "ruku";
  const number = parseInt(params.number as string);

  useEffect(() => {
    if (!number) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const quranService = QuranService.getInstance();
        let fetchedData: SurahDetail | JuzData | HizbData | RukuData;

        switch (type) {
          case "surah":
            fetchedData = await quranService.getSurahDetail(number);
            break;
          case "juz":
            fetchedData = await quranService.getJuzData(number);
            break;
          case "hizb":
            fetchedData = await quranService.getHizbData(number);
            break;
          case "ruku":
            fetchedData = await quranService.getRukuData(number);
            break;
          default:
            throw new Error("Tipe tidak valid.");
        }
        setData(fetchedData);
      } catch (err: any) {
        console.error(`Error fetching ${type} detail:`, err);
        setError(err.message || `Gagal memuat detail ${type}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [number, type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <span className="text-lg text-primary">Memuat {type}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 text-lg">
        Data tidak ditemukan.
      </div>
    );
  }

  const displayName = type === "surah" ? data.name : data.name;
  const displayArabicName = type === "surah" ? data.nameArabic : data.nameArabic;
  const displayAyahsCount = data.ayas.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 w-full p-4 border-b border-border bg-background z-10 flex items-center justify-between">
        <Button onClick={() => router.back()} variant="ghost" size="icon">
          <IoArrowBack className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold text-center flex-grow capitalize">{type} {data.number}</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <SlidersHorizontal className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Pengaturan Tampilan</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showTranslation}
                  onChange={() => setShowTranslation(!showTranslation)}
                  className="toggle toggle-primary"
                />
                <span>Tampilkan Terjemahan</span>
              </label>
            </div>
          </SheetContent>
        </Sheet>
      </header>
      <div className="container mx-auto px-4 py-8 pt-20">
        <SurahInfoCard
          surahNumber={data.number}
          surahName={displayName}
          englishTranslation={(data as SurahDetail).englishNameTranslation || ""}
          numberOfAyahs={displayAyahsCount}
          revelationType={type === "surah" ? (data as SurahDetail).revelationType : "-"}
        />

        <div className="mt-8 space-y-6">
          {data.ayas.map((ayah: Ayah) => (
            <VerseItem
              key={ayah.number}
              verseNumber={ayah.numberInSurah}
              arabicText={ayah.text}
              indonesianText={ayah.indonesianText || "Terjemahan tidak tersedia"}
              showTranslation={showTranslation}
              surahName={displayName} // Pass dynamic name
              type={type}
              parentNumber={data.number}
            />
          ))}
        </div>
      </div>
    </div>
  );
}