import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    // Groq's API returns models in data.data array, so we map it to just return the IDs
    const models = data.data.map((model: { id: string }) => model.id);
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error in /api/groq-models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Groq models' },
      { status: 500 }
    );
  }
} 