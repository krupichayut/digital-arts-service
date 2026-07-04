"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  Edit2,
  Eye,
  FilePlus2,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AcademicWork,
  academicWorkService,
} from "@/lib/cdbs/academic";

const defaultForm = {
  title: "",
  author: "",
  workType: "วิจัยในชั้นเรียน",
  academicYear: "2568",
  subjectArea: "ศิลปะ",
  abstract: "",
  keywords: "",
  publicationUrl: "",
  coverUrl: "",
  status: "เผยแพร่",
};

export default function AdminAcademicPage() {
  const [works, setWorks] = useState<AcademicWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(defaultForm);

  const loadWorks = async () => {
    setLoading(true);
    const data = await academicWorkService.getWorks();
    setWorks(data);
    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(loadWorks);
  }, []);

  const filteredWorks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return works;

    return works.filter((item) =>
      [
        item.title,
        item.author,
        item.workType,
        item.academicYear,
        item.subjectArea,
        item.abstract,
        item.keywords.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search, works]);

  const resetForm = () => {
    setEditingId(null);
    setFormData(defaultForm);
  };

  const handleEdit = (item: AcademicWork) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      author: item.author,
      workType: item.workType,
      academicYear: item.academicYear,
      subjectArea: item.subjectArea,
      abstract: item.abstract,
      keywords: item.keywords.join(", "),
      publicationUrl: item.publicationUrl === "-" ? "" : item.publicationUrl,
      coverUrl: item.coverUrl === "-" ? "" : item.coverUrl,
      status: item.status,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบงานวิชาการรายการนี้ใช่หรือไม่?")) return;
    await academicWorkService.deleteWork(id);
    await loadWorks();
    if (editingId === id) resetForm();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      ...formData,
      publicationUrl: formData.publicationUrl || "-",
      coverUrl: formData.coverUrl || "-",
      keywords: formData.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    };

    if (editingId) {
      await academicWorkService.updateWork(editingId, payload);
    } else {
      await academicWorkService.addWork(payload);
    }

    resetForm();
    await loadWorks();
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            ผลงานวิชาการ
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            จัดการพื้นที่เผยแพร่งานวิจัย บทความ นวัตกรรม และ Best Practice
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-300">
          <BookOpenCheck className="h-4 w-4 text-indigo-300" />
          {works.length.toLocaleString()} รายการ
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-white/5 bg-[#0f0f11] p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white">
                {editingId ? "แก้ไขผลงานวิชาการ" : "เพิ่มผลงานวิชาการ"}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                ข้อมูลนี้จะแสดงในหน้าเผยแพร่งานวิชาการ
              </p>
            </div>
            <FilePlus2 className="h-5 w-5 text-zinc-500" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">ชื่อผลงาน</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(event) =>
                setFormData({ ...formData, title: event.target.value })
              }
              className="border-white/10 bg-[#0a0a0a] text-white"
              placeholder="ชื่อผลงานวิชาการ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">ชื่อผู้แต่ง/ผู้จัดทำ</Label>
            <Input
              id="author"
              required
              value={formData.author}
              onChange={(event) =>
                setFormData({ ...formData, author: event.target.value })
              }
              className="border-white/10 bg-[#0a0a0a] text-white"
              placeholder="ชื่อผู้แต่ง"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-zinc-300">
              ประเภทงานวิชาการ
              <select
                value={formData.workType}
                onChange={(event) =>
                  setFormData({ ...formData, workType: event.target.value })
                }
                className="h-10 w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 text-sm text-white outline-none"
              >
                <option>วิจัยในชั้นเรียน</option>
                <option>บทความวิชาการ</option>
                <option>นวัตกรรม</option>
                <option>Best Practice</option>
              </select>
            </label>

            <div className="space-y-2">
              <Label htmlFor="academicYear">ปีการศึกษา</Label>
              <Input
                id="academicYear"
                value={formData.academicYear}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    academicYear: event.target.value,
                  })
                }
                className="border-white/10 bg-[#0a0a0a] text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectArea">กลุ่มสาระการเรียนรู้</Label>
            <Input
              id="subjectArea"
              value={formData.subjectArea}
              onChange={(event) =>
                setFormData({ ...formData, subjectArea: event.target.value })
              }
              className="border-white/10 bg-[#0a0a0a] text-white"
              placeholder="เช่น ศิลปะ, ดนตรี, นาฏศิลป์"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="abstract">บทคัดย่อ</Label>
            <textarea
              id="abstract"
              required
              rows={5}
              value={formData.abstract}
              onChange={(event) =>
                setFormData({ ...formData, abstract: event.target.value })
              }
              className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="สรุปสาระสำคัญของผลงาน"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">คำสำคัญ (Keywords)</Label>
            <Input
              id="keywords"
              value={formData.keywords}
              onChange={(event) =>
                setFormData({ ...formData, keywords: event.target.value })
              }
              className="border-white/10 bg-[#0a0a0a] text-white"
              placeholder="คั่นด้วย comma เช่น สีไม้, ป.4, ทัศนศิลป์"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicationUrl">ลิงก์ผลงานวิชาการ (URL)</Label>
            <Input
              id="publicationUrl"
              value={formData.publicationUrl}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  publicationUrl: event.target.value,
                })
              }
              className="border-white/10 bg-[#0a0a0a] text-white"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="bg-white text-black hover:bg-zinc-200">
              {editingId ? "อัปเดต" : "บันทึกข้อมูล"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
                className="text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                ยกเลิก
              </Button>
            )}
          </div>
        </form>

        <div className="rounded-2xl border border-white/5 bg-[#0f0f11]">
          <div className="border-b border-white/5 p-5">
            <div className="flex h-11 items-center rounded-xl border border-white/10 bg-[#0a0a0a] px-3">
              <Search className="mr-3 h-4 w-4 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหาผลงานวิชาการ..."
                className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-10 text-center text-sm text-zinc-500">
                กำลังโหลดข้อมูล...
              </div>
            ) : filteredWorks.length === 0 ? (
              <div className="p-10 text-center text-sm text-zinc-500">
                ไม่พบผลงานวิชาการ
              </div>
            ) : (
              filteredWorks.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 p-5 transition hover:bg-white/[0.02] md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-[11px] font-bold text-indigo-300">
                        {item.workType}
                      </span>
                      <span className="text-xs font-medium text-zinc-500">
                        ปีการศึกษา {item.academicYear}
                      </span>
                    </div>
                    <h3 className="font-bold text-zinc-100">{item.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{item.author}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                      {item.abstract}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                      <Eye className="h-3.5 w-3.5" />
                      {item.viewCount.toLocaleString()} ครั้ง
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                      className="h-9 w-9 text-zinc-400 hover:bg-white/10 hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="h-9 w-9 text-red-400/70 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
