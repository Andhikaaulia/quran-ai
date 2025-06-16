import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // As per user request, Together.ai will only have one predefined model
    const models = ["meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"];
    console.log("Returning Together.ai models from API:", models);
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching Together.ai models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Together.ai models' },
      { status: 500 }
    );
  }
} 