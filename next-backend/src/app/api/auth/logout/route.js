import { NextResponse } from "next/server";
import corsHeaders from "../../../../lib/cors";
import { optionsResponse } from "../../../../lib/utils";

export async function OPTIONS() { return optionsResponse(); }

export async function POST() {
  const response = NextResponse.json({ message: "Logged out." }, { headers: corsHeaders });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
