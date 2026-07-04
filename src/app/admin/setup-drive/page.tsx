"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Key, Copy, CheckCircle2, ArrowRight, Save, ShieldAlert, Check } from "lucide-react";
import { motion } from "framer-motion";

function SetupDriveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [copied, setCopied] = useState(false);

  // Load from local storage if available
  useEffect(() => {
    const savedId = localStorage.getItem("google_client_id");
    const savedSecret = localStorage.getItem("google_client_secret");
    if (savedId) setClientId(savedId);
    if (savedSecret) setClientSecret(savedSecret);
  }, []);

  // Handle the OAuth callback
  useEffect(() => {
    if (code && clientId && clientSecret) {
      handleExchangeCode(code);
    }
  }, [code, clientId, clientSecret]);

  const handleGetUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !clientSecret) {
      setError("กรุณากรอก Client ID และ Client Secret");
      return;
    }

    setLoading(true);
    setError("");

    // Save to local storage for the redirect back
    localStorage.setItem("google_client_id", clientId);
    localStorage.setItem("google_client_secret", clientSecret);

    try {
      const redirectUri = window.location.origin + "/admin/setup-drive";
      
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_url",
          clientId,
          clientSecret,
          redirectUri,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("ไม่สามารถสร้าง URL สำหรับล็อกอินได้");
        setLoading(false);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setLoading(false);
    }
  };

  const handleExchangeCode = async (authCode: string) => {
    setLoading(true);
    setError("");
    
    try {
      const redirectUri = window.location.origin + "/admin/setup-drive";
      
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_token",
          clientId,
          clientSecret,
          redirectUri,
          code: authCode,
        }),
      });

      const data = await res.json();

      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
        // Clear url params without reloading
        router.replace("/admin/setup-drive");
      } else {
        setError(data.error || "ไม่สามารถแลกเปลี่ยนโค้ดเป็น Token ได้ (โค้ดอาจหมดอายุ ให้ลองใหม่)");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการรับ Token");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(refreshToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-20">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ตั้งค่า Google Drive (OAuth 2.0)</h1>
            <p className="text-zinc-400 text-sm">ระบบเชื่อมต่อ Google Drive ส่วนตัวเพื่อใช้พื้นที่ 15GB</p>
          </div>
        </div>

        {refreshToken ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 p-8 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-green-400">สำเร็จ! ได้รับ Refresh Token แล้ว</h3>
                  <p className="text-zinc-300 mt-2">กรุณาคัดลอกรหัสข้อความด้านล่างนี้ ไปใส่ใน Vercel Environment Variables</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">ชื่อตัวแปรใน Vercel (Key):</label>
                  <div className="bg-[#141417] p-3 rounded-xl border border-white/10 font-mono text-indigo-400">
                    GOOGLE_REFRESH_TOKEN
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">ค่าของตัวแปร (Value):</label>
                  <div className="relative">
                    <textarea 
                      readOnly 
                      value={refreshToken}
                      className="w-full h-32 bg-[#141417] p-4 rounded-xl border border-white/10 font-mono text-sm text-green-300 resize-none outline-none"
                    />
                    <button 
                      onClick={copyToClipboard}
                      className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors backdrop-blur-md"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? "ก๊อปปี้แล้ว" : "คัดลอกรหัส"}
                    </button>
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mt-6 flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-200/90">
                    <strong>อย่าลืม:</strong> เมื่อนำรหัสไปใส่ใน Vercel แล้ว ให้ตั้งค่าตัวแปร `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET` ใน Vercel ให้ตรงกับที่กรอกในหน้านี้ด้วยนะครับ จากนั้นให้กด <strong>Redeploy</strong> ทันที
                  </div>
                </div>

                <button 
                  onClick={() => setRefreshToken("")}
                  className="text-zinc-400 hover:text-white text-sm underline mt-4"
                >
                  เริ่มทำใหม่
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-[#141417] border border-white/10 rounded-2xl p-6 md:p-8">
            <form onSubmit={handleGetUrl} className="space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Google Client ID</label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="ลงท้ายด้วย .apps.googleusercontent.com"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Google Client Secret</label>
                  <input
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="GOCSPX-..."
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !clientId || !clientSecret}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  "กำลังดำเนินการ..."
                ) : (
                  <>
                    เชื่อมต่อกับบัญชี Google 
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-8 pt-8 border-t border-white/10">
              <h3 className="text-sm font-semibold text-white mb-4">ข้อมูลสำหรับตั้งค่าใน Google Cloud:</h3>
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-sm text-blue-200 mb-2">ตอนสร้าง OAuth Client ID ให้เลือกประเภทเป็น <strong>Web application</strong> และนำลิงก์ด้านล่างนี้ไปใส่ในช่อง <strong>Authorized redirect URIs</strong></p>
                <code className="text-xs bg-[#0a0a0a] px-3 py-2 rounded-lg text-blue-300 block overflow-x-auto">
                  {typeof window !== 'undefined' ? window.location.origin + "/admin/setup-drive" : "https://digital-arts-service.vercel.app/admin/setup-drive"}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SetupDrivePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>}>
      <SetupDriveContent />
    </Suspense>
  );
}
