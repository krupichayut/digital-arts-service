"use client";

export interface MediaItem {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  grade: string;
  type: string;
  learningUnit: string;
  standardCode: string;
  description: string;
  tags: string[];
  fileUrl: string;
  youtubeId: string;
  viewCount: number;
  downloadCount: number;
  studentResults?: string;
  problems?: string;
  suggestions?: string;
  createdAt: string;
  coverUrl?: string;
}

export type MediaInput = Omit<
  MediaItem,
  "id" | "viewCount" | "downloadCount" | "createdAt"
>;

export interface CdbsProvider {
  readonly name: string;
  readonly isRemote: boolean;
  getMedia(): Promise<MediaItem[]>;
  addMedia(item: MediaInput): Promise<MediaItem>;
  updateMedia(id: string, updatedFields: Partial<MediaItem>): Promise<MediaItem>;
  deleteMedia(id: string): Promise<boolean>;
  incrementView(id: string): Promise<void>;
  incrementDownload(id: string): Promise<void>;
}
