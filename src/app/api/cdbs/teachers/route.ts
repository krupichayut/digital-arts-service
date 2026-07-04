import { NextRequest, NextResponse } from "next/server";
import {
  appendSheetRecord,
  deleteSheetRecord,
  isGoogleSheetsConfigured,
  readSheetRecords,
  updateSheetRecord,
} from "@/lib/google-sheets-db";
import type { Teacher, TeacherInput } from "@/lib/cdbs/teachers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEACHER_HEADERS = [
  "id",
  "name",
  "position",
  "subjectGroup",
  "email",
  "phone",
  "profileImageUrl",
  "createdAt",
];

const teacherSheetConfig = {
  sheetName: process.env.GOOGLE_SHEETS_TEACHERS_SHEET_NAME || "Teachers",
  headers: TEACHER_HEADERS,
};

type TeacherRecord = { id: string } & Record<string, string>;

const toTeacher = (record: TeacherRecord): Teacher => ({
  id: record.id,
  name: record.name || "",
  position: record.position || "",
  subjectGroup: record.subjectGroup || "",
  email: record.email || "",
  phone: record.phone || "",
  profileImageUrl: record.profileImageUrl || "",
  createdAt: record.createdAt || new Date().toISOString(),
});

const toTeacherRecord = (item: Teacher): TeacherRecord => ({
  id: item.id,
  name: item.name,
  position: item.position,
  subjectGroup: item.subjectGroup,
  email: item.email,
  phone: item.phone,
  profileImageUrl: item.profileImageUrl,
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
    const records = await readSheetRecords(teacherSheetConfig);
    const teachers = records
      .map((record) => toTeacher(record))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Google Sheets teachers read failed:", error);
    return NextResponse.json(
      { error: "Unable to read teachers database." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const input = (await request.json()) as TeacherInput;
    const item: Teacher = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };

    await appendSheetRecord(teacherSheetConfig, toTeacherRecord(item));
    return NextResponse.json(item);
  } catch (error) {
    console.error("Google Sheets teachers append failed:", error);
    return NextResponse.json(
      { error: "Unable to save teacher." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const body = (await request.json()) as {
      id?: string;
      fields?: Partial<Teacher>;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Missing teacher id." }, { status: 400 });
    }

    const records = await readSheetRecords(teacherSheetConfig);
    const current = records
      .map((record) => toTeacher(record))
      .find((item) => item.id === body.id);

    if (!current) {
      return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
    }

    const updated: Teacher = {
      ...current,
      ...(body.fields || {}),
    };

    await updateSheetRecord(
      teacherSheetConfig,
      body.id,
      toTeacherRecord(updated)
    );
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Google Sheets teacher update failed:", error);
    return NextResponse.json(
      { error: "Unable to update teacher." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing teacher id." }, { status: 400 });
    }

    await deleteSheetRecord(teacherSheetConfig, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google Sheets teacher delete failed:", error);
    return NextResponse.json(
      { error: "Unable to delete teacher." },
      { status: 500 }
    );
  }
}
