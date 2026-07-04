"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  Eye,
  FileText,
  Search,
  Tags,
} from "lucide-react";
import {
  AcademicWork,
  academicWorkService,
} from "@/lib/cdbs/academic";

const workTypes = ["All", "วิจัยในชั้นเรียน", "บทความวิชาการ", "นวัตกรรม", "Best Practice"];

export default function AcademicPage() {
  const [works, setWorks] = useState<AcademicWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [workType, setWorkType] = useState("All");

  useEffect(() => {
    async function loadWorks() {
      const data = await academicWorkService.getWorks();
      setWorks(data);
      setLoading(false);
    }

    void loadWorks();
  }, []);

  const filteredWorks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return works.filter((item) => {
      const searchable = [
        item.title,
        item.author,
        item.workType,
        item.subjectArea,
        item.academicYear,
        item.abstract,
        item.keywords.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesType = workType === "All" || item.workType === workType;
      return matchesSearch && matchesType;
    });
  }, [search, workType, works]);

  const openWork = async (item: AcademicWork) => {
    await academicWorkService.incrementView(item.id);
    if (item.publicationUrl && item.publicationUrl !== "-") {
      window.open(item.publicationUrl, "_blank");
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไปคลังสื่อ
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                <BookOpenCheck className="h-4 w-4" />
                Academic Publication Library
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                เผยแพร่งานวิชาการ
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                รวมผลงานวิจัย บทความ นวัตกรรม และแนวปฏิบัติที่ดีสำหรับการจัดการเรียนรู้ศิลปะ ดนตรี และนาฏศิลป์
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">ผลงานทั้งหมด</p>
              <p className="mt-2 text-4xl font-black text-slate-950">
                {works.length.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                รายการที่เผยแพร่และพร้อมให้ครูเข้าถึง
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
            <Search className="mr-3 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาชื่อเรื่อง ผู้จัดทำ ปีการศึกษา หรือคำสำคัญ"
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={workType}
            onChange={(event) => setWorkType(event.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none"
          >
            {workTypes.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "ทุกประเภท" : type}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center text-slate-500">
            กำลังโหลดงานวิชาการ...
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="mt-8 flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
            <FileText className="mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-900">
              ยังไม่มีงานวิชาการในระบบ
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              เพิ่มรายการได้จากหน้า Admin เพื่อเผยแพร่ผลงานให้ครูและผู้สนใจเข้าถึง
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredWorks.map((item) => (
              <article
                key={item.id}
                className="flex min-h-[320px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-700">
                    <BookOpenCheck className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {item.status}
                  </span>
                </div>

                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                  {item.workType}
                </p>
                <h2 className="mt-2 line-clamp-2 text-xl font-black leading-tight text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  {item.author}
                </p>
                <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                  {item.abstract}
                </p>

                <div className="mt-5 grid gap-2 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    ปีการศึกษา {item.academicYear}
                  </span>
                  <span className="flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    {item.subjectArea}
                  </span>
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {item.viewCount.toLocaleString()} views
                  </span>
                </div>

                <button
                  onClick={() => openWork(item)}
                  className="mt-6 h-11 rounded-xl bg-slate-950 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!item.publicationUrl || item.publicationUrl === "-"}
                >
                  เปิดอ่านผลงาน
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
