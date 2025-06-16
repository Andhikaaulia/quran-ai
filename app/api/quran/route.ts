import { NextResponse } from 'next/server';

const QURAN_API_BASE_URL = "https://api.alquran.cloud/v1";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // surah, juz, hizbQuarter, ruku
  const number = searchParams.get('number');
  const edition = searchParams.get('edition'); // Only expect a single edition now

  if (!type || !number || !edition) {
    return NextResponse.json(
      { error: 'Type, number, and edition are required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${QURAN_API_BASE_URL}/${type}/${number}/editions/${edition}`);
    const data = await response.json();

    console.log(`Raw response from alquran.cloud for ${type} ${number} ${edition}:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch data');
    }

    // alquran.cloud /surah/{number}/editions/{single_edition} returns an array of 1 item for surah, single object for others
    // We'll standardize it here to always return the content of the data field.
    const resultData = Array.isArray(data.data) ? data.data[0] : data.data;

    return NextResponse.json({ ...data, data: resultData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 