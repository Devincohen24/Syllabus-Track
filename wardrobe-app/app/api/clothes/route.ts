import { NextRequest, NextResponse } from 'next/server';
import { readWardrobe, addClothingItem, removeClothingItem, updateClothingItem } from '@/lib/storage';
import { ClothingItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const data = await readWardrobe();
  return NextResponse.json({ items: data.items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item: ClothingItem = {
    id: uuidv4(),
    name: body.name,
    category: body.category,
    colors: body.colors || [],
    styles: body.styles || [],
    seasons: body.seasons || [],
    formality: body.formality || 'casual',
    tags: body.tags || [],
    imageData: body.imageData,
    addedAt: new Date().toISOString(),
    wornCount: 0,
    description: body.description,
  };
  const saved = await addClothingItem(item);
  return NextResponse.json({ item: saved }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const updated = await updateClothingItem(id, updates);
  if (!updated) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  return NextResponse.json({ item: updated });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const removed = await removeClothingItem(id);
  if (!removed) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
