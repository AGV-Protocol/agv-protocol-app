import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  const { wallet, username, email } = await request.json();
  if (!wallet || !username || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  await setDoc(doc(db, 'kols', wallet), { wallet, username, email, hawkinsScore: 0 });
  return NextResponse.json({ message: 'Registered' });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'Wallet required' }, { status: 400 });
  }
  const docRef = doc(db, 'kols', wallet);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  return NextResponse.json(docSnap.data());
}