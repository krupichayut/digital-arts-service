import { NextRequest, NextResponse } from "next/server";
import {
  appendSheetRecord,
  deleteSheetRecord,
  isGoogleSheetsConfigured,
  readSheetRecords,
  updateSheetRecord,
} from "@/lib/google-sheets-db";
import type { MediaInput, MediaItem } from "@/lib/cdbs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_HEADERS = [
  "id",
  "title",
  "category",
  "subCategory",
  "grade",
  "type",
  "learningUnit",
  "standardCode",
  "description",
  "tags",
  "fileUrl",
  "youtubeId",
  "viewCount",
  "downloadCount",
  "studentResults",
  "problems",
  "suggestions",
  "createdAt",
  "coverUrl",
];

const mediaSheetConfig = {
  sheetName: process.env.GOOGLE_SHEETS_MEDIA_SHEET_NAME || "Media",
  headers: MEDIA_HEADERS,
};

type MediaRecord = { id: string } & Record<string, string>;

const parseTags = (value: string) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
};

const toMediaItem = (record: MediaRecord): MediaItem => ({
  id: record.id,
  title: record.title || "",
  category: record.category || "",
  subCategory: record.subCategory || "-",
  grade: record.grade || "",
  type: record.type || "",
  learningUnit: record.learningUnit || "-",
  standardCode: record.standardCode || "-",
  description: record.description || "",
  tags: parseTags(record.tags || ""),
  fileUrl: record.fileUrl || "-",
  youtubeId: record.youtubeId || "-",
  viewCount: Number(record.viewCount || 0),
  downloadCount: Number(record.downloadCount || 0),
  studentResults: record.studentResults || "-",
  problems: record.problems || "-",
  suggestions: record.suggestions || "-",
  createdAt: record.createdAt || new Date().toISOString(),
  coverUrl: record.coverUrl || "-",
});

const toMediaRecord = (item: MediaItem): MediaRecord => ({
  id: item.id,
  title: item.title,
  category: item.category,
  subCategory: item.subCategory,
  grade: item.grade,
  type: item.type,
  learningUnit: item.learningUnit,
  standardCode: item.standardCode,
  description: item.description,
  tags: JSON.stringify(item.tags || []),
  fileUrl: item.fileUrl,
  youtubeId: item.youtubeId,
  viewCount: String(item.viewCount || 0),
  downloadCount: String(item.downloadCount || 0),
  studentResults: item.studentResults || "-",
  problems: item.problems || "-",
  suggestions: item.suggestions || "-",
  createdAt: item.createdAt,
  coverUrl: item.coverUrl || "-",
});

const configurationError = () =>
  NextResponse.json(
    { error: "Google Sheets database is not configured." },
    { status: 503 }
  );

export async function GET() {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const records = await readSheetRecords(mediaSheetConfig);
    const media = records
      .map((record) => toMediaItem(record))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return NextResponse.json(media);
  } catch (error) {
    console.error("Google Sheets media read failed:", error);
    return NextResponse.json(
      { error: "Unable to read media database." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const input = (await request.json()) as MediaInput;
    const item: MediaItem = {
      id: crypto.randomUUID(),
      ...input,
      viewCount: 0,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };

    await appendSheetRecord(mediaSheetConfig, toMediaRecord(item));
    return NextResponse.json(item);
  } catch (error) {
    console.error("Google Sheets media append failed:", error);
    return NextResponse.json(
      { error: "Unable to save media." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const body = (await request.json()) as {
      id?: string;
      fields?: Partial<MediaItem>;
      increment?: "viewCount" | "downloadCount";
    };

    if (!body.id) {
      return NextResponse.json({ error: "Missing media id." }, { status: 400 });
    }

    const records = await readSheetRecords(mediaSheetConfig);
    const current = records
      .map((record) => toMediaItem(record))
      .find((item) => item.id === body.id);

    if (!current) {
      return NextResponse.json({ error: "Media not found." }, { status: 404 });
    }

    const updated: MediaItem = {
      ...current,
      ...(body.fields || {}),
    };

    if (body.increment === "viewCount") {
      updated.viewCount = current.viewCount + 1;
    }

    if (body.increment === "downloadCount") {
      updated.downloadCount = current.downloadCount + 1;
    }

    await updateSheetRecord(mediaSheetConfig, body.id, toMediaRecord(updated));
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Google Sheets media update failed:", error);
    return NextResponse.json(
      { error: "Unable to update media." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing media id." }, { status: 400 });
    }

    await deleteSheetRecord(mediaSheetConfig, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google Sheets media delete failed:", error);
    return NextResponse.json(
      { error: "Unable to delete media." },
      { status: 500 }
    );
  }
}
