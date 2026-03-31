import { NextResponse } from 'next/server';

const API_URL = 'https://web-production-bdf66.up.railway.app';

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/google-reviews`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch reviews: ${response.status}`, reviews: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Google Reviews proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reviews',
        message: String(error),
        reviews: []
      },
      { status: 500 }
    );
  }
}
