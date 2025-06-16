import { NextRequest, NextResponse } from 'next/server';
// import { AIService } from '../../services/ai'; // No longer needed here

export async function POST(request: NextRequest) {
  try {
    const { prompt, provider, model } = await request.json();

    if (!prompt || !provider || !model) {
      return NextResponse.json({ error: 'Prompt, provider, and model are required' }, { status: 400 });
    }

    let generator: AsyncIterable<string>;

    switch (provider) {
      case 'groq':
        const { GroqProvider } = await import('../../services/providers/groq');
        const groqProvider = GroqProvider.getInstance();
        generator = groqProvider.generateResponse(prompt, model);
        break;
      case 'together':
        const { TogetherProvider } = await import('../../services/providers/together');
        const togetherProvider = TogetherProvider.getInstance();
        generator = togetherProvider.generateResponse(prompt, model);
        break;
      case 'openrouter':
        const { OpenRouterProvider } = await import('../../services/providers/openrouter');
        const openRouterProvider = OpenRouterProvider.getInstance();
        generator = openRouterProvider.generateResponse(prompt, model);
        break;
      default:
        return NextResponse.json({ error: 'Invalid AI provider' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async pull(controller) {
        for await (const chunk of generator) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
} 