"use client";

import type { CdbsProvider, MediaInput, MediaItem } from "./types";

const INITIAL_MOCK_DATA: MediaItem[] = [];

export class LocalCdbsProvider implements CdbsProvider {
  readonly name = "local";
  readonly isRemote = false;

  constructor(private readonly storageKey: string) {}

  private getLocalData(): MediaItem[] {
    if (typeof window === "undefined") return INITIAL_MOCK_DATA;

    const localData = localStorage.getItem(this.storageKey);
    if (!localData) {
      localStorage.setItem(this.storageKey, JSON.stringify(INITIAL_MOCK_DATA));
      return INITIAL_MOCK_DATA;
    }

    return (JSON.parse(localData) as MediaItem[]).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private setLocalData(items: MediaItem[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  async getMedia(): Promise<MediaItem[]> {
    return this.getLocalData();
  }

  async addMedia(item: MediaInput): Promise<MediaItem> {
    const newItem: MediaItem = {
      id: "local-" + Math.random().toString(36).substring(2, 9),
      ...item,
      viewCount: 0,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };

    const localData = this.getLocalData();
    localData.push(newItem);
    this.setLocalData(localData);
    return newItem;
  }

  async updateMedia(
    id: string,
    updatedFields: Partial<MediaItem>
  ): Promise<MediaItem> {
    const localData = this.getLocalData();
    const index = localData.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error("Item not found");
    }

    localData[index] = { ...localData[index], ...updatedFields };
    this.setLocalData(localData);
    return localData[index];
  }

  async deleteMedia(id: string): Promise<boolean> {
    const localData = this.getLocalData();
    this.setLocalData(localData.filter((item) => item.id !== id));
    return true;
  }

  async incrementView(id: string): Promise<void> {
    const localData = this.getLocalData();
    const index = localData.findIndex((item) => item.id === id);

    if (index !== -1) {
      localData[index].viewCount += 1;
      this.setLocalData(localData);
    }
  }

  async incrementDownload(id: string): Promise<void> {
    const localData = this.getLocalData();
    const index = localData.findIndex((item) => item.id === id);

    if (index !== -1) {
      localData[index].downloadCount += 1;
      this.setLocalData(localData);
    }
  }
}
