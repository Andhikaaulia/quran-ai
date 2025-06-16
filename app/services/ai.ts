import { AI_SYSTEM_PROMPT } from '../config/prompts';

interface ModelItem {
  id: string;
  name: string;
}

// Helper class for AI model management
class AIModelManager {
  static async getAvailableModels(provider: string): Promise<ModelItem[]> {
      try {
      const response = await fetch(`/api/${provider}-models`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
      return data.models.map((model: string) => ({ id: model, name: model }));
      } catch (error) {
      console.error(`Error fetching models from API route for ${provider}:`, error);
      // Fallback or re-throw based on desired error handling
      return [];
    }
  }
}

// Helper class for AI response generation
class AIResponseGenerator {
  static async getResponse(prompt: string, provider: string, model: string): Promise<string> {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${AI_SYSTEM_PROMPT}\n\nPertanyaan: ${prompt}`,
          provider: provider,
          model: model,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get response from AI.');
      }

      const data = await res.json();
      return data.response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw new Error('Failed to generate response from AI');
    }
  }
}

// Main AI service class
export class AIService {
  static async getAIResponseWithModel(prompt: string, provider: string, model: string): Promise<string> {
    return AIResponseGenerator.getResponse(prompt, provider, model);
  }

  static async getAvailableModels(provider: string): Promise<ModelItem[]> {
    return AIModelManager.getAvailableModels(provider);
  }
}