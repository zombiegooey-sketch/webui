"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  User, 
  Send, 
  ShieldCheck, 
  FileText, 
  Trash2, 
  UploadCloud, 
  Plus, 
  ChevronDown, 
  Database,
  History,
  Info,
  Loader2
} from "lucide-react";

interface RAGFile {
  id: string;
  name: string;
  size: string;
  status: "completed" | "pending" | "rejected";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export default function AIWorkspace() {
  // 1. QUẢN LÝ PHIÊN CHAT (Giải quyết lỗi Lịch sử chat làm màu)
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: "session-1", title: "Phiên thảo luận mới 1", messages: [] }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>("session-1");
  
  // 2. STATE HOẠT ĐỘNG THỰC TẾ
  const [currentModel, setCurrentModel] = useState("gemma2:2b");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOllamaConnected, setIsOllamaConnected] = useState<boolean | null>(null);

  // 2.1 State quản lý chỉnh sửa tiêu đề phiên chat
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");

  // 2.2 Hàm xử lý đổi tên phiên chat
  const handleRenameSession = (sessionId: string, newTitle: string) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? { ...session, title: newTitle } : session
      )
    );
  };
  
  // 3. QUẢN LÝ FILE RAG (Thực tế)
  const [files, setFiles] = useState<RAGFile[]>([
    
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // 4. KIỂM TRA ĐƯỜNG TRUYỀN OLLAMA THỰC TẾ
  useEffect(() => {
  const checkConnection = async () => {
    try {
      const res = await fetch("/api/health").catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setIsOllamaConnected(data.connected);
      } else {
        setIsOllamaConnected(false);
      }
    } catch {
      setIsOllamaConnected(false);
    }
  };
  checkConnection();
  const interval = setInterval(checkConnection, 10000); // Check lại mỗi 10 giây
  return () => clearInterval(interval);
}, []);

  // 5. GỬI TIN NHẮN THỰC TẾ (Gọi API Route kết nối Ollama)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: userTime
    };
    

    // Cập nhật tin nhắn người dùng vào session hiện tại
    const updatedMessages = [...activeSession.messages, userMsg];
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: updatedMessages } : s));
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          model: currentModel
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const aiTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message.content,
        timestamp: aiTime
      };

      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...updatedMessages, aiMsg] } : s));
    } catch (err) {
      const errorTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
        ...s, 
        messages: [...updatedMessages, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Lỗi kết nối: Máy chủ không phản hồi hoặc Ollama local chưa được bật.",
          timestamp: errorTime
        }] 
      } : s));
    } finally {
      setIsLoading(false);
    }
  };

  // 6. XỬ LÝ TẠO PHIÊN MỚI
  const handleCreateNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `Phiên thảo luận mới #${sessions.length + 1}`,
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  // 7. XỬ LÝ TẢI FILE THẬT LÊN STATE
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const file = uploadedFiles[0];
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + " MB";

    const newRagFile: RAGFile = {
      id: Date.now().toString(),
      name: file.name,
      size: sizeInMB,
      status: "completed"
    };

    setFiles(prev => [...prev, newRagFile]);
  };

  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter(f => f.id !== id));
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans antialiased">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.docx,.txt"
      />
      
      {/* SIDEBAR TRÁI */}
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white rounded p-1.5">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">AI WORKSPACE</h1>
              <p className="text-[11px] text-slate-500">Môi trường AI Doanh nghiệp</p>
            </div>
          </div>
          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Local
          </span>
        </div>

        {/* Model Selector thực tế */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">MÔ HÌNH CHẠY CỤC BỘ</label>
          <div className="relative">
            <select 
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              className="w-full h-10 pl-3 pr-10 rounded-md border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 appearance-none transition-colors duration-150 cursor-pointer"
            >
              <option value="qwen2.5:7b">qwen2.5:7b (Hợp tiếng Việt)</option>
              <option value="llama3.2:3b-instruct-fp16">llama3.2:3b-instruct-fp16</option>
              <option value="deepseek-r1:8b">deepseek-r1:8b (Tư duy sâu)</option>
              <option value="gemma2:2b">gemma2:2b</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Lịch sử trò chuyện hoạt động thực tế */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              <span>LỊCH SỬ PHIÊN CHAT</span>
            </div>
            <button 
              onClick={handleCreateNewSession}
              className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors duration-150"
              title="Tạo phiên chat mới"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {sessions.map((session) => {
  const isActive = activeSessionId === session.id;
  const isEditing = editingSessionId === session.id;

  return (
    <div
      key={session.id}
      className={`w-full h-10 px-3 rounded-lg text-sm font-medium flex items-center justify-between group transition-all duration-200 border ${
        isActive
          ? "bg-sky-50 text-sky-700 border-sky-100"
          : "border-transparent hover:bg-slate-50 text-slate-700"
      }`}
    >
      {isEditing ? (
        // TRƯỜNG HỢP 1: ĐANG Ở CHẾ ĐỘ SỬA (HIỆN Ô NHẬP)
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => {
            if (editTitle.trim()) handleRenameSession(session.id, editTitle.trim());
            setEditingSessionId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editTitle.trim()) handleRenameSession(session.id, editTitle.trim());
              setEditingSessionId(null);
            } else if (e.key === 'Escape') {
              setEditingSessionId(null); // Nhấn Esc để hủy sửa
            }
          }}
          className="bg-white border border-sky-300 rounded px-2 py-0.5 text-slate-800 focus:outline-none w-full text-xs"
          autoFocus
        />
      ) : (
        // TRƯỜNG HỢP 2: HIỂN THỊ BÌNH THƯỜNG (CHỮ + NÚT SỬA)
        <>
          {/* Click vào chữ để đổi phiên chat hoạt động */}
          <span
            onClick={() => setActiveSessionId(session.id)}
            className="truncate flex-1 cursor-pointer select-none py-2 text-left"
          >
            {session.title || "New Chat"}
          </span>

          {/* Nút sửa (✏️) chỉ hiển thị khi bạn di chuột (hover) vào dòng này */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Chặn không cho kích hoạt click của thẻ span ở trên
              setEditingSessionId(session.id);
              setEditTitle(session.title);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-sky-600 transition-opacity ml-1"
            title="Đổi tên phiên"
          >
            ⋮
          </button>
        </>
      )}
    </div>
  );
})}
          </div>
        </div>

        {/* Thông tin kết nối Ollama cập nhật theo trạng thái thực */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Database className="h-3.5 w-3.5" /> Ollama API:
            </span>
            {isOllamaConnected === null ? (
              <span className="text-slate-400">Đang kiểm tra...</span>
            ) : isOllamaConnected ? (
              <span className="font-semibold text-emerald-600">CONNECTED (127.0.0.1)</span>
            ) : (
              <span className="font-semibold text-rose-600">DISCONNECTED</span>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full bg-slate-50">
        
        {/* HEADER CHÍNH */}
        <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Không gian làm việc cục bộ</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className={`h-2 w-2 rounded-full ${isOllamaConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              <span>Dữ liệu không rời khỏi mạng nội bộ</span>
            </div>
          </div>
        </header>

        {/* VÙNG CHỨA NỘI DUNG CHÍNH */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* KHU VỰC CHAT */}
          <section className="flex-1 flex flex-col border-r border-slate-200 h-full bg-white">
            
            {/* THÂN HỘI THOẠI */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeSession.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                    <Bot className="h-8 w-8 text-slate-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Hệ thống AI Cục bộ Sẵn sàng</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Gửi tin nhắn hoặc tài liệu để bắt đầu truy vấn offline an toàn.
                  </p>
                  <button 
                    onClick={() => {
                      setInputMessage("Hãy tóm tắt và đánh giá quy trình PMO hiện hành.");
                    }}
                    className="mt-4 h-10 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors duration-150 flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Bắt đầu truy vấn mẫu
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSession.messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex gap-4 p-5 rounded-lg border text-sm transition-all duration-150 ${
                        msg.role === "user" 
                          ? "bg-white border-slate-200" 
                          : "bg-sky-50/50 border-sky-100"
                      }`}
                    >
                      <div className="shrink-0">
                        {msg.role === "user" ? (
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                            <User className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs tracking-wide text-slate-500 uppercase">
                            {msg.role === "user" ? "Nhân viên quản lý" : "AI Doanh nghiệp"}
                          </span>
                          <span className="text-[11px] text-slate-400">{msg.timestamp}</span>
                        </div>
                        <p className="text-slate-950 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* THANH NHẬP LIỆU CHÍNH */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Gửi tin nhắn hoặc đặt câu hỏi bảo mật..."
                  className="flex-1 h-11 px-4 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors duration-150"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="h-11 px-5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-1.5 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Gửi
                </button>
              </form>
            </div>
          </section>

          {/* KHU VỰC QUẢN LÝ FILE RAG */}
          <section className="w-96 flex flex-col h-full bg-slate-50 p-6 overflow-y-auto space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="h-4 w-4 text-slate-600" />
                Cơ sở tri thức (RAG)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Các tệp tin được vector hóa để AI truy xuất ngữ cảnh cục bộ.
              </p>
            </div>

            {/* File Upload Zone kích hoạt hộp thoại chọn file thật */}
            <div 
              onClick={handleTriggerUpload}
              className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 rounded-lg p-5 text-center cursor-pointer transition-colors duration-150"
            >
              <UploadCloud className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-900">Tải tài liệu lên hệ thống</p>
              <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ PDF, DOCX tối đa 10MB</p>
            </div>

            {/* BẢNG FILE COMPACT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>DANH SÁCH TÀI LIỆU SẴN SÀNG</span>
                <span>({files.length} tệp)</span>
              </div>

              {files.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg p-4 text-center text-xs text-slate-400">
                  Chưa có tài liệu nguồn.
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 tracking-wider">
                        <th className="py-2 px-3">TÊN TỆP TIN</th>
                        <th className="py-2 px-3 text-right">SIZE</th>
                        <th className="py-2 px-3 text-center">TRẠNG THÁI</th>
                        <th className="py-2 px-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                      {files.map((file) => (
                        <tr key={file.id} className="hover:bg-slate-50 transition-colors duration-150">
                          <td className="py-2.5 px-3 max-w-[120px]">
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate font-medium text-slate-950" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500 font-mono">{file.size}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                              Sẵn sàng
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button 
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors duration-150"
                              title="Gỡ bỏ tài liệu"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Panel Chú thích Bảo mật */}
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 flex gap-2">
              <Info className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">An toàn dữ liệu tuyệt đối</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Các tài liệu tri thức này được nhúng trực tiếp vào Vector Database nội bộ máy chủ của bạn. Toàn bộ hội thoại được mã hóa.
                </p>
              </div>
            </div>

          </section>

        </div>
      </main>

    </div>
  );
}