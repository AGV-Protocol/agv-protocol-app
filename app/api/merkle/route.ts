import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const contract = searchParams.get('contract');
  if (!address || !contract) {
    return NextResponse.json({ error: 'Missing address or contract' }, { status: 400 });
  }
  // Placeholder: Replace with actual Merkle proof API
  const response = await fetch(`https://merkle-api-placeholder.com/proof?address=${address}&contract=${contract}`);
  const data = await response.json();
  return NextResponse.json(data);
}