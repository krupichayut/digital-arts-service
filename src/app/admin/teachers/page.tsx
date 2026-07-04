"use client";

import { useEffect, useState, useRef } from "react";
import { teacherService, Teacher, TeacherInput } from "@/lib/cdbs/teachers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit2, Trash2, Users, Loader2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TeachersAdminPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<TeacherInput>({
    name: "",
    position: "",
    subjectGroup: "",
    email: "",
    phone: "",
    profileImageUrl: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const data = await teacherService.getTeachers();
      setTeachers(data);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subjectGroup.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenNew = () => {
    setFormData({ name: "", position: "", subjectGroup: "", email: "", phone: "", profileImageUrl: "" });
    setEditingId(null);
    setFileToUpload(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setFormData({
      name: t.name,
      position: t.position,
      subjectGroup: t.subjectGroup,
      email: t.email,
      phone: t.phone,
      profileImageUrl: t.profileImageUrl
    });
    setEditingId(t.id);
    setFileToUpload(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await teacherService.deleteTeacher(id);
      await fetchTeachers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.position) {
      alert("Please fill out required fields.");
      return;
    }

    setIsSaving(true);
    try {
      let finalUrl = formData.profileImageUrl;

      if (fileToUpload) {
        const uploadData = new FormData();
        uploadData.append("file", fileToUpload);

        const uploadRes = await fetch("/api/upload-drive", {
          method: "POST",
          body: uploadData,
        });

        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok || !uploadResult.success) {
          throw new Error(uploadResult.error || "File upload failed");
        }
        
        finalUrl = uploadResult.fileUrl;
      }

      const dataToSave = { ...formData, profileImageUrl: finalUrl };

      if (editingId) {
        await teacherService.updateTeacher(editingId, dataToSave);
      } else {
        await teacherService.addTeacher(dataToSave);
      }

      setIsDialogOpen(false);
      await fetchTeachers();
    } catch (err) {
      console.error(err);
      alert("Error saving data.");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <Users className="w-6 h-6 mr-3 text-indigo-400" />
            Teachers & Staff
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Manage personnel data and profiles</p>
        </div>
        <Button onClick={handleOpenNew} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Personnel
        </Button>
      </div>

      <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-4 sm:p-6 shadow-xl backdrop-blur-xl">
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Search by name or subject group..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-950 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500 h-11"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTeachers.map(t => (
              <motion.div 
                key={t.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors group"
              >
                <div className="h-40 bg-zinc-900 relative">
                  {t.profileImageUrl && t.profileImageUrl !== "-" && t.profileImageUrl !== "" ? (
                    <img src={t.profileImageUrl} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(t)} className="p-2 bg-black/60 hover:bg-black text-white rounded-lg backdrop-blur-md transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold truncate">{t.name}</h3>
                  <p className="text-sm text-indigo-400 mt-1 truncate">{t.position}</p>
                  <p className="text-xs text-zinc-500 mt-2">Group: {t.subjectGroup || "-"}</p>
                  <p className="text-xs text-zinc-500 mt-1">Email: {t.email || "-"}</p>
                </div>
              </motion.div>
            ))}
            {filteredTeachers.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500">
                No personnel found.
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 bg-zinc-900/50">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? "Edit Personnel" : "Add Personnel"}
                </h2>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-zinc-900 border-white/10" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Position *</Label>
                    <Input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="bg-zinc-900 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject Group</Label>
                    <Input value={formData.subjectGroup} onChange={e => setFormData({...formData, subjectGroup: e.target.value})} className="bg-zinc-900 border-white/10" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-zinc-900 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-zinc-900 border-white/10" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Profile Image</Label>
                  <div className="flex gap-2 items-center">
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
                      className="border-white/10 hover:bg-white/5"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {fileToUpload ? "Change File" : "Upload Image"}
                    </Button>
                    <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                      {fileToUpload ? fileToUpload.name : (formData.profileImageUrl && formData.profileImageUrl !== "-" ? "Existing Image URL" : "No image selected")}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">Or paste a URL below:</p>
                  <Input 
                    value={formData.profileImageUrl} 
                    onChange={e => setFormData({...formData, profileImageUrl: e.target.value})} 
                    className="bg-zinc-900 border-white/10"
                    placeholder="https://..."
                    disabled={!!fileToUpload}
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-white/5 bg-zinc-900/30 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="hover:bg-white/5">Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingId ? "Update" : "Save"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
