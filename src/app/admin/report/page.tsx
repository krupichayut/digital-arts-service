"use client";

import { useEffect, useState } from "react";
import { dbService, MediaItem } from "@/lib/cdbs";
import { Button } from "@/components/ui/button";

function ReportItemCard({ item, index, teacherName, academicYear }: { item: MediaItem, index: number, teacherName: string, academicYear: string }) {
  const [localImage, setLocalImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setLocalImage(url);
    }
  };

  return (
    <div className="bg-white p-[20mm] shadow-lg print:shadow-none page-break min-h-[297mm] flex flex-col relative print:p-0">
      
      {/* Form Header */}
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold mb-2">แบบรายงานการผลิตสื่อและการใช้สื่อการเรียนการสอน</h1>
        <h2 className="text-lg">ปีการศึกษา {academicYear}</h2>
      </div>

      <div className="text-right mb-6">
        <p className="text-md font-semibold">สื่อการเรียนการสอน  ชิ้นที่   {index + 1}   {item.type === 'Video' ? 'สื่อดิจิทัล' : 'สื่อทำมือ'}</p>
      </div>

      {/* Form Body */}
      <div className="space-y-4 text-md flex-1">
        <div className="grid grid-cols-[150px_1fr] gap-2">
          <div className="font-semibold">ชื่อสื่อ</div>
          <div>{item.title}</div>
        </div>
        <div className="grid grid-cols-[150px_1fr] gap-2">
          <div className="font-semibold">กลุ่มสาระการเรียนรู้</div>
          <div>{item.category}</div>
        </div>
        <div className="grid grid-cols-[150px_1fr] gap-2">
          <div className="font-semibold">ระดับชั้น</div>
          <div>ชั้น{item.grade.replace('ป.', 'ประถมศึกษาปีที่ ')}</div>
        </div>

        {/* Image Placeholder (Clickable to upload) */}
        <div className="relative w-full h-[300px] border-2 border-dashed border-gray-300 print:border-solid print:border-gray-200 mt-6 mb-6 flex items-center justify-center bg-gray-50 overflow-hidden group">
          {localImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={localImage} alt="Uploaded Media" className="max-h-full max-w-full object-contain" />
          ) : item.type === 'Video' && item.youtubeId && item.youtubeId !== '-' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`} alt="Media Thumbnail" className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="text-center text-gray-400 group-hover:text-indigo-500 transition-colors">
              <svg className="w-8 h-8 mx-auto mb-2 no-print" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="italic">คลิกเพื่ออัปโหลดภาพประกอบ (จะไม่แสดงในหน้าพิมพ์ถ้าไม่เลือกรูป)</span>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer no-print" 
            title="อัปโหลดรูปภาพประกอบ" 
          />
        </div>

        {/* Evaluation Results (Editable) */}
        <div className="space-y-6 pt-4">
          <div className="group/field relative">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              ผลที่เกิดขึ้นกับผู้เรียน
              <span className="no-print text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded opacity-0 group-hover/field:opacity-100 transition-opacity">คลิกเพื่อพิมพ์ข้อความ</span>
            </h3>
            <p 
              contentEditable 
              suppressContentEditableWarning 
              className="pl-8 whitespace-pre-wrap leading-relaxed min-h-[60px] outline-none hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-200 transition-all rounded p-2 -ml-2"
            >
              {item.studentResults && item.studentResults !== '-' ? item.studentResults : "........................................................................................................................................................................................................................................................................................................................................"}
            </p>
          </div>
          
          <div className="group/field relative">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              ปัญหา/แนวทางแก้ไข
              <span className="no-print text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded opacity-0 group-hover/field:opacity-100 transition-opacity">คลิกเพื่อพิมพ์ข้อความ</span>
            </h3>
            <p 
              contentEditable 
              suppressContentEditableWarning 
              className="pl-8 whitespace-pre-wrap leading-relaxed min-h-[40px] outline-none hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-200 transition-all rounded p-2 -ml-2"
            >
              {item.problems && item.problems !== '-' ? item.problems : "-"}
            </p>
          </div>
          
          <div className="group/field relative">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              ข้อเสนอแนะอื่น
              <span className="no-print text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded opacity-0 group-hover/field:opacity-100 transition-opacity">คลิกเพื่อพิมพ์ข้อความ</span>
            </h3>
            <p 
              contentEditable 
              suppressContentEditableWarning 
              className="pl-8 whitespace-pre-wrap leading-relaxed min-h-[40px] outline-none hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-200 transition-all rounded p-2 -ml-2"
            >
              {item.suggestions && item.suggestions !== '-' ? item.suggestions : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Form Footer (Signature) */}
      <div className="mt-16 text-center self-end w-1/2">
        <p className="mb-2">ลงชื่อ ..........................................................</p>
        <p className="mb-2">({teacherName})</p>
        <p>ครูผู้สอนวิชาศิลปะ</p>
      </div>
      
    </div>
  );
}

export default function ReportPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("นายพิชญุตม์ ประภาศิริ");
  const [academicYear, setAcademicYear] = useState("2568");

  useEffect(() => {
    async function loadData() {
      const data = await dbService.getMedia();
      setMedia(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-black">กำลังโหลดข้อมูลรายงาน...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen text-black font-sans pb-12">
      
      {/* Settings Bar (Hidden in Print) */}
      <div className="no-print bg-white border-b shadow-sm sticky top-0 z-50 p-4 mb-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-bold mb-1">ปีการศึกษา</label>
              <input 
                type="text" 
                value={academicYear} 
                onChange={(e) => setAcademicYear(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm w-24 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-bold mb-1">ชื่อผู้รายงาน</label>
              <input 
                type="text" 
                value={teacherName} 
                onChange={(e) => setTeacherName(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm w-48 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              พิมพ์รายงาน
            </Button>
            <Button variant="outline" onClick={() => window.close()}>
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start gap-3">
          <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {/* eslint-disable react/no-unescaped-entities */}
          <p className="text-sm text-indigo-800">
            <strong>เคล็ดลับ:</strong> คุณครูสามารถคลิกที่ข้อความ "ผลที่เกิดขึ้นกับผู้เรียน", "ปัญหา", "ข้อเสนอแนะ" เพื่อพิมพ์แก้ไขข้อความได้โดยตรงก่อนกดปริ้นท์ และสามารถคลิกที่ช่องว่างรูปภาพเพื่ออัปโหลดรูปภาพจากคอมพิวเตอร์ใส่รายงานได้ทันทีครับ!
          </p>
          {/* eslint-enable react/no-unescaped-entities */}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; break-after: page; }
          @page { size: A4; margin: 20mm; }
        }
      `}</style>

      {/* Report Pages */}
      <div className="max-w-[210mm] mx-auto space-y-8 print:space-y-0">
        {media.map((item, index) => (
          <ReportItemCard key={item.id} item={item} index={index} teacherName={teacherName} academicYear={academicYear} />
        ))}
        
        {media.length === 0 && (
          <div className="bg-white p-[20mm] shadow-lg text-center text-gray-500">
            ไม่มีข้อมูลสื่อการสอนในระบบ
          </div>
        )}
      </div>
    </div>
  );
}
