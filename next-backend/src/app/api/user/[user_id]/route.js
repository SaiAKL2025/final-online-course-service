import { ObjectId } from "mongodb";
import { getDatabase, optionsResponse, requireUser, safeUser, successResponse, errorResponse } from "../../../../lib/utils";

export async function OPTIONS() { return optionsResponse(); }
export async function GET(request, { params }) {
  const auth = requireUser(request);
  if (auth.error) return auth.error;
  const { user_id } = await params;
  if (!ObjectId.isValid(user_id)) return errorResponse("User not found.", 404);
  try {
    const db = await getDatabase();
    const user = await db.collection("users").findOne({ _id: new ObjectId(user_id) }, { projection: { password: 0 } });
    if (!user) return errorResponse("User not found.", 404);
    if (auth.user.role !== "Teacher" && auth.user.id !== user._id.toString()) return errorResponse("You are not allowed to view this user.", 403);
    return successResponse({ user: safeUser(user) });
  } catch (error) {
    console.error("Could not get user", error);
    return errorResponse("Could not load user.", 500);
  }
}
