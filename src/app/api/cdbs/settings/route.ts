import { NextRequest, NextResponse } from "next/server";
import {
  appendSheetRecord,
  isGoogleSheetsConfigured,
  readSheetRecords,
  updateSheetRecord,
} from "@/lib/google-sheets-db";
import type { PlatformSettings, PlatformSettingsInput } from "@/lib/cdbs/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETTINGS_HEADERS = [
  "id",
  "schoolName",
  "academicYear",
  "logoUrl",
  "themeColor",
  "updatedAt"
];

const settingsSheetConfig = {
  sheetName: process.env.GOOGLE_SHEETS_SETTINGS_SHEET_NAME || "Settings",
  headers: SETTINGS_HEADERS,
};

type SettingsRecord = { id: string } & Record<string, string>;

const toSettings = (record: SettingsRecord): PlatformSettings => ({
  id: record.id,
  schoolName: record.schoolName || "",
  academicYear: record.academicYear || "",
  logoUrl: record.logoUrl || "",
  themeColor: record.themeColor || "",
  updatedAt: record.updatedAt || new Date().toISOString(),
});

const toSettingsRecord = (item: PlatformSettings): SettingsRecord => ({
  id: item.id,
  schoolName: item.schoolName,
  academicYear: item.academicYear,
  logoUrl: item.logoUrl,
  themeColor: item.themeColor,
  updatedAt: item.updatedAt,
});

const configurationError = () =>
  NextResponse.json(
    { error: "Google Sheets database is not configured." },
    { status: 503 }
  );

export async function GET() {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const records = await readSheetRecords(settingsSheetConfig);
    const settings = records.find(r => r.id === "global");
    
    if (settings) {
        return NextResponse.json(toSettings(settings as SettingsRecord));
    }
    
    // If no settings exist yet, create default
    const defaultSettings: PlatformSettings = {
        id: "global",
        schoolName: "คลังสื่อการเรียนการสอน",
        academicYear: new Date().getFullYear().toString(),
        logoUrl: "",
        themeColor: "#4f46e5",
        updatedAt: new Date().toISOString()
    };
    
    await appendSheetRecord(settingsSheetConfig, toSettingsRecord(defaultSettings));
    
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error("Google Sheets settings read failed:", error);
    return NextResponse.json(
      { error: "Unable to read settings database." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isGoogleSheetsConfigured()) return configurationError();

  try {
    const body = (await request.json()) as {
      fields?: Partial<PlatformSettings>;
    };

    const records = await readSheetRecords(settingsSheetConfig);
    const current = records
      .map((record) => toSettings(record))
      .find((item) => item.id === "global");

    if (!current) {
        // If not found, append a new one
        const newSettings: PlatformSettings = {
            id: "global",
            schoolName: body.fields?.schoolName || "คลังสื่อการเรียนการสอน",
            academicYear: body.fields?.academicYear || new Date().getFullYear().toString(),
            logoUrl: body.fields?.logoUrl || "",
            themeColor: body.fields?.themeColor || "#4f46e5",
            updatedAt: new Date().toISOString()
        };
        await appendSheetRecord(settingsSheetConfig, toSettingsRecord(newSettings));
        return NextResponse.json(newSettings);
    }

    const updated: PlatformSettings = {
      ...current,
      ...(body.fields || {}),
      updatedAt: new Date().toISOString()
    };

    await updateSheetRecord(
      settingsSheetConfig,
      "global",
      toSettingsRecord(updated)
    );
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Google Sheets settings update failed:", error);
    return NextResponse.json(
      { error: "Unable to update settings." },
      { status: 500 }
    );
  }
}
