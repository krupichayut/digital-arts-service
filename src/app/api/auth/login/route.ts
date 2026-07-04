import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    
    // In a real app, this should be set in .env.local
    // We use a fallback just in case it's not set
    const adminPassword = process.env.ADMIN_PASSWORD || "123456";

    if (password === adminPassword) {
      // Set HttpOnly cookie for security
      const cookieStore = await cookies();
      cookieStore.set("admin_token", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "รหัสผ่านไม่ถูกต้อง" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดของระบบ" },
      { status: 500 }
    );
  }
}
