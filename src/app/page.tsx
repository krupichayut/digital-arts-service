"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import { dbService, MediaItem } from "@/lib/cdbs";
import { PlayCircle, Download, Sparkles, ArrowRight, Music, Image as ImageIcon, Video, FileText } from "lucide-react";

const parallaxImages = [
  { src: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?q=80&w=2000&auto=format&fit=crop" }, // Abstract colorful
  { src: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1000&auto=format&fit=crop" }, // Music
  { src: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1000&auto=format&fit=crop" }, // Dance
  { src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop" }, // Art supplies
  { src: "https://images.unsplash.com/photo-1516280440504-45ea07e5b95a?q=80&w=1000&auto=format&fit=crop" }, // Piano
  { src: "https://images.unsplash.com/photo-1537824598505-99ee03483384?q=80&w=1000&auto=format&fit=crop" }, // Minimalist art
  { src: "https://images.unsplash.com/photo-1520013817300-1f4c1cb245ef?q=80&w=1000&auto=format&fit=crop" }, // Paint
];

const bentoClasses = [
  "col-span-1 md:col-span-2 md:row-span-2 bg-slate-900 text-white rounded-[2rem]", // Hero Item
  "col-span-1 md:col-span-1 md:row-span-1 bg-white border border-slate-100 rounded-[2rem]",
  "col-span-1 md:col-span-1 md:row-span-1 bg-indigo-50 border border-indigo-100 rounded-[2rem]",
  "col-span-1 md:col-span-2 md:row-span-1 bg-white border border-slate-100 rounded-[2rem]",
  "col-span-1 md:col-span-1 md:row-span-1 bg-purple-50 border border-purple-100 rounded-[2rem]",
  "col-span-1 md:col-span-1 md:row-span-1 bg-white border border-slate-100 rounded-[2rem]",
];

export default function Home() {
  const [randomMedia, setRandomMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  useEffect(() => {
    async function fetchRandomMedia() {
      try {
        const allMedia = await dbService.getMedia();
        const shuffled = [...allMedia].sort(() => 0.5 - Math.random());
        setRandomMedia(shuffled.slice(0, 6));
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRandomMedia();
  }, []);

  return (
    <main className="relative min-h-screen bg-slate-50 overflow-x-hidden selection:bg-indigo-200 selection:text-indigo-900 text-slate-900 font-sans">
      
      {/* 1. Immersive Parallax Header */}
      <section ref={heroRef} className="relative bg-black h-[300vh]">
        <ZoomParallax images={parallaxImages} />
        
        {/* Sticky Overlay for Title */}
        <motion.div 
          style={{ opacity, scale }}
          className="fixed inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
          
          <div className="relative z-20 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white mb-8 backdrop-blur-xl"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-medium tracking-wide">ศูนย์กลางการเรียนรู้ศิลปะดิจิทัล</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tight leading-[1.1]"
            >
              ศิลปะ ดนตรี นาฏศิลป์ <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                รวมไว้ในที่เดียว
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto mb-12 font-light"
            >
              แพลตฟอร์มคลังสื่อการสอนที่ออกแบบมาเพื่อคุณครูและนักเรียนโดยเฉพาะ ค้นหาง่าย สวยงาม และใช้งานได้จริง
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="pointer-events-auto flex flex-col sm:flex-row items-center gap-4"
            >
              <Link 
                href="/dashboard"
                className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-100 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                เข้าสู่คลังสื่อ
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
 
      {/* 2. Clean & Minimalist + 3. Bento Grid Section */}
      <section className="relative z-20 bg-slate-50 rounded-t-[3rem] -mt-10 pt-24 pb-32 px-6 lg:px-12 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                สื่อแนะนำ <span className="text-indigo-600">สัปดาห์นี้</span>
              </h2>
              <p className="text-lg text-slate-500 max-w-xl">
                คัดสรรสื่อการสอนคุณภาพสูงหลากหลายรูปแบบ ทั้งวิดีโอ สไลด์ และแผนการสอน เพื่อให้การเรียนการสอนของคุณน่าสนใจยิ่งขึ้น
              </p>
            </div>
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
            >
              ดูทั้งหมด <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
 
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[300px] gap-6">
              {randomMedia.map((item, index) => {
                const isHero = index === 0;
                const bentoClass = bentoClasses[index % bentoClasses.length];
                
                return (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`group relative overflow-hidden flex flex-col p-8 transition-shadow hover:shadow-2xl ${bentoClass}`}
                  >
                    {/* Background Graphic elements for some bento boxes */}
                    {isHero && !item.coverUrl && (
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    )}

                    {/* Background Image if available */}
                    {((item.coverUrl && item.coverUrl !== '-') || (item.type === 'Video' && item.youtubeId !== '-')) && (
                      <>
                        <div 
                          className="absolute inset-0 z-0 opacity-10 group-hover:opacity-30 transition-opacity duration-500 mix-blend-overlay"
                          style={{
                            backgroundImage: `url(${item.coverUrl && item.coverUrl !== '-' ? item.coverUrl : `https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </>
                    )}
 
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Top Bar */}
                      <div className="flex items-start justify-between mb-auto">
                        <div className={`p-3 rounded-2xl ${isHero ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {item.type === 'Video' ? <Video className="w-6 h-6" /> : 
                           item.type === 'Slide' ? <ImageIcon className="w-6 h-6" /> : 
                           item.type === 'Plan' ? <FileText className="w-6 h-6" /> : 
                           <Music className="w-6 h-6" />}
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isHero ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                          {item.grade}
                        </span>
                      </div>
                      
                      {/* Content */}
                      <div className="mt-8">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs font-bold uppercase tracking-wider ${isHero ? 'text-indigo-300' : 'text-indigo-600'}`}>
                            {item.category}
                          </span>
                          <span className={isHero ? 'text-slate-400' : 'text-slate-300'}>•</span>
                          <span className={`text-xs ${isHero ? 'text-slate-300' : 'text-slate-500'}`}>
                            {item.type}
                          </span>
                        </div>
                        
                        <h3 className={`font-extrabold leading-tight mb-4 ${
                          isHero ? 'text-3xl md:text-4xl text-white' : 'text-xl md:text-2xl text-slate-900'
                        } group-hover:text-indigo-500 transition-colors`}>
                          {item.title}
                        </h3>
                        
                        {(isHero || index === 3) && (
                          <p className={`line-clamp-2 text-sm md:text-base ${isHero ? 'text-slate-300' : 'text-slate-500'} mb-6`}>
                            {item.description}
                          </p>
                        )}
                      </div>
 
                      {/* Bottom Action */}
                      <div className="mt-auto pt-6 flex items-center justify-between">
                        <div className="flex gap-4 text-sm font-medium">
                          <span className={`flex items-center gap-1.5 ${isHero ? 'text-slate-300' : 'text-slate-500'}`}>
                            👁 {item.viewCount}
                          </span>
                        </div>
                        
                        <button 
                          className={`flex items-center justify-center w-12 h-12 rounded-full transition-transform transform group-hover:scale-110 ${
                            isHero ? 'bg-white text-slate-900 hover:bg-indigo-100' : 'bg-slate-900 text-white hover:bg-indigo-600'
                          }`}
                          onClick={() => {
                            dbService.incrementView(item.id);
                            window.open(item.fileUrl !== '-' ? item.fileUrl : `https://youtube.com/watch?v=${item.youtubeId}`, "_blank");
                          }}
                        >
                          {item.type === 'Video' ? <PlayCircle className="w-5 h-5 ml-0.5" /> : <Download className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
 
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p className="flex items-center justify-center gap-2">
          สร้างสรรค์ด้วยความตั้งใจเพื่อคุณครูและนักเรียน <Sparkles className="w-4 h-4 text-amber-400" />
        </p>
      </footer>
    </main>
  );
}
