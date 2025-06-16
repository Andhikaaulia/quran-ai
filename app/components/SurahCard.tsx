import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, ChangeEvent, KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { AIService } from "@/app/services/ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelItem {
  id: string;
  name: string;
}

interface ModelFetchResult {
  models: ModelItem[];
  selectedModel: string;
  selectedProvider: "together" | "groq" | "openrouter";
}

interface SurahCardProps {
  name: string;
  nameArabic: string;
  numberOfAyahs: number;
  revelationType: string;
  number: number;
  showAiIcon: boolean;
  type?: "surah" | "juz" | "hizb" | "ruku";
}

export function SurahCard({
  name,
  nameArabic,
  numberOfAyahs,
  revelationType,
  number,
  showAiIcon,
  type = "surah",
}: SurahCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const router = useRouter();
  const [aiDialogMessages, setAiDialogMessages] = useState<string[]>([]);
  const [aiDialogLoading, setAiDialogLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<"together" | "groq" | "openrouter">("together");
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !aiDialogLoading) {
      handleChatSend();
    }
  };

  const handleAiIconClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAiResponse(true);
    const { models } = await fetchModelsForSurahDialog();
    if (models.length > 0) {
      fetchSurahAiInfo(true);
    }
  };

  const fetchModelsForSurahDialog = async (): Promise<ModelFetchResult> => {
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
          const preferredModel = models.find(model => 
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

  const fetchSurahAiInfo = async (initialLoad: boolean = false) => {
    setAiDialogLoading(true);
    if (initialLoad) {
      setAiDialogMessages([]);
    }
    setError(null);

    const prompt = `Berikan informasi lengkap tentang Surah ${name} (${nameArabic}).\nSertakan informasi berikut dalam format poin-poin yang mudah dibaca, gunakan judul untuk setiap bagian, dan pastikan setiap judul dicetak tebal. Format judul harus seperti: ### **Nama Bagian**\n\n### **Arti Nama Surah**\n### **Ringkasan Isi Surah**\n### **Fadhilah Surah**\n### **Kisah Terkait**:`;

    try {
      const { models, selectedModel: modelId, selectedProvider: provider } = await fetchModelsForSurahDialog();
      
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
      console.error("Error fetching surah AI info:", error);
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

      const prompt = `Berdasarkan Surah ${name} (${nameArabic}):\n\nPertanyaan: ${chatInput}`;

      try {
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
            newMessages[newMessages.length - 1] = `AI: ${streamedResponse.replace(/<think>[\s\S]*?<\/think>/g, '')}`;
            return newMessages;
          });
        }

      } catch (error) {
        console.error("Error getting AI response for surah chat:", error);
        setAiDialogMessages((prevMessages) => [
          ...prevMessages,
          `AI: Maaf, terjadi kesalahan saat memproses permintaan Anda.`,
        ]);
      } finally {
        setAiDialogLoading(false);
      }
    }
  };

  const handleCardClick = () => {
    if (type === "surah") {
      router.push(`/surah/${number}`);
    } else {
      router.push(`/${type}/${number}`);
    }
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow h-24 flex flex-col justify-center p-2 bg-card border-border shadow-sm relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <CardHeader className="p-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
              <span className="text-primary font-semibold">{number}</span>
            </div>
          <div>
              <CardTitle className="text-base leading-tight text-foreground">{name}</CardTitle>
              <p className="text-sm text-muted-foreground leading-tight mt-0">
                {numberOfAyahs} Ayat • {revelationType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isHovered && showAiIcon && (
              <Dialog open={showAiResponse} onOpenChange={setShowAiResponse}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={handleAiIconClick}
                  >
                    <Image src="/images/ai-icon.png" alt="AI Icon" width={20} height={20} />
                    <span className="sr-only">Tanyakan AI</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl h-[calc(100vh-120px)] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Tentang Surah {name}</DialogTitle>
                    <DialogDescription>
                      Tanyakan apa saja tentang surah ini.
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
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Sedang memuat informasi...</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-none pt-4 border-t mt-4">
                      <div className="flex gap-2">
                        {false && (
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
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Memproses
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
            )}
            <CardDescription className="text-lg mt-0 leading-tight text-right font-arabic text-foreground">{nameArabic}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
} 