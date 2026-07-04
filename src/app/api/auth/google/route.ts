import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, clientId, clientSecret, redirectUri, code } = body;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    if (action === "get_url") {
      // Generate the url that will be used for authorization
      const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/drive"],
        prompt: "consent", // Force to get refresh token
      });
      return NextResponse.json({ url: authorizeUrl });
    } 
    
    if (action === "get_token" && code) {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      return NextResponse.json({ 
        refreshToken: tokens.refresh_token,
        tokens 
      });
    }

    return NextResponse.json({ error: "Invalid action or missing code" }, { status: 400 });

  } catch (error: any) {
    console.error("Google Auth API Error:", error);
    return NextResponse.json({ 
      error: "Failed to process Google Auth",
      details: error.message 
    }, { status: 500 });
  }
}
