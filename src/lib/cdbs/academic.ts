"use client";

export interface AcademicWork {
  id: string;
  title: string;
  author: string;
  workType: string;
  academicYear: string;
  subjectArea: string;
  abstract: string;
  keywords: string[];
  publicationUrl: string;
  coverUrl: string;
  status: string;
  viewCount: number;
  createdAt: string;
}

export type AcademicWorkInput = Omit<
  AcademicWork,
  "id" | "viewCount" | "createdAt"
>;

const STORAGE_KEY = "artclass_academic_works_v1";
const INITIAL_ACADEMIC_WORKS: AcademicWork[] = [];
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
    throw new Error("Google Sheets academic request failed.");
  }

  return response.json() as Promise<T>;
};

class AcademicWorkService {
  private getLocalData(): AcademicWork[] {
    if (typeof window === "undefined") return INITIAL_ACADEMIC_WORKS;

    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACADEMIC_WORKS));
      return INITIAL_ACADEMIC_WORKS;
    }

    return (JSON.parse(localData) as AcademicWork[]).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private setLocalData(items: AcademicWork[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  async getWorks(): Promise<AcademicWork[]> {
    if (requestedProvider === "google-sheets") {
      try {
        return await requestJson<AcademicWork[]>("/api/cdbs/academic");
      } catch (error) {
        console.error(
          "Academic Google Sheets fetch failed. Falling back locally:",
          error
        );
      }
    }

    return this.getLocalData();
  }

  async addWork(item: AcademicWorkInput): Promise<AcademicWork> {
    if (requestedProvider === "google-sheets") {
      try {
        return await requestJson<AcademicWork>("/api/cdbs/academic", {
          method: "POST",
          body: JSON.stringify(item),
        });
      } catch (error) {
        console.error("Academic Google Sheets add failed. Saving locally:", error);
      }
    }

    const newItem: AcademicWork = {
      id: "academic-" + Math.random().toString(36).substring(2, 9),
      ...item,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };

    const localData = this.getLocalData();
    localData.push(newItem);
    this.setLocalData(localData);
    return newItem;
  }

  async updateWork(
    id: string,
    updatedFields: Partial<AcademicWork>
  ): Promise<AcademicWork> {
    if (requestedProvider === "google-sheets" && !id.startsWith("academic-")) {
      try {
        return await requestJson<AcademicWork>("/api/cdbs/academic", {
          method: "PATCH",
          body: JSON.stringify({ id, fields: updatedFields }),
        });
      } catch (error) {
        console.error("Academic Google Sheets update failed:", error);
      }
    }

    const localData = this.getLocalData();
    const index = localData.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error("Academic work not found");
    }

    localData[index] = { ...localData[index], ...updatedFields };
    this.setLocalData(localData);
    return localData[index];
  }

  async deleteWork(id: string): Promise<boolean> {
    if (requestedProvider === "google-sheets" && !id.startsWith("academic-")) {
      try {
        await requestJson<{ success: boolean }>(
          `/api/cdbs/academic?id=${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );
        return true;
      } catch (error) {
        console.error("Academic Google Sheets delete failed:", error);
      }
    }

    const localData = this.getLocalData();
    this.setLocalData(localData.filter((item) => item.id !== id));
    return true;
  }

  async incrementView(id: string): Promise<void> {
    if (requestedProvider === "google-sheets" && !id.startsWith("academic-")) {
      try {
        await requestJson<AcademicWork>("/api/cdbs/academic", {
          method: "PATCH",
          body: JSON.stringify({ id, increment: "viewCount" }),
        });
        return;
      } catch (error) {
        console.error("Academic Google Sheets view increment failed:", error);
      }
    }

    const localData = this.getLocalData();
    const index = localData.findIndex((item) => item.id === id);

    if (index !== -1) {
      localData[index].viewCount += 1;
      this.setLocalData(localData);
    }
  }
}

export const academicWorkService = new AcademicWorkService();
