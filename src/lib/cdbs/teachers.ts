"use client";

export interface Teacher {
  id: string;
  name: string;
  position: string;
  subjectGroup: string;
  email: string;
  phone: string;
  profileImageUrl: string;
  createdAt: string;
}

export type TeacherInput = Omit<Teacher, "id" | "createdAt">;

const STORAGE_KEY = "artclass_teachers_v1";
const INITIAL_TEACHERS: Teacher[] = [];
const requestedProvider =
  process.env.NEXT_PUBLIC_CDBS_PROVIDER || "google-sheets";

const requestJson = async <T>(
  url: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error("Google Sheets teachers request failed.");
  }

  return response.json() as Promise<T>;
};

class TeacherService {
  private getLocalData(): Teacher[] {
    if (typeof window === "undefined") return INITIAL_TEACHERS;

    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TEACHERS));
      return INITIAL_TEACHERS;
    }

    return (JSON.parse(localData) as Teacher[]).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private setLocalData(items: Teacher[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  async getTeachers(): Promise<Teacher[]> {
    if (requestedProvider === "google-sheets") {
      try {
        return await requestJson<Teacher[]>("/api/cdbs/teachers");
      } catch (error) {
        console.error(
          "Teachers Google Sheets fetch failed. Falling back locally:",
          error
        );
      }
    }

    return this.getLocalData();
  }

  async addTeacher(item: TeacherInput): Promise<Teacher> {
    if (requestedProvider === "google-sheets") {
      try {
        return await requestJson<Teacher>("/api/cdbs/teachers", {
          method: "POST",
          body: JSON.stringify(item),
        });
      } catch (error) {
        console.error("Teachers Google Sheets add failed. Saving locally:", error);
      }
    }

    const newItem: Teacher = {
      id: "teacher-" + Math.random().toString(36).substring(2, 9),
      ...item,
      createdAt: new Date().toISOString(),
    };

    const localData = this.getLocalData();
    localData.push(newItem);
    this.setLocalData(localData);
    return newItem;
  }

  async updateTeacher(
    id: string,
    updatedFields: Partial<Teacher>
  ): Promise<Teacher> {
    if (requestedProvider === "google-sheets" && !id.startsWith("teacher-")) {
      try {
        return await requestJson<Teacher>("/api/cdbs/teachers", {
          method: "PATCH",
          body: JSON.stringify({ id, fields: updatedFields }),
        });
      } catch (error) {
        console.error("Teachers Google Sheets update failed:", error);
      }
    }

    const localData = this.getLocalData();
    const index = localData.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error("Teacher not found");
    }

    localData[index] = { ...localData[index], ...updatedFields };
    this.setLocalData(localData);
    return localData[index];
  }

  async deleteTeacher(id: string): Promise<boolean> {
    if (requestedProvider === "google-sheets" && !id.startsWith("teacher-")) {
      try {
        await requestJson<{ success: boolean }>(
          `/api/cdbs/teachers?id=${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );
        return true;
      } catch (error) {
        console.error("Teachers Google Sheets delete failed:", error);
      }
    }

    const localData = this.getLocalData();
    this.setLocalData(localData.filter((item) => item.id !== id));
    return true;
  }
}

export const teacherService = new TeacherService();
