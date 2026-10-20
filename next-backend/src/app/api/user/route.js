import { getDatabase, optionsResponse, requireUser, safeUser, successResponse } from "../../../lib/utils";

export async function OPTIONS() { return optionsResponse(); }

export async function GET(request) {
  const auth = requireUser(request, "Teacher");
  if (auth.error) return auth.error;
  try {
    const db = await getDatabase();
    const users = await db.collection("users").find({ role: "Student" }).project({ password: 0 }).sort({ username: 1 }).toArray();
    return successResponse({ users: users.map(safeUser) });
  } catch (error) {
    console.error("Could not list students", error);
    return successResponse({ message: "Could not load students." }, 500);
  }
}
