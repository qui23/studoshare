import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByDocument, createComment } from '@/lib/localdb/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('document_id');
    if (!documentId) return NextResponse.json({ error: 'document_id is required' }, { status: 400 });

    const comments = getCommentsByDocument(documentId);
    return NextResponse.json({ data: comments });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_id, user_id, user_name, content, parent_id } = body;

    if (!document_id || !user_name || !content) {
      return NextResponse.json({ error: 'document_id, user_name, and content are required' }, { status: 400 });
    }

    const comment = createComment({ document_id, user_id, user_name, content, parent_id });
    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
