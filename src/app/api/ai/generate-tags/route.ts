import { NextRequest, NextResponse } from 'next/server';
import { getChatCompletion } from '@/lib/ai/chatCompletion';

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType, title, subject, docType } = await req.json();

    const contextParts: string[] = [];
    if (fileName) contextParts.push(`File name: ${fileName}`);
    if (title) contextParts.push(`Document title: ${title}`);
    if (subject) contextParts.push(`Subject: ${subject}`);
    if (docType) contextParts.push(`Document type: ${docType}`);
    if (fileType) contextParts.push(`File type: ${fileType}`);

    const contextString = contextParts.join('\n');

    const response = await getChatCompletion(
      'OPEN_AI',
      'gpt-4o-mini',
      [
        {
          role: 'system',
          content:
            'You are a helpful academic document tagging assistant. Generate relevant, concise tags for study materials. Return ONLY a JSON array of tag strings (no explanation, no markdown). Tags should be lowercase, hyphen-separated if multi-word, and highly relevant for academic search. Generate 6-10 tags.',
        },
        {
          role: 'user',
          content: `Generate tags for this academic document:\n${contextString}\n\nReturn only a JSON array like: ["tag1", "tag2", "tag3"]`,
        },
      ],
      {
        max_completion_tokens: 200,
        temperature: 1,
      }
    );

    const content = response?.choices?.[0]?.message?.content?.trim() || '[]';

    // Parse the JSON array from the response
    let tags: string[] = [];
    try {
      // Extract JSON array even if there's surrounding text
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        tags = JSON.parse(match[0]);
      }
    } catch {
      tags = [];
    }

    // Sanitize tags: lowercase, max 30 chars each, max 10 tags
    tags = tags
      .filter((t) => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.toLowerCase().trim().replace(/\s+/g, '-').slice(0, 30))
      .slice(0, 10);

    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error('Tag generation error:', error);
    return NextResponse.json({ tags: [], error: error?.message || 'Failed to generate tags' }, { status: 500 });
  }
}
