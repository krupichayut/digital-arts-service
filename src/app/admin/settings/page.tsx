"use client";

import { useEffect, useState, useRef } from "react";
import { settingsService, PlatformSettings, PlatformSettingsInput } from "@/lib/cdbs/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Loader2, Image as ImageIcon, Save, CheckCircle2 } from "lucide-react";

export default function SettingsAdminPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  
  const [formData, setFormData] = useState<PlatformSettingsInput>({
    schoolName: "",
    academicYear: "",
    logoUrl: "",
    themeColor: "#4f46e5"
  });

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
      setFormData({
        schoolName: data.schoolName,
        academicYear: data.academicYear,
        logoUrl: data.logoUrl,
        themeColor: data.themeColor
      });
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.schoolName) {
      alert("กรุณาระบุชื่อโรงเรียน/องค์กร");
      return;
    }

    setIsSaving(true);
    setSuccessMsg(false);
    try {
      let finalUrl = formData.logoUrl;

      if (fileToUpload) {
        const uploadData = new FormData();
        uploadData.append("file", fileToUpload);

        const uploadRes = await fetch("/api/upload-drive", {
          method: "POST",
          body: uploadData,
        });

        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok || !uploadResult.success) {
          throw new Error(uploadResult.error || "อัปโหลดไฟล์ล้มเหลว");
        }
        
        finalUrl = uploadResult.fileUrl;
      }

      const dataToSave = { ...formData, logoUrl: finalUrl };
      
      const newSettings = await settingsService.updateSettings(dataToSave);
      setSettings(newSettings);
      setFormData({
          schoolName: newSettings.schoolName,
          academicYear: newSettings.academicYear,
          logoUrl: newSettings.logoUrl,
          themeColor: newSettings.themeColor
      });
      setFileToUpload(null);
      setSuccessMsg(true);
      
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึกการตั้งค่า");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <Settings className="w-6 h-6 mr-3 text-indigo-400" />
            ตั้งค่าแพลตฟอร์ม
          </h1>
          <p className="text-zinc-400 text-sm mt-1">กำหนดค่าเริ่มต้น ชื่อโรงเรียน โลโก้ และโทนสีของเว็บไซต์</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* General Settings */}
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white border-b border-white/5 pb-2">ข้อมูลทั่วไป</h2>
                
                <div className="space-y-2">
                    <Label>ชื่อโรงเรียน / องค์กร</Label>
                    <Input 
                        value={formData.schoolName} 
                        onChange={e => setFormData({...formData, schoolName: e.target.value})} 
                        className="bg-zinc-950 border-white/10 max-w-md" 
                    />
                    <p className="text-xs text-zinc-500">ชื่อนี้จะไปปรากฏบนแถบหัวเว็บและในเอกสารรายงาน</p>
                </div>
                
                <div className="space-y-2">
                    <Label>ปีการศึกษาปัจจุบัน</Label>
                    <Input 
                        value={formData.academicYear} 
                        onChange={e => setFormData({...formData, academicYear: e.target.value})} 
                        className="bg-zinc-950 border-white/10 max-w-md" 
                    />
                </div>
            </div>

            {/* Branding Settings */}
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white border-b border-white/5 pb-2 mt-8">การปรับแต่ง (Branding)</h2>
                
                <div className="space-y-2">
                  <Label>ตราสัญลักษณ์โรงเรียน (Logo)</Label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-2">
                    <div className="w-20 h-20 bg-zinc-950 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {fileToUpload ? (
                            <img src={URL.createObjectURL(fileToUpload)} className="w-full h-full object-contain p-1" />
                        ) : formData.logoUrl && formData.logoUrl !== "-" ? (
                            <img src={formData.logoUrl} className="w-full h-full object-contain p-1" />
                        ) : (
                            <ImageIcon className="w-8 h-8 text-zinc-700" />
                        )}
                    </div>
                    <div className="space-y-2 flex-1 w-full max-w-md">
                        <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                            setFileToUpload(e.target.files[0]);
                            }
                        }}
                        />
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="border-white/10 hover:bg-white/5 w-full sm:w-auto"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {fileToUpload || formData.logoUrl ? "เปลี่ยนโลโก้" : "อัปโหลดโลโก้"}
                        </Button>
                        <p className="text-xs text-zinc-500">แนะนำขนาด: 200x200px ไฟล์โปร่งใส (PNG)</p>
                        
                        <div className="pt-2">
                            <Label className="text-xs text-zinc-500 mb-1 block">หรือใส่ลิงก์รูปภาพ (URL):</Label>
                            <Input 
                                value={formData.logoUrl} 
                                onChange={e => setFormData({...formData, logoUrl: e.target.value})} 
                                className="bg-zinc-950 border-white/10 text-sm h-9"
                                placeholder="https://..."
                                disabled={!!fileToUpload}
                            />
                        </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 max-w-md">
                    <Label>โทนสีหลักของเว็บไซต์ (Theme Color)</Label>
                    <div className="flex gap-3 items-center">
                        <input 
                            type="color" 
                            value={formData.themeColor} 
                            onChange={e => setFormData({...formData, themeColor: e.target.value})} 
                            className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer p-0"
                        />
                        <Input 
                            value={formData.themeColor} 
                            onChange={e => setFormData({...formData, themeColor: e.target.value})} 
                            className="bg-zinc-950 border-white/10 font-mono"
                        />
                    </div>
                    <p className="text-xs text-zinc-500">เลือกสีหลักที่เข้ากับสีประจำโรงเรียน</p>
                </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center gap-4">
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    บันทึกการตั้งค่า
                </Button>
                
                {successMsg && (
                    <span className="flex items-center text-emerald-400 text-sm font-medium animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        บันทึกการตั้งค่าสำเร็จแล้ว
                    </span>
                )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
