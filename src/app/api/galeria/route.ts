import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://web-production-bdf66.up.railway.app';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const area = searchParams.get('area');

  try {
    const endpoint = area 
      ? `${API_URL}/api/galeria/${area}`
      : `${API_URL}/api/galeria`;

    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch gallery: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Gallery proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery', message: String(error) },
      { status: 500 }
    );
  }
}
