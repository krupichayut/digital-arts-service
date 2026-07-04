import { NextRequest, NextResponse } from "next/server";
import {
  appendSheetRecord,
  deleteSheetRecord,
  isGoogleSheetsConfigured,
  readSheetRecords,
  updateSheetRecord,
} from "@/lib/google-sheets-db";
import type { AcademicWork, AcademicWorkInput } from "@/lib/cdbs/academic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACADEMIC_HEADERS = [
  "id",
  "title",
  "author",
  "workType",
  "academicYear",
  "subjectArea",
  "abstract",
  "keywords",
  "publicationUrl",
  "coverUrl",
  "status",
  "viewCount",
  "createdAt",
];

const academicSheetConfig = {
  sheetName: process.env.GOOGLE_SHEETS_ACADEMIC_SHEET_NAME || "AcademicWorks",
  headers: ACADEMIC_HEADERS,
};

type AcademicRecord = { id: string } & Record<string, string>;

const parseKeywords = (value: string) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }
};

const toAcademicWork = (record: AcademicRecord): AcademicWork => ({
  id: record.id,
  title: record.title || "",
  author: record.author || "",
  workType: record.workType || "",
  academicYear: record.academicYear || "",
  subjectArea: record.subjectArea || "",
  abstract: record.abstract || "",
  keywords: parseKeywords(record.keywords || ""),
  publicationUrl: record.publicationUrl || "-",
  coverUrl: record.coverUrl || "-",
  status: record.status || "เผยแพร่",
  viewCount: Number(record.viewCount || 0),
  createdAt: record.createdAt || new Date().toISOString(),
});

const toAcademicRecord = (item: AcademicWork): AcademicRecord => ({
  id: item.id,
  title: item.title,
  author: item.author,
  workType: item.workType,
  academicYear: item.academicYear,
  subjectArea: item.subjectArea,
  abstract: item.abstract,
  keywords: JSON.stringify(item.keywords || []),
  publicationUrl: item.publicationUrl,
  coverUrl: item.coverUrl,
  status: item.status,
  viewCount: String(item.viewCount || 0),
  createdAt: item.createdAt,
});

const configurationError = () =>
  NextResponse.json(
    { error: "Google Sheets database is not configured." },
    { status: 503 }
  );

export async function GET() {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const records = await readSheetRecords(academicSheetConfig);
    const works = records
      .map((record) => toAcademicWork(record))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return NextResponse.json(works);
  } catch (error) {
    console.error("Google Sheets academic read failed:", error);
    return NextResponse.json(
      { error: "Unable to read academic database." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const input = (await request.json()) as AcademicWorkInput;
    const item: AcademicWork = {
      id: crypto.randomUUID(),
      ...input,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };

    await appendSheetRecord(academicSheetConfig, toAcademicRecord(item));
    return NextResponse.json(item);
  } catch (error) {
    console.error("Google Sheets academic append failed:", error);
    return NextResponse.json(
      { error: "Unable to save academic work." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const body = (await request.json()) as {
      id?: string;
      fields?: Partial<AcademicWork>;
      increment?: "viewCount";
    };

    if (!body.id) {
      return NextResponse.json({ error: "Missing work id." }, { status: 400 });
    }

    const records = await readSheetRecords(academicSheetConfig);
    const current = records
      .map((record) => toAcademicWork(record))
      .find((item) => item.id === body.id);

    if (!current) {
      return NextResponse.json({ error: "Work not found." }, { status: 404 });
    }

    const updated: AcademicWork = {
      ...current,
      ...(body.fields || {}),
    };

    if (body.increment === "viewCount") {
      updated.viewCount = current.viewCount + 1;
    }

    await updateSheetRecord(
      academicSheetConfig,
      body.id,
      toAcademicRecord(updated)
    );
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Google Sheets academic update failed:", error);
    return NextResponse.json(
      { error: "Unable to update academic work." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing work id." }, { status: 400 });
    }

    await deleteSheetRecord(academicSheetConfig, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google Sheets academic delete failed:", error);
    return NextResponse.json(
      { error: "Unable to delete academic work." },
      { status: 500 }
    );
  }
}
