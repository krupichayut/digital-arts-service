import Link from "next/link";
import { InteractiveNebulaShader } from "@/components/ui/liquid-shader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-black/90 text-white">
      <InteractiveNebulaShader className="opacity-60" />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent"
          >
            Digital Arts Hub
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-300 transition-colors hover:text-white"
            >
              คลังสื่อ
            </Link>
            <Link
              href="/academic"
              className="text-sm text-gray-300 transition-colors hover:text-white"
            >
              งานวิชาการ
            </Link>
            <Link
              href="/admin"
              className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm transition-all hover:bg-white/20"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="container relative z-10 mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
