import Link from "next/link";
import { BookOpenCheck, LayoutDashboard, Library, Settings, Users, ArrowLeft, Search, Bell } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500/30 print:bg-white print:text-black">
      
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col z-20 print:hidden">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <Library className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide">ระบบจัดการหลังบ้าน</span>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <Link href="/admin" className="flex items-center px-3 py-2.5 rounded-lg bg-white/5 text-white font-medium text-sm border border-white/5 shadow-sm">
            <LayoutDashboard className="w-4 h-4 mr-3 text-indigo-400" />
            คลังสื่อการเรียนการสอน
          </Link>
          <Link href="/admin/academic" className="flex items-center px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors">
            <BookOpenCheck className="w-4 h-4 mr-3" />
            ผลงานวิชาการ
          </Link>
          <Link href="/admin/teachers" className="flex items-center px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors">
            <Users className="w-4 h-4 mr-3" />
            ข้อมูลบุคลากร
          </Link>
          <Link href="/admin/settings" className="flex items-center px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors">
            <Settings className="w-4 h-4 mr-3" />
            ตั้งค่าแพลตฟอร์ม
          </Link>
        </nav>
        
        {/* Bottom Area */}
        <div className="p-4 border-t border-white/5">
          <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            กลับสู่หน้าเว็บไซต์หลัก
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pl-64 flex flex-col min-h-screen print:pl-0">
        
        {/* Top Header */}
        <header className="h-16 sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between print:hidden">
          <div className="flex items-center text-sm text-zinc-400 font-medium">
            <span>แอดมิน</span>
            <span className="mx-2 text-zinc-600">/</span>
            <span className="text-white">แผงควบคุม</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 border-2 border-[#0a0a0a] ring-2 ring-white/10 ml-2"></div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 print:p-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
      
    </div>
  );
}
