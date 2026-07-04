"use client";

import { useEffect, useMemo, useState } from "react";
import { dbService, MediaItem } from "@/lib/cdbs";
import { Search, PlayCircle, Download, LayoutGrid, Command, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  { id: "All", label: "ทั้งหมด" },
  { id: "Video", label: "วิดีโอ" },
  { id: "Worksheet", label: "ใบงาน" },
  { id: "Slide", label: "สไลด์" },
  { id: "Plan", label: "แผนการสอน" }
];

export default function DashboardPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterGrade, setFilterGrade] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    async function loadData() {
      const data = await dbService.getMedia();
      setMedia(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const grades = useMemo(
    () => Array.from(new Set(media.map((item) => item.grade))).filter(Boolean),
    [media]
  );

  const filteredMedia = useMemo(() => {
    const query = search.trim().toLowerCase();

    return media
      .filter((item) => {
        const searchable = [
          item.title,
          item.description,
          item.category,
          item.subCategory,
          item.learningUnit,
          item.standardCode,
          item.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        const matchesSearch = !query || searchable.includes(query);
        const matchesType = filterType === "All" || item.type === filterType;
        const matchesGrade = filterGrade === "All" || item.grade === filterGrade;
        return matchesSearch && matchesType && matchesGrade;
      })
      .sort((a, b) => {
        if (sortBy === "views") return b.viewCount - a.viewCount;
        if (sortBy === "downloads") return b.downloadCount - a.downloadCount;
        if (sortBy === "title") return a.title.localeCompare(b.title);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [filterGrade, filterType, media, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      
      {/* 1. Command Palette Style Header & Search */}
      <div className="flex flex-col items-center pt-8 md:pt-16 pb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight mb-8 text-center"
        >
          ค้นหาสื่อการสอน
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-2xl relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl transition-opacity opacity-50 group-hover:opacity-100"></div>
          <div className="relative flex items-center bg-zinc-900/80 border border-white/10 hover:border-white/20 rounded-2xl p-2 shadow-2xl backdrop-blur-xl transition-colors">
            <Search className="w-6 h-6 text-zinc-400 ml-3 mr-2" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อสื่อ, หมวดหมู่, หรือเนื้อหา..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-0 py-3"
            />
            <div className="hidden sm:flex items-center gap-1 bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-md mr-2 font-mono font-medium border border-white/5">
              <Command className="w-3 h-3" /> <span>K</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-4 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Grade
            <select
              value={filterGrade}
              onChange={(event) => setFilterGrade(event.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-zinc-900/80 px-3 text-sm font-medium normal-case tracking-normal text-zinc-200 outline-none transition-colors hover:border-white/20 focus:border-indigo-400"
            >
              <option value="All">All grades</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Sort
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-zinc-900/80 px-3 text-sm font-medium normal-case tracking-normal text-zinc-200 outline-none transition-colors hover:border-white/20 focus:border-indigo-400"
            >
              <option value="newest">Newest first</option>
              <option value="views">Most viewed</option>
              <option value="downloads">Most downloaded</option>
              <option value="title">Title A-Z</option>
            </select>
          </label>
        </motion.div>

        {/* 2. Segmented Controls (Filters) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          <div className="flex items-center bg-zinc-900/50 backdrop-blur-md p-1.5 rounded-xl border border-white/5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterType(cat.id)}
                className={`relative px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  filterType === cat.id 
                    ? "text-white shadow-sm" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                {filterType === cat.id && (
                  <motion.div
                    layoutId="activeFilterBg"
                    className="absolute inset-0 bg-zinc-800 border border-white/10 rounded-lg shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {!loading && (
          <div className="mt-4 text-xs font-medium text-zinc-500">
            Showing {filteredMedia.length.toLocaleString()} of {media.length.toLocaleString()} resources
          </div>
        )}
      </div>

      {/* 3. Media Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-10 h-10 border-4 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm font-medium animate-pulse">กำลังจัดเตรียมสื่อการสอน...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredMedia.map((item, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={item.id} 
                className="group relative flex flex-col bg-zinc-900/40 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden hover:bg-zinc-900/60 transition-all duration-300 backdrop-blur-sm"
              >
                {/* Premium Image Container */}
                <div className="relative aspect-[16/10] bg-zinc-950 overflow-hidden">
                  {item.type === 'Video' && item.youtubeId !== '-' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 transform group-hover:scale-105 transition-transform duration-700 ease-out">
                      <LayoutGrid className="w-12 h-12 text-zinc-700" />
                    </div>
                  )}
                  
                  {/* Floating Grade Pill */}
                  <div className="absolute top-3 right-3 flex gap-1">
                    <div className="bg-zinc-950/80 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full text-zinc-300 border border-white/10 shadow-xl">
                      {item.grade}
                    </div>
                  </div>
                  
                  {/* Floating Action Button (Shows on Hover) */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button 
                      onClick={() => {
                        dbService.incrementView(item.id);
                        window.open(item.fileUrl !== '-' ? item.fileUrl : `https://youtube.com/watch?v=${item.youtubeId}`, "_blank");
                      }}
                      className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-black rounded-full p-3 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 flex items-center gap-2 font-semibold"
                    >
                      {item.type === 'Video' ? (
                        <><PlayCircle className="w-5 h-5" /> เล่นวิดีโอ</>
                      ) : (
                        <><Download className="w-5 h-5" /> ดาวน์โหลด</>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Premium Info Container */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {item.type}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium truncate">{item.category} <span className="mx-1 text-zinc-700">•</span> {item.subCategory}</span>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 text-zinc-100 group-hover:text-white transition-colors leading-tight line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400 line-clamp-2 flex-1 mb-5 font-light leading-relaxed">{item.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 mt-auto">
                    <div className="flex gap-4 text-xs font-medium text-zinc-500">
                      <span className="flex items-center gap-1.5" title="Views"><Eye className="w-3.5 h-3.5" /> {item.viewCount}</span>
                      <span className="flex items-center gap-1.5" title="Downloads"><Download className="w-3.5 h-3.5" /> {item.downloadCount}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredMedia.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-white/5 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ไม่พบผลลัพธ์</h3>
              <p className="text-zinc-400">ลองค้นหาด้วยคำค้นอื่น หรือเปลี่ยนหมวดหมู่</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
