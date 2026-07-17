"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Folder, 
  Activity, 
  CheckCircle, 
  Plus, 
  Search, 
  Settings, 
  Users, 
  PieChart, 
  MoreVertical,
  X,
  FolderOpen,
  Inbox,
  XCircle,
  AlertTriangle
} from "lucide-react";

// -- Kiểu dữ liệu --
type ProjectStatus = "all" | "planned" | "in_progress" | "completed";
type ToastType = "success" | "error" | "warning";

interface Project {
  id: string;
  code: string;
  name: string;
  status: Exclude<ProjectStatus, "all">;
  date: string;
}

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const INITIAL_PROJECTS: Project[] = [
  { id: "1", code: "PRJ-102", name: "Hệ thống AI phân tích quỹ đạo", status: "in_progress", date: "15/07/2026" },
  { id: "2", code: "PRJ-101", name: "Vệ tinh viễn thông LEO-1", status: "completed", date: "10/01/2025" },
  { id: "3", code: "PRJ-103", name: "Trạm mặt đất băng tần X", status: "planned", date: "01/09/2026" },
];

export default function ProjectsPage() {
  // -- State quản lý Dữ liệu & UI --
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // State quản lý form tạo mới
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    status: "planned" as Exclude<ProjectStatus, "all">,
    date: ""
  });

  // Giả lập trễ mạng 1.2 giây khi tải trang
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // -- Logic Toast Notification --
  const addToast = (type: ToastType, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      const newToasts = [...prev, { id, type, message }];
      return newToasts.slice(-3); // Đảm bảo tối đa 3 toast hiển thị cùng lúc
    });
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // -- Logic Bộ lọc dữ liệu --
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;
      const matchesSearch = 
        !searchQuery.trim() ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [projects, selectedStatus, searchQuery]);

  // -- Handlers --
  const handleOpenModal = () => {
    setFormData({ code: "", name: "", status: "planned", date: "" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCreateProject = () => {
    // Validation
    if (!formData.code.trim() || !formData.name.trim()) {
      addToast("error", "Vui lòng nhập đầy đủ mã và tên dự án.");
      return;
    }
    
    let formattedDate = formData.date;
    if (formattedDate) {
      const [year, month, day] = formattedDate.split("-");
      formattedDate = `${day}/${month}/${year}`;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      code: formData.code.trim(),
      name: formData.name.trim(),
      status: formData.status,
      date: formattedDate || "Chưa xác định"
    };

    setProjects([newProject, ...projects]);
    setIsModalOpen(false);
    
    // Reset bộ lọc để thấy kết quả
    if (searchQuery) setSearchQuery("");
    if (selectedStatus !== "all" && selectedStatus !== formData.status) setSelectedStatus("all");

    // Bắn Toast thành công
    addToast("success", "Tạo dự án thành công.");
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans relative overflow-hidden">
      
      {/* Container chứa Toast (Góc trên phải) */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10">
        <div className="h-14 border-b border-slate-200 flex items-center px-6">
          <div className="w-8 h-8 bg-sky-600 rounded-md flex items-center justify-center mr-3">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">VNSD Admin</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <NavItem icon={<PieChart />} label="Tổng quan" />
          <NavItem icon={<Folder />} label="Dự án" active />
          <NavItem icon={<Users />} label="Nhân sự" />
          <NavItem icon={<Settings />} label="Hệ thống" />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <h1 className="text-[30px] font-bold text-slate-900 leading-none">Dự án</h1>
          <button 
            onClick={handleOpenModal}
            className="h-10 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo dự án
          </button>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {isLoading ? (
              <>
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
              </>
            ) : (
              <>
                <KpiCard 
                  title="Tổng dự án" 
                  value={projects.length.toString()} 
                  icon={<Folder className="w-6 h-6 text-slate-600" />} 
                  bg="bg-slate-50"
                  textColor="text-slate-900"
                />
                <KpiCard 
                  title="Đang thực hiện" 
                  value={projects.filter(p => p.status === "in_progress").length.toString()} 
                  icon={<Activity className="w-6 h-6 text-sky-600" />} 
                  bg="bg-sky-50"
                  textColor="text-sky-700"
                />
                <KpiCard 
                  title="Hoàn thành" 
                  value={projects.filter(p => p.status === "completed").length.toString()} 
                  icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} 
                  bg="bg-emerald-50"
                  textColor="text-emerald-700"
                />
              </>
            )}
          </div>

          {/* Data Container (Filters + Table) */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col min-h-[360px]">
            {/* Toolbar */}
            <div className="p-5 border-b border-slate-200 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm dự án..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-11 pl-9 pr-4 border border-slate-200 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <FilterChip label="Tất cả" active={selectedStatus === "all"} onClick={() => setSelectedStatus("all")} disabled={isLoading} />
                <FilterChip label="Đang thực hiện" active={selectedStatus === "in_progress"} onClick={() => setSelectedStatus("in_progress")} disabled={isLoading} />
                <FilterChip label="Hoàn thành" active={selectedStatus === "completed"} onClick={() => setSelectedStatus("completed")} disabled={isLoading} />
                <FilterChip label="Lên kế hoạch" active={selectedStatus === "planned"} onClick={() => setSelectedStatus("planned")} disabled={isLoading} />
              </div>
            </div>

            {/* Display Area */}
            <div className="flex-1 flex flex-col">
              {isLoading ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-900 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="px-6 py-3 font-medium">Mã</th>
                        <th className="px-6 py-3 font-medium">Tên dự án</th>
                        <th className="px-6 py-3 font-medium">Trạng thái</th>
                        <th className="px-6 py-3 font-medium">Ngày bắt đầu</th>
                        <th className="px-6 py-3 font-medium w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <TableRowSkeleton widthCode="w-16" widthName="w-3/4" widthStatus="w-24" widthDate="w-20" />
                      <TableRowSkeleton widthCode="w-12" widthName="w-1/2" widthStatus="w-24" widthDate="w-24" />
                      <TableRowSkeleton widthCode="w-14" widthName="w-2/3" widthStatus="w-24" widthDate="w-20" />
                    </tbody>
                  </table>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
                  {projects.length === 0 ? (
                    <>
                      <FolderOpen className="w-10 h-10 text-slate-400 mb-4" />
                      <h3 className="text-base font-semibold text-slate-900 mb-1">Chưa có dự án</h3>
                      <p className="text-sm text-slate-500 mb-6">Nhấn "Tạo dự án" để bắt đầu thiết lập dự án đầu tiên của bạn.</p>
                      <button 
                        onClick={handleOpenModal}
                        className="h-10 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-medium transition-colors"
                      >
                        Tạo dự án
                      </button>
                    </>
                  ) : (
                    <>
                      <Inbox className="w-10 h-10 text-slate-400 mb-4" />
                      <h3 className="text-base font-semibold text-slate-900 mb-1">Không tìm thấy dự án</h3>
                      <p className="text-sm text-slate-500 mb-6">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                      <button 
                        onClick={handleResetFilters}
                        className="h-10 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md font-medium transition-colors"
                      >
                        Xóa bộ lọc
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-900 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="px-6 py-3 font-medium">Mã</th>
                        <th className="px-6 py-3 font-medium">Tên dự án</th>
                        <th className="px-6 py-3 font-medium">Trạng thái</th>
                        <th className="px-6 py-3 font-medium">Ngày bắt đầu</th>
                        <th className="px-6 py-3 font-medium w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProjects.map((project) => (
                        <TableRow key={project.id} {...project} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          ></div>
          
          <div 
            className="relative bg-white w-full max-w-[640px] rounded-xl shadow-xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Tạo dự án mới</h2>
              <button 
                onClick={handleCloseModal}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Mã dự án</label>
                  <input 
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full h-11 px-3 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Trạng thái</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Exclude<ProjectStatus, "all"> })}
                    className="w-full h-11 px-3 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white transition-shadow"
                  >
                    <option value="planned">Lên kế hoạch</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tên dự án</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-3 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ngày bắt đầu</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full h-11 px-3 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl bg-slate-50/50">
              <button 
                onClick={handleCloseModal}
                className="h-10 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md font-medium transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleCreateProject}
                className="h-10 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-medium transition-colors"
              >
                Tạo dự án
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Components Trợ giúp --

// 1. Toast Item Component (Chịu trách nhiệm quản lý thời gian hiển thị & Hiệu ứng)
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Kích hoạt hiệu ứng slide-in sau khi mount
    const enterTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-dismiss (Lỗi giữ 8s, Thành công giữ 4s)
    const duration = toast.type === "error" ? 8000 : 4000;
    const dismissTimer = setTimeout(() => handleClose(), duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast]);

  const handleClose = () => {
    setIsVisible(false); // Kích hoạt hiệu ứng fade-out
    setTimeout(() => onRemove(toast.id), 200); // Chờ animation kết thúc mới xóa khỏi mảng
  };

  const styleMap = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-rose-50 border-rose-200 text-rose-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  };

  const iconMap = {
    success: <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />,
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 p-3 min-w-[320px] max-w-sm rounded-lg border shadow-md transition-all duration-200 ease-out
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"} 
        ${styleMap[toast.type]}
      `}
    >
      <div className="flex items-center gap-2">
        {iconMap[toast.type]}
        <p className="text-sm font-medium leading-tight">{toast.message}</p>
      </div>
      <button 
        onClick={handleClose} 
        className="p-1 rounded-md hover:bg-black/5 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 opacity-70" />
      </button>
    </div>
  );
}

// 2. Các Components Khác (Giữ nguyên cấu trúc)
function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <a 
      href="#" 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? "bg-sky-50 text-sky-700 border-r-2 border-sky-600" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <div className="w-5 h-5">{icon}</div>
      {label}
    </a>
  );
}

function KpiCard({ title, value, icon, bg, textColor }: { title: string, value: string, icon: React.ReactNode, bg: string, textColor: string }) {
  return (
    <div className={`${bg} border border-slate-200 rounded-lg p-5 flex items-start justify-between shadow-sm h-32`}>
      <div className="flex flex-col justify-between h-full">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className={`text-3xl font-bold ${textColor} leading-tight`}>{value}</p>
      </div>
      <div className="mt-1">{icon}</div>
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start justify-between shadow-sm h-32">
      <div className="flex flex-col justify-between h-full w-full">
        <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-12 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="w-6 h-6 bg-slate-200 rounded-full animate-pulse" />
    </div>
  );
}

function FilterChip({ label, active, onClick, disabled }: { label: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-10 px-4 rounded-md text-sm font-medium border transition-colors focus:outline-none ${
        active
          ? "bg-sky-50 text-sky-700 border-sky-200 shadow-sm"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}

function TableRow({ code, name, status, date }: Project) {
  const getStatusBadge = () => {
    switch (status) {
      case "in_progress":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200">Đang thực hiện</span>;
      case "completed":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200">Hoàn thành</span>;
      case "planned":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">Lên kế hoạch</span>;
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-6 py-4">{code}</td>
      <td className="px-6 py-4 font-medium">{name}</td>
      <td className="px-6 py-4">{getStatusBadge()}</td>
      <td className="px-6 py-4 text-slate-600">{date}</td>
      <td className="px-6 py-4 text-right">
        <button 
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          title="Chi tiết"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function TableRowSkeleton({ widthCode, widthName, widthStatus, widthDate }: { widthCode: string, widthName: string, widthStatus: string, widthDate: string }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-6 py-4">
        <div className={`h-4 ${widthCode} bg-slate-200 rounded animate-pulse`} />
      </td>
      <td className="px-6 py-4">
        <div className={`h-4 ${widthName} bg-slate-200 rounded animate-pulse`} />
      </td>
      <td className="px-6 py-4">
        <div className={`h-4 ${widthStatus} bg-slate-200 rounded animate-pulse`} />
      </td>
      <td className="px-6 py-4">
        <div className={`h-4 ${widthDate} bg-slate-200 rounded animate-pulse`} />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="h-4 w-4 bg-slate-200 rounded animate-pulse ml-auto" />
      </td>
    </tr>
  );
}