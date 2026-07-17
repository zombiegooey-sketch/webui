import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { model, messages } = await req.json();

    // Chuyển tiếp request từ Frontend sang cổng chạy Ollama cục bộ
    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: false, // Tắt stream để nhận cả cụm text cho đơn giản trước
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Không thể kết nối tới Ollama' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}