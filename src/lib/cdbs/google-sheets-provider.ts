"use client";

import type { CdbsProvider, MediaInput, MediaItem } from "./types";

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
    throw new Error("Google Sheets CDBS request failed.");
  }

  return response.json() as Promise<T>;
};

export class GoogleSheetsCdbsProvider implements CdbsProvider {
  readonly name = "google-sheets";
  readonly isRemote = true;

  async getMedia(): Promise<MediaItem[]> {
    return requestJson<MediaItem[]>("/api/cdbs/media");
  }

  async addMedia(item: MediaInput): Promise<MediaItem> {
    return requestJson<MediaItem>("/api/cdbs/media", {
      method: "POST",
      body: JSON.stringify(item),
    });
  }

  async updateMedia(
    id: string,
    updatedFields: Partial<MediaItem>
  ): Promise<MediaItem> {
    return requestJson<MediaItem>("/api/cdbs/media", {
      method: "PATCH",
      body: JSON.stringify({ id, fields: updatedFields }),
    });
  }

  async deleteMedia(id: string): Promise<boolean> {
    await requestJson<{ success: boolean }>(
      `/api/cdbs/media?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );
    return true;
  }

  async incrementView(id: string): Promise<void> {
    await requestJson<MediaItem>("/api/cdbs/media", {
      method: "PATCH",
      body: JSON.stringify({ id, increment: "viewCount" }),
    });
  }

  async incrementDownload(id: string): Promise<void> {
    await requestJson<MediaItem>("/api/cdbs/media", {
      method: "PATCH",
      body: JSON.stringify({ id, increment: "downloadCount" }),
    });
  }
}
