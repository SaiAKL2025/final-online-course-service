import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import corsHeaders from "../../../../lib/cors";
import { createJWT } from "../../../../lib/auth";
import { getDatabase, optionsResponse, safeUser, errorResponse } from "../../../../lib/utils";

export async function OPTIONS() { return optionsResponse(); }

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();
    const login = String(username || email || "").trim().toLowerCase();
    if (!login || !password) return errorResponse("Enter your username or email and password.", 400);
    const db = await getDatabase();
    const user = await db.collection("users").findOne({ $or: [{ username: login }, { email: login }] });
    if (!user || !(await bcrypt.compare(password, user.password))) return errorResponse("Username/email or password is incorrect.", 401);
    const response = NextResponse.json({ user: safeUser(user) }, { headers: corsHeaders });
    response.cookies.set("token", createJWT(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return errorResponse("Could not log in. Check the MongoDB connection and try again.", 500);
  }
}
