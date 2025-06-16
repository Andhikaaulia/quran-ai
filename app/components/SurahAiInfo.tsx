"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AIService } from "@/app/services/ai";
import { Button } from "@/components/ui/button";

interface SurahAiInfoProps {
  surahNumber: number;
  surahName: string;
}

interface ModelItem {
  id: string;
  name: string;
}

export const SurahAiInfo: React.FC<SurahAiInfoProps> = ({
  surahNumber,
  surahName,
}) => {
  const [aiResponse, setAiResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [hasRequestedInfo, setHasRequestedInfo] = useState(false);

  const fetchSurahInfo = async () => {
    setLoading(true);
    setError(null);
    setAiResponse("");
    setHasRequestedInfo(true);

    const prompt = `Berikan informasi lengkap tentang Surah ${surahName} (Surah ke-${surahNumber}) dari Al-Quran. Sertakan informasi berikut dalam format poin-poin yang mudah dibaca, gunakan judul untuk setiap bagian, dan pastikan setiap judul dicetak tebal. Format judul harus seperti: ### **Nama Bagian**\n\n### **Arti Surah**\n### **Jumlah Ayat**\n### **Sejarah Surah**\n### **Pokok Bahasan**\n### **Ayat Pilihan**:\n- Sebutkan beberapa ayat kunci atau penting dari surah ini (tidak perlu teks ayatnya, cukup referensinya seperti [Surah:Ayat] dan inti pesannya).\n### **Asbabun Nuzul**:\n- Jika ada, jelaskan sebab-sebab atau peristiwa di balik turunnya beberapa ayat dalam surah ini.`;

    try {
      let currentModels = availableModels;
      let currentSelected = selectedModel;

      // Fetch models if not already fetched or selected model is invalid
      if (currentModels.length === 0) {
        currentModels = await AIService.getAvailableModels("together");
        setAvailableModels(currentModels);
        if (currentModels.length > 0) {
          const togetherAiModel = currentModels.find(model => model.id.includes("together") || model.id.includes("llama"));
          currentSelected = togetherAiModel ? togetherAiModel.id : currentModels[0].id;
          setSelectedModel(currentSelected);
        }
      }

      if (!currentSelected) {
        setError("Tidak ada model AI yang tersedia. Silakan coba lagi nanti.");
        setLoading(false);
        return;
      }

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          provider: "together", // Use 'together' as provider for surah info
          model: currentSelected,
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
        setAiResponse(streamedResponse.replace(/<think>[\s\S]*?<\/think>/g, ''));
      }
    } catch (err: any) {
      console.error("Error fetching surah AI info:", err);
      setError(err.message || "Terjadi kesalahan saat memuat informasi AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-8 p-4 bg-card rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-foreground mb-4">Informasi AI untuk Surah {surahName}</h2>
      <div className="flex justify-end mb-4">
        <Button onClick={fetchSurahInfo} disabled={loading}>
          {loading ? "Memuat..." : hasRequestedInfo ? "Muat Ulang Informasi AI" : "Muat Informasi AI"}
        </Button>
      </div>
      
      {hasRequestedInfo && (
        <div>
          {loading && <p className="text-center text-muted-foreground">Memuat informasi AI...</p>}
          {error && <p className="text-center text-destructive">Error: {error}</p>}
          {!loading && !error && aiResponse && (
            <div className="prose dark:prose-invert max-w-none space-y-2 leading-relaxed whitespace-pre-wrap">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiResponse}
              </ReactMarkdown>
            </div>
          )}
          {!loading && !error && !aiResponse && <p className="text-center text-muted-foreground">Tekan tombol di atas untuk memuat informasi AI.</p>}
        </div>
      )}
    </div>
  );
}; 