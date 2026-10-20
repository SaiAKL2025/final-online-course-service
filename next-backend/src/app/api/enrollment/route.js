import { ObjectId } from "mongodb";
import { getDatabase, optionsResponse, requireUser, successResponse, errorResponse } from "../../../lib/utils";

export async function OPTIONS() { return optionsResponse(); }

export async function GET(request) {
  const auth = requireUser(request, "Student");
  if (auth.error) return auth.error;
  try {
    const db = await getDatabase();
    const records = await db.collection("enrollments").find({ studentId: auth.user.id }).sort({ enrolledAt: -1 }).toArray();
    const ids = records.map(({ courseId }) => ObjectId.isValid(courseId) ? new ObjectId(courseId) : null).filter(Boolean);
    const courses = ids.length ? await db.collection("courses").aggregate([
      { $match: { _id: { $in: ids } } },
      { $lookup: {
        from: "users",
        let: { teacherId: "$teacherId" },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$teacherId"] } } },
          { $project: { username: 1 } },
        ],
        as: "teacher",
      } },
      { $addFields: { teacherName: { $ifNull: [{ $arrayElemAt: ["$teacher.username", 0] }, "Teacher"] } } },
      { $project: { teacher: 0 } },
    ]).toArray() : [];
    return successResponse({ courses });
  } catch (error) {
    console.error("Could not load enrollments", error);
    return errorResponse("Could not load your courses.", 500);
  }
}
