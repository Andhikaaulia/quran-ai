import { NextResponse } from 'next/server';
import { GroqProvider } from '@/services/providers/groq';

export async function POST(request: Request) {
  try {
    const { model, messages } = await request.json();

    if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Model and messages array are required' }, { status: 400 });
    }

    // For simplicity, assuming the last message is the user's content
    const userMessageContent = messages[messages.length - 1]?.content;

    if (!userMessageContent) {
        return NextResponse.json({ error: 'User message content is required' }, { status: 400 });
    }

    const groqProvider = GroqProvider.getInstance();
    const response = await groqProvider.generateResponse(userMessageContent, model);
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in /api/groq-chat:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Groq Chat API' },
      { status: 500 }
    );
  }
} 