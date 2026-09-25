import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const valid = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    return NextResponse.json({ available: valid });
  } catch (error) {
    return NextResponse.json({ available: false }, { status: 400 });
  }
}
