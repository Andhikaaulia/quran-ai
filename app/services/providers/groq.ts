import { Groq } from 'groq-sdk';
import { AI_SYSTEM_PROMPT } from '../../config/prompts';

interface GroqModelData {
  id: string;
  active: boolean;
}

export class GroqProvider {
  private static instance: GroqProvider;
  private client: Groq;

  private constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  public static getInstance(): GroqProvider {
    if (!GroqProvider.instance) {
      GroqProvider.instance = new GroqProvider();
    }
    return GroqProvider.instance;
  }

  public async *generateResponse(prompt: string, model: string = 'mixtral-8x7b-32768'): AsyncIterable<string> {
    try {
      const stream = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        model: model,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      });

      for await (const chunk of stream) {
        yield chunk.choices[0]?.delta?.content || '';
      }
    } catch (error) {
      console.error('Groq API Streaming Error:', error);
      throw new Error('Failed to stream response from Groq');
    }
  }
} 