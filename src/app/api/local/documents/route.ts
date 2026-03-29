import { NextRequest, NextResponse } from 'next/server';
import { getAllDocuments, createDocument, getDocumentCount } from '@/lib/localdb/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject    = searchParams.get('subject')    ?? undefined;
    const university = searchParams.get('university') ?? undefined;
    const search     = searchParams.get('search')     ?? undefined;
    const limit      = searchParams.get('limit')  ? Number(searchParams.get('limit'))  : undefined;
    const offset     = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;

    const documents = getAllDocuments({ subject, university, search, limit, offset });
    const total     = getDocumentCount();

    return NextResponse.json({ data: documents, total });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, subject, course, university, file_name, file_size, file_type, tags, uploader_id, uploader_name } = body;

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const doc = createDocument({ title, description, subject, course, university, file_name, file_size, file_type, tags, uploader_id, uploader_name });
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
