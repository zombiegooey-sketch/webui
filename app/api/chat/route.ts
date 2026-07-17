import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { model, messages } = await req.json();

    // 1. Tự động lấy link Ngrok từ Vercel Env, nếu không có (chạy local) thì tự fallback về localhost
    const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

    // 2. Gọi API đến Ollama (qua Ngrok hoặc Local tùy môi trường)
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Dòng chí mạng để Ngrok không chặn request của Vercel
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