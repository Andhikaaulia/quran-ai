import { NextResponse } from 'next/server';

interface OpenRouterModelData {
  id: string;
  name: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export async function GET() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const filteredModels = data.data.filter((model: OpenRouterModelData) => {
      const isFreePricing = model.pricing && model.pricing.prompt === "0" && model.pricing.completion === "0";
      const hasFreeInName = model.name.toLowerCase().includes('free') || model.id.toLowerCase().includes('free');
      return isFreePricing || hasFreeInName;
    }).map((model: OpenRouterModelData) => model.id);

    return NextResponse.json({ models: filteredModels });
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OpenRouter models' },
      { status: 500 }
    );
  }
} 