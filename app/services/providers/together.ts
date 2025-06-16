import { AI_SYSTEM_PROMPT } from '../../config/prompts';

export class TogetherProvider {
  private static instance: TogetherProvider;
  private apiKey: string;
  private defaultModel: string = 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free';

  private constructor() {
    this.apiKey = process.env.TOGETHER_API_KEY || '';
  }

  public static getInstance(): TogetherProvider {
    if (!TogetherProvider.instance) {
      TogetherProvider.instance = new TogetherProvider();
    }
    return TogetherProvider.instance;
  }

  public async *generateResponse(prompt: string, model: string = this.defaultModel): AsyncIterable<string> {
    try {
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
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
          stream: true
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
              console.warn("Could not parse Together.ai stream chunk:", data, e);
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
      console.error('Error generating response from Together.ai:', error);
      throw error;
    }
  }
} 