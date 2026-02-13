import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}