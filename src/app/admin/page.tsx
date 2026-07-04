"use client";

import { useEffect, useState, useRef } from "react";
import { cdbsStatus, dbService, MediaItem } from "@/lib/cdbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, FileText, BarChart3, DownloadCloud, MoreHorizontal, Video, Image as ImageIcon, Library, Database, Cloud, HardDrive, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface HealthStatus {
  checkedAt: string;
  cdbs: {
    provider: string;
  };
  appwrite: {
    endpoint: boolean;
    project: boolean;
    database: boolean;
    collection: string;
  };
  google: {
    serviceAccount: boolean;
    driveFolder: boolean;
    sheetsSpreadsheet: boolean;
  };
}

export default function AdminPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metrics
  const totalViews = media.reduce((acc, curr) => acc + curr.viewCount, 0);
  const totalDownloads = media.reduce((acc, curr) => acc + curr.downloadCount, 0);

  const [formData, setFormData] = useState({
    title: "",
    category: "ทัศนศิลป์",
    subCategory: "",
    grade: "ป.1",
    type: "Video",
    learningUnit: "",
    standardCode: "",
    fileUrl: "",
    youtubeId: "",
    tags: "",
    description: "",
    studentResults: "",
    problems: "",
    suggestions: "",
  });

  const loadData = async () => {
    setLoading(true);
    const [data, healthResult] = await Promise.all([
      dbService.getMedia(),
      fetch("/api/health")
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ]);
    setMedia(data);
    setHealth(healthResult);
    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, []);

  const handleEdit = (item: MediaItem) => {
    setFormData({
      title: item.title,
      category: item.category,
      subCategory: item.subCategory,
      grade: item.grade,
      type: item.type,
      learningUnit: item.learningUnit,
      standardCode: item.standardCode,
      fileUrl: item.fileUrl === '-' ? '' : item.fileUrl,
      youtubeId: item.youtubeId === '-' ? '' : item.youtubeId,
      tags: item.tags.join(', '),
      description: item.description,
      studentResults: item.studentResults || "",
      problems: item.problems || "",
      suggestions: item.suggestions || "",
    });
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      await dbService.deleteMedia(id);
      await loadData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let finalFileUrl = formData.fileUrl;

    try {
      if (fileToUpload) {
        const uploadData = new FormData();
        uploadData.append("file", fileToUpload);

        const uploadRes = await fetch("/api/upload-drive", {
          method: "POST",
          body: uploadData,
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          finalFileUrl = uploadResult.fileUrl;
        } else {
          console.error("Upload failed:", uploadResult.error);
          alert("Failed to upload file to Google Drive: " + uploadResult.details);
          setUploading(false);
          return;
        }
      }

      const dataToSave = {
        ...formData,
        subCategory: formData.subCategory || "-",
        learningUnit: formData.learningUnit || "-",
        standardCode: formData.standardCode || "-",
        fileUrl: finalFileUrl || "-",
        youtubeId: formData.type === 'Video' ? (formData.youtubeId || "-") : "-",
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        studentResults: formData.studentResults || "-",
        problems: formData.problems || "-",
        suggestions: formData.suggestions || "-",
      };

      if (editingId) {
        await dbService.updateMedia(editingId, dataToSave);
      } else {
        await dbService.addMedia(dataToSave);
      }
      
      setIsDialogOpen(false);
      setEditingId(null);
      setFileToUpload(null);
      setFormData(prev => ({ ...prev, fileUrl: finalFileUrl }));
      await loadData();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error saving data. Please check configuration.");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "ทัศนศิลป์",
      subCategory: "",
      grade: "ป.1",
      type: "Video",
      learningUnit: "",
      standardCode: "",
      fileUrl: "",
      youtubeId: "",
      tags: "",
      description: "",
      studentResults: "",
      problems: "",
      suggestions: "",
    });
    setEditingId(null);
    setFileToUpload(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Video': return <Video className="w-4 h-4 text-red-400" />;
      case 'Slide': return <ImageIcon className="w-4 h-4 text-orange-400" />;
      case 'Worksheet': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'Plan': return <FileText className="w-4 h-4 text-emerald-400" />;
      default: return <FileText className="w-4 h-4 text-zinc-400" />;
    }
  };

  const appwriteReady = Boolean(
    health?.appwrite.endpoint &&
      health.appwrite.project &&
      health.appwrite.database
  );
  const driveReady = Boolean(
    health?.google.serviceAccount && health.google.driveFolder
  );
  const sheetsReady = Boolean(
    health?.google.serviceAccount && health.google.sheetsSpreadsheet
  );
  const healthCards = [
    {
      label: "CDBS Provider",
      value: health?.cdbs.provider || cdbsStatus.provider,
      ready: Boolean(health?.cdbs.provider || cdbsStatus.provider),
      icon: cdbsStatus.isRemote ? Cloud : HardDrive,
      detail: cdbsStatus.isRemote ? "Cloud database active" : "Local fallback active",
    },
    {
      label: "Appwrite",
      value: appwriteReady ? "Ready" : "Needs config",
      ready: appwriteReady,
      icon: Database,
      detail: `Collection: ${health?.appwrite.collection || "media"}`,
    },
    {
      label: "Google Drive",
      value: driveReady ? "Ready" : "Needs config",
      ready: driveReady,
      icon: DownloadCloud,
      detail: "File upload destination",
    },
    {
      label: "Google Sheets",
      value: sheetsReady ? "Ready" : "Needs config",
      ready: sheetsReady,
      icon: FileText,
      detail: "Report sync destination",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Media Overview</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage and track all educational materials in the system.</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => window.open('/admin/report', '_blank')}
            className="bg-[#0a0a0a] border-white/10 text-white hover:bg-white/5 hover:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger render={
              <Button className="bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10 font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Add New Media
              </Button>
            } />
            <DialogContent className="bg-[#0f0f11] border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl shadow-2xl">
              <div className="px-6 py-4 border-b border-white/5 bg-[#141417]">
                <DialogTitle className="text-xl font-semibold text-white tracking-tight">
                  {editingId ? "Edit Media Details" : "Create New Media"}
                </DialogTitle>
                <p className="text-xs text-zinc-400 mt-1">Fill in the information below to {editingId ? "update the" : "add a new"} learning resource.</p>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Title <span className="text-red-400">*</span></Label>
                    <Input id="title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-[#0a0a0a] border-white/10 focus-visible:ring-indigo-500 text-white h-11" placeholder="e.g. Basic Watercolors for Beginners" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Category</Label>
                      <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v || ''})}>
                        <SelectTrigger className="bg-[#0a0a0a] border-white/10 text-white h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-[#141417] border-white/10 text-white">
                          <SelectItem value="ทัศนศิลป์" className="hover:bg-white/5 focus:bg-white/10 cursor-pointer">ทัศนศิลป์ (Visual Arts)</SelectItem>
                          <SelectItem value="ดนตรี" className="hover:bg-white/5 focus:bg-white/10 cursor-pointer">ดนตรี (Music)</SelectItem>
                          <SelectItem value="นาฏศิลป์" className="hover:bg-white/5 focus:bg-white/10 cursor-pointer">นาฏศิลป์ (Dance)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Target Grade</Label>
                      <Select value={formData.grade} onValueChange={v => setFormData({...formData, grade: v || ''})}>
                        <SelectTrigger className="bg-[#0a0a0a] border-white/10 text-white h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-[#141417] border-white/10 text-white">
                          <SelectItem value="ป.1" className="cursor-pointer">ป.1 (Grade 1)</SelectItem>
                          <SelectItem value="ป.2" className="cursor-pointer">ป.2 (Grade 2)</SelectItem>
                          <SelectItem value="ป.3" className="cursor-pointer">ป.3 (Grade 3)</SelectItem>
                          <SelectItem value="ป.4" className="cursor-pointer">ป.4 (Grade 4)</SelectItem>
                          <SelectItem value="ป.5" className="cursor-pointer">ป.5 (Grade 5)</SelectItem>
                          <SelectItem value="ป.6" className="cursor-pointer">ป.6 (Grade 6)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Media Type</Label>
                      <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v || ''})}>
                        <SelectTrigger className="bg-[#0a0a0a] border-white/10 text-white h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-[#141417] border-white/10 text-white">
                          <SelectItem value="Video" className="cursor-pointer">Video</SelectItem>
                          <SelectItem value="Worksheet" className="cursor-pointer">Worksheet</SelectItem>
                          <SelectItem value="Slide" className="cursor-pointer">Slide</SelectItem>
                          <SelectItem value="Plan" className="cursor-pointer">Lesson Plan</SelectItem>
                          <SelectItem value="PDF" className="cursor-pointer">PDF Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Description</Label>
                    <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-[#0a0a0a] border-white/10 focus-visible:ring-indigo-500 text-white h-11" placeholder="Brief summary of the content" />
                  </div>

                  {formData.type === 'Video' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                      <Label htmlFor="youtubeId" className="text-xs font-semibold uppercase tracking-wider text-indigo-300">YouTube Video ID</Label>
                      <Input id="youtubeId" placeholder="e.g. dQw4w9WgXcQ" value={formData.youtubeId} onChange={e => setFormData({...formData, youtubeId: e.target.value})} className="bg-[#0a0a0a] border-white/10 focus-visible:ring-indigo-500 text-white h-11" />
                      <p className="text-xs text-indigo-400/70">The 11-character string after ?v= in a YouTube link.</p>
                    </motion.div>
                  )}

                  <div className="space-y-2 border border-white/5 p-4 rounded-xl bg-[#1a1a1f]">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Attach File (Upload to Drive) OR External Link</Label>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)}
                          className="bg-[#0a0a0a] border-white/10 text-white file:text-white file:bg-indigo-600 file:border-0 file:mr-4 file:px-4 hover:file:bg-indigo-700 cursor-pointer h-11 py-2"
                        />
                        {fileToUpload && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => { setFileToUpload(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">Clear</Button>
                        )}
                      </div>
                      <div className="text-center text-xs text-zinc-500 font-semibold uppercase">OR</div>
                      <Input id="fileUrl" value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} disabled={!!fileToUpload} className="bg-[#0a0a0a] border-white/10 focus-visible:ring-indigo-500 text-white h-11 disabled:opacity-50" placeholder="Paste existing URL (https://)" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Tags</Label>
                    <Input id="tags" placeholder="e.g. watercolor, basics, art (comma separated)" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="bg-[#0a0a0a] border-white/10 focus-visible:ring-indigo-500 text-white h-11" />
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <h4 className="text-sm font-semibold text-indigo-400">ข้อมูลสำหรับรายงานการใช้สื่อ (พิมพ์ PDF)</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="studentResults" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">ผลที่เกิดขึ้นกับผู้เรียน</Label>
                      <textarea id="studentResults" rows={3} value={formData.studentResults} onChange={e => setFormData({...formData, studentResults: e.target.value})} className="flex w-full rounded-md border bg-[#0a0a0a] border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50" placeholder="อธิบายผลที่เกิดขึ้นหลังจากนำสื่อไปใช้..." />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="problems" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">ปัญหา / แนวทางแก้ไข</Label>
                      <textarea id="problems" rows={2} value={formData.problems} onChange={e => setFormData({...formData, problems: e.target.value})} className="flex w-full rounded-md border bg-[#0a0a0a] border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50" placeholder="ปัญหาที่พบและวิธีการแก้ปัญหา..." />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="suggestions" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">ข้อเสนอแนะอื่น</Label>
                      <textarea id="suggestions" rows={2} value={formData.suggestions} onChange={e => setFormData({...formData, suggestions: e.target.value})} className="flex w-full rounded-md border bg-[#0a0a0a] border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50" placeholder="ข้อเสนอแนะเพิ่มเติม..." />
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-white/5 bg-[#141417] flex justify-end gap-3 rounded-b-2xl">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-white/5 hover:text-white text-zinc-400 border-none font-medium">Cancel</Button>
                  <Button type="submit" disabled={uploading} className="bg-white text-black hover:bg-zinc-200 font-semibold px-6 disabled:opacity-50 disabled:cursor-not-allowed">
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : "Save Media"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {healthCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[#0f0f11] border border-white/5 rounded-2xl p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/5">
                  <Icon className="h-5 w-5 text-zinc-300" />
                </div>
                <div
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    card.ready
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {card.ready ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {card.ready ? "Online" : "Setup"}
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {card.label}
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">{card.value}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {card.detail}
              </p>
            </div>
          );
        })}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f0f11] border border-white/5 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Total Media</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">{media.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Library className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        <div className="bg-[#0f0f11] border border-white/5 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Total Views</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">{totalViews.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
            <BarChart3 className="w-6 h-6 text-pink-400" />
          </div>
        </div>
        <div className="bg-[#0f0f11] border border-white/5 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Total Downloads</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">{totalDownloads.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <DownloadCloud className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#0f0f11] border border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-base font-semibold text-white">Recent Media</h3>
          <div className="text-xs text-zinc-500 font-medium px-3 py-1 bg-white/5 rounded-full border border-white/5">
            Updated just now
          </div>
        </div>
        
        <Table>
          <TableHeader className="bg-[#0a0a0a] border-b border-white/5">
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wider text-zinc-500 font-semibold w-[45%] h-12">Title</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-zinc-500 font-semibold h-12">Type & Grade</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-zinc-500 font-semibold text-right h-12">Performance</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-zinc-500 font-semibold text-right h-12 w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-b border-white/5 hover:bg-transparent"><TableCell colSpan={4} className="text-center py-16 text-zinc-500 font-medium">Loading data...</TableCell></TableRow>
            ) : media.length === 0 ? (
              <TableRow className="border-b border-white/5 hover:bg-transparent"><TableCell colSpan={4} className="text-center py-16 text-zinc-500 font-medium">No media found in the database.</TableCell></TableRow>
            ) : media.map((item) => (
              <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                <TableCell className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{item.title}</div>
                      <div className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5 font-medium">
                        <span className="text-zinc-400">{item.category}</span>
                        {item.subCategory !== '-' && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span>{item.subCategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-zinc-900 border-zinc-800 text-zinc-300">
                      {item.type}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">{item.grade}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-right">
                  <div className="flex flex-col items-end gap-1 font-medium">
                    <span className="text-sm text-zinc-300 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-zinc-500" /> {item.viewCount.toLocaleString()}</span>
                    <span className="text-xs text-emerald-400/80 flex items-center gap-1.5"><DownloadCloud className="w-3.5 h-3.5" /> {item.downloadCount.toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* Fallback for touch devices or keyboard navigation - always show a more horizontal icon if not hovered */}
                  <div className="group-hover:hidden flex justify-end px-2">
                    <MoreHorizontal className="w-5 h-5 text-zinc-600" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
