"use client";

import { useState, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AIService } from "@/app/services/ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ModeToggle } from "@/app/components/ModeToggle";
import { FaCopy } from "react-icons/fa";

interface ModelItem {
  id: string;
  name: string;
}

interface ModelFetchResult {
  models: ModelItem[];
  selectedModel: string;
  selectedProvider: "together" | "groq" | "openrouter";
}

console.log('ChatPage component rendering...');

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIProviderOption {
  id: string;
  name: string;
}

const aiProviderOptions: AIProviderOption[] = [
  { id: "groq", name: "Groq" },
  { id: "openrouter", name: "OpenRouter" },
  { id: "together", name: "Together.ai" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState("together");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

  useEffect(() => {
    console.log('useEffect (model fetch) triggered. selectedProvider:', selectedProvider);

    const fetchModels = async () => {
      setLoading(true);
      try {
        const models = await AIService.getAvailableModels(selectedProvider);
        setAvailableModels(models.map((model: ModelItem) => model.id));
        if (models.length > 0) {
          setSelectedModel(models[0].id);
        } else {
          setSelectedModel("");
        }
      } catch (error) {
        console.error("Error fetching models:", error);
        setAvailableModels([]);
        setSelectedModel("");
      } finally {
        setLoading(false);
      }
    };

    if (selectedProvider) {
      fetchModels();
    }
  }, [selectedProvider]);

  const handleSendMessage = async (messageContent: string = input) => {
    if (messageContent.trim() && !loading) {
      setMessages(prev => [...prev, { role: 'user', content: messageContent }]);
      setShowInitialMessage(false);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: messageContent,
            provider: selectedProvider,
            model: selectedModel,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to get response from AI.');
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let assistantResponse = '';

        // Add a placeholder for the assistant's message
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        if (!reader) {
          throw new Error("Could not get reader from response body.");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          assistantResponse += chunk;

          // Update the last message with the streaming content
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessageIndex = newMessages.length - 1;
            // Ensure the last message is from the assistant and update its content
            if (newMessages[lastMessageIndex]?.role === 'assistant') {
              newMessages[lastMessageIndex].content = assistantResponse.replace(/<think>[\s\S]*?<\/think>/g, '');
            }
            return newMessages;
          });
        }
      } catch (error: unknown) {
        console.error('Error:', error);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${error instanceof Error ? error.message : 'Failed to get response from AI. Please try again.'}` 
        }]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleShortcutClick = (shortcutText: string) => {
    handleSendMessage(shortcutText);
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b border-border text-foreground text-xl font-bold flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition-colors">
            <IoArrowBack />
            <span className="sr-only">Kembali</span>
          </Button>
          <span>Obrolan AI</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle for Mobile */}
          <div className="lg:hidden">
            <ModeToggle />
          </div>
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <BsThreeDotsVertical className="h-5 w-5" />
                <span className="sr-only">Pengaturan</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Pengaturan AI</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="category" className="text-sm font-medium">Kategori</label>
                  <Select value={selectedProvider} onValueChange={(value: string) => {
                    console.log('Provider selected (mobile/dialog):', value);
                    setSelectedProvider(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiProviderOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="model" className="text-sm font-medium">Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.length === 0 && (
                        <SelectItem value="loading" disabled>
                          Sedang memuat model...
                        </SelectItem>
                      )}
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          {/* Dark Mode Toggle for Desktop */}
          <div>
            <ModeToggle />
          </div>
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <BsThreeDotsVertical className="h-5 w-5" />
                <span className="sr-only">Pengaturan</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Pengaturan AI</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="category" className="text-sm font-medium">Kategori</label>
                  <Select value={selectedProvider} onValueChange={(value: string) => {
                    console.log('Provider selected (desktop dialog):', value);
                    setSelectedProvider(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiProviderOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="model" className="text-sm font-medium">Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.length === 0 && (
                        <SelectItem value="loading" disabled>
                          Sedang memuat model...
                        </SelectItem>
                      )}
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <div className="flex-1 p-4 overflow-y-auto flex flex-col items-center">
        {showInitialMessage && messages.length === 0 && (
          <div className="text-center space-y-4 max-w-2xl w-full mx-auto py-20">
            <h2 className="text-2xl font-bold text-foreground">Tanya Apa Saja ke AI</h2>
            <p className="text-muted-foreground">Dapatkan jawaban instan tentang Al-Quran, Tafsir, Hadis, dan lainnya!</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => handleShortcutClick("Jelaskan rukun Islam")}>Jelaskan rukun Islam</Button>
              <Button variant="outline" onClick={() => handleShortcutClick("Ayat tentang kesabaran")}>Ayat tentang kesabaran</Button>
              <Button variant="outline" onClick={() => handleShortcutClick("Doa sebelum tidur")}>Doa sebelum tidur</Button>
              <Button variant="outline" onClick={() => handleShortcutClick("Kisah Nabi Muhammad SAW")}>Kisah Nabi Muhammad SAW</Button>
              <Button variant="outline" onClick={() => handleShortcutClick("Apa itu jihad dalam Islam?")}>Apa itu jihad dalam Islam?</Button>
              <Button variant="outline" onClick={() => handleShortcutClick("Surah favorit dan maknanya")}>Surah favorit dan maknanya</Button>
              <Button variant="outline" onClick={() => handleShortcutClick("Hadis tentang kebersihan")}>Hadis tentang kebersihan</Button>
              <Button variant="outline" onClick={() => handleShortcutClick("Perbedaan zakat dan infaq")}>Perbedaan zakat dan infaq</Button>
              <Button variant="outline" onClick={() => handleShortcutClick("Makna bismillah")}>Makna bismillah</Button>
              <Button variant="outline" onClick={() => handleShortcutClick("Adab membaca Al-Quran")}>Adab membaca Al-Quran</Button>
            </div>
          </div>
        )}
        {!showInitialMessage && messages.map((msg, index) => (
          <div key={index} className={`p-4 rounded-lg shadow-sm max-w-2xl w-full mx-auto my-2 ${
            msg.role === 'user' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-card text-foreground whitespace-pre-wrap'
          }`}>
            {msg.role === 'assistant' ? (
              <div className="relative">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-2 right-2 text-muted-foreground hover:text-foreground"
                  onClick={() => handleCopy(msg.content, index)}
                >
                  <FaCopy className="h-4 w-4" />
                  <span className="sr-only">Salin</span>
                </Button>
                {copiedMessageIndex === index && (
                  <span className="absolute bottom-2 right-12 text-xs text-green-500">Disalin!</span>
                )}
              </div>
            ) : (
              msg.content
            )}
          </div>
        ))}
        {loading && (
          <div className="text-center text-muted-foreground mt-4 max-w-2xl w-full mx-auto">
            Sedang memuat AI response...
          </div>
        )}
      </div>
      <div className="p-4 border-t border-border flex justify-center">
        <div className="flex gap-2 max-w-2xl w-full">
          <Input
            type="text"
            placeholder={loading ? "Sedang memproses..." : "Ketik pesan Anda..."}
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-grow"
            disabled={loading}
          />
          <Button onClick={() => handleSendMessage()} disabled={loading}>Kirim</Button>
        </div>
      </div>
    </div>
  );
} 