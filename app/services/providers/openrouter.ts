import { AI_SYSTEM_PROMPT } from '../../config/prompts';

interface OpenRouterModelData {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export class OpenRouterProvider {
  private static instance: OpenRouterProvider;
  private apiKey: string;
  private static defaultModel: string = 'deepseek/deepseek-r1-0528:free';

  private constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  public static getInstance(): OpenRouterProvider {
    if (!OpenRouterProvider.instance) {
      OpenRouterProvider.instance = new OpenRouterProvider();
    }
    return OpenRouterProvider.instance;
  }

  public async *generateResponse(prompt: string, model: string = OpenRouterProvider.defaultModel): AsyncIterable<string> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://quran-ai.vercel.app', // Required by OpenRouter
          'X-Title': 'Quran AI App' // Required by OpenRouter
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: AI_SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Could not get reader from response body.");
      }

      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        buffer += decoder.decode(value, { stream: true });

        // Process lines as they come in
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              console.warn("Could not parse OpenRouter stream chunk:", data, e);
            }
          }
        }
      }

      // Yield any remaining content in the buffer
      if (buffer) {
        try {
          const json = JSON.parse(buffer);
          const content = json.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          // If the remaining buffer is not a complete JSON, it's fine, just ignore.
        }
      }

    } catch (error) {
      console.error('Error generating response from OpenRouter:', error);
      throw error;
    }
  }
}