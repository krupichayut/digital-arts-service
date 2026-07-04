export async function GET() {
  const requestedProvider =
    process.env.NEXT_PUBLIC_CDBS_PROVIDER || "google-sheets";
  const appwrite = {
    endpoint: Boolean(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT),
    project: Boolean(process.env.NEXT_PUBLIC_APPWRITE_PROJECT),
    database: Boolean(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID),
    collection: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || "media",
  };

  const google = {
    serviceAccount: Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
    ),
    driveFolder: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
    sheetsSpreadsheet: Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID),
    mediaSheet: process.env.GOOGLE_SHEETS_MEDIA_SHEET_NAME || "Media",
    academicSheet:
      process.env.GOOGLE_SHEETS_ACADEMIC_SHEET_NAME || "AcademicWorks",
  };
  const googleReady = Boolean(
    google.serviceAccount && google.sheetsSpreadsheet
  );
  const appwriteReady = Boolean(
    appwrite.endpoint && appwrite.project && appwrite.database
  );

  return Response.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    cdbs: {
      requestedProvider,
      provider:
        requestedProvider === "google-sheets" && googleReady
          ? "google-sheets"
          : requestedProvider === "appwrite" && appwriteReady
            ? "appwrite"
            : "localStorage",
    },
    appwrite,
    google,
  });
}
