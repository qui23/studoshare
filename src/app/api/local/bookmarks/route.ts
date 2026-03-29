import { NextRequest, NextResponse } from 'next/server';
import { getBookmarksByUser, addBookmark, removeBookmark } from '@/lib/localdb/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

    const bookmarks = getBookmarksByUser(userId);
    return NextResponse.json({ data: bookmarks });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_id, user_id } = body;
    if (!document_id || !user_id) {
      return NextResponse.json({ error: 'document_id and user_id are required' }, { status: 400 });
    }
    const bookmark = addBookmark(document_id, user_id);
    return NextResponse.json({ data: bookmark }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_id, user_id } = body;
    if (!document_id || !user_id) {
      return NextResponse.json({ error: 'document_id and user_id are required' }, { status: 400 });
    }
    const removed = removeBookmark(document_id, user_id);
    if (!removed) return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
