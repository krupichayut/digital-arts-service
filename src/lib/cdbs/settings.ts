"use client";

export interface PlatformSettings {
  id: string; // will always be "global"
  schoolName: string;
  academicYear: string;
  logoUrl: string;
  themeColor: string;
  updatedAt: string;
}

export type PlatformSettingsInput = Omit<PlatformSettings, "id" | "updatedAt">;

const STORAGE_KEY = "artclass_settings_v1";
const INITIAL_SETTINGS: PlatformSettings = {
  id: "global",
  schoolName: "คลังสื่อการเรียนการสอน",
  academicYear: new Date().getFullYear().toString(),
  logoUrl: "",
  themeColor: "#4f46e5", // indigo-600
  updatedAt: new Date().toISOString()
};

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
    throw new Error("Google Sheets settings request failed.");
  }

  return response.json() as Promise<T>;
};

class SettingsService {
  private getLocalData(): PlatformSettings {
    if (typeof window === "undefined") return INITIAL_SETTINGS;

    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }

    return JSON.parse(localData) as PlatformSettings;
  }

  private setLocalData(settings: PlatformSettings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  async getSettings(): Promise<PlatformSettings> {
    if (requestedProvider === "google-sheets") {
      try {
        const remoteSettings = await requestJson<PlatformSettings>("/api/cdbs/settings");
        if (remoteSettings && remoteSettings.id === "global") {
            return remoteSettings;
        }
      } catch (error) {
        console.error(
          "Settings Google Sheets fetch failed. Falling back locally:",
          error
        );
      }
    }

    return this.getLocalData();
  }

  async updateSettings(updatedFields: Partial<PlatformSettingsInput>): Promise<PlatformSettings> {
    if (requestedProvider === "google-sheets") {
      try {
        return await requestJson<PlatformSettings>("/api/cdbs/settings", {
          method: "PATCH",
          body: JSON.stringify({ fields: updatedFields }),
        });
      } catch (error) {
        console.error("Settings Google Sheets update failed:", error);
      }
    }

    const current = this.getLocalData();
    const updated = { 
        ...current, 
        ...updatedFields, 
        updatedAt: new Date().toISOString() 
    };
    this.setLocalData(updated);
    return updated;
  }
}

export const settingsService = new SettingsService();
