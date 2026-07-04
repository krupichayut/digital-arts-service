import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

const getDriveService = () => {
  // Try OAuth 2.0 first (for Personal Gmail quota)
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: "v3", auth: oauth2Client });
  }

  // Fallback to Service Account (For Workspace Shared Drives)
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Handle newline characters in the private key that might get escaped in env variables
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error("Google API credentials are not configured. Please set GOOGLE_REFRESH_TOKEN or Service Account credentials.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const rawFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!rawFolderId) {
      return NextResponse.json({ error: "Google Drive Folder ID is not configured" }, { status: 500 });
    }

    // Extract ID if user accidentally pasted the full URL
    let folderId = rawFolderId;
    const match = rawFolderId.match(/folders\/([a-zA-Z0-9_-]+)/) || rawFolderId.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      folderId = match[1];
    }

    const drive = getDriveService();

    // Convert Web File to Node.js Readable stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const fileMetadata = {
      name: file.name,
      parents: [folderId],
    };

    const media = {
      mimeType: file.type,
      body: stream,
    };

    // Upload to Google Drive
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
      supportsAllDrives: true,
    });

    const fileId = response.data.id;
    
    // Set permissions so anyone can read the file
    if (fileId) {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      });
    }

    return NextResponse.json({ 
      success: true, 
      fileId: response.data.id,
      fileUrl: response.data.webViewLink 
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Drive Upload Error:", error);
    return NextResponse.json({ 
      error: "Failed to upload file to Google Drive", 
      details: message 
    }, { status: 500 });
  }
}
