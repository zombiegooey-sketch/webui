import { NextResponse } from 'next/server';

export async function GET() {
  // 1. Tự động lấy link Ngrok từ Vercel, nếu chạy local thì dùng cổng mặc định của Ollama
  const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

  try {
    // 2. Gọi đến endpoint /api/tags (lấy danh sách model) để kiểm tra xem Ollama có sống không.
    // Endpoint này phản hồi nhanh hơn và không sợ bị lỗi 404 như khi gọi vào root '/' của Ollama.
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true', // Ép Ngrok bỏ qua trang cảnh báo để Vercel đọc trực tiếp
      },
      // Đặt timeout 4 giây để nếu đường truyền nghẽn thì ngắt kết nối ngay, tránh treo web
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      return NextResponse.json({ connected: true });
    }
    return NextResponse.json({ connected: false }, { status: 500 });
  } catch (err) {
    // Nếu không kết nối được (Ollama tắt, Ngrok sập hoặc sai link), trả về lỗi kết nối
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}