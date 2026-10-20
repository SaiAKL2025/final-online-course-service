// src/lib/utils.js

import { NextResponse } from "next/server";
import corsHeaders from "./cors";
import { verifyJWT } from "./auth";
import { getClientPromise } from "./mongodb";

export function printExceptionLog(logMessage, error) {
  console.log(`==>${logMessage} Exception`);
  console.log(error);
}

export function errorResponse(message, status) {
  return NextResponse.json(
    {
      message: message,
    },
    {
      status: status,
      headers: corsHeaders,
    },
  );
}

export function successResponse(jsonData, status) {
  return NextResponse.json(jsonData, {
    status: status,
    headers: corsHeaders,
  });
}

export function getDatabase() {
  return getClientPromise().then((client) => client.db(process.env.MONGODB_DB || "online_course_service"));
}

export function currentUser(request) {
  return verifyJWT(request);
}

export function requireUser(request, role) {
  const user = currentUser(request);
  if (!user) return { error: errorResponse("Please log in to continue.", 401) };
  if (role && user.role !== role) return { error: errorResponse("You are not allowed to perform this action.", 403) };
  return { user };
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function safeUser(user) {
  return { id: user._id.toString(), username: user.username, email: user.email, role: user.role };
}
