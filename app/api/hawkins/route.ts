import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }
  // Placeholder: Replace with actual Hawkins score API
  const response = await fetch(`https://hawkins-api-placeholder.com/score?address=${address}`);
  const data = await response.json();
  return NextResponse.json({ score: data.score || 0 });
}