import { getDatabase, optionsResponse, requireUser, successResponse, errorResponse } from "../../../lib/utils";

export async function OPTIONS() { return optionsResponse(); }

export async function GET(request) {
  const auth = requireUser(request);
  if (auth.error) return auth.error;
  try {
    const db = await getDatabase();
    const query = auth.user.role === "Teacher"
      ? { teacherId: auth.user.id }
      : { status: { $ne: "Cancel" } };
    const courses = await db.collection("courses").aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $lookup: {
        from: "users",
        let: { teacherId: "$teacherId" },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$teacherId"] } } },
          { $project: { username: 1, email: 1 } },
        ],
        as: "teacher",
      } },
      { $lookup: {
        from: "enrollments",
        let: { courseId: { $toString: "$_id" } },
        pipeline: [
          { $match: { $expr: { $eq: ["$courseId", "$$courseId"] } } },
          { $count: "count" },
        ],
        as: "enrollmentCount",
      } },
      { $addFields: { teacherName: { $ifNull: [{ $arrayElemAt: ["$teacher.username", 0] }, "Teacher"] }, enrolledCount: { $ifNull: [{ $arrayElemAt: ["$enrollmentCount.count", 0] }, 0] } } },
      { $project: { teacher: 0, enrollmentCount: 0 } },
    ]).toArray();
    return successResponse({ courses });
  } catch (error) {
    console.error("Could not list courses", error);
    return errorResponse("Could not load courses.", 500);
  }
}

export async function POST(request) {
  const auth = requireUser(request, "Teacher");
  if (auth.error) return auth.error;
  try {
    const { name, duration, topics, price, maxStudent, status } = await request.json();
    const clean = validateCourse({ name, duration, topics, price, maxStudent, status });
    if (clean.error) return errorResponse(clean.error, 400);
    const db = await getDatabase();
    const course = { ...clean.value, teacherId: auth.user.id, enrolledCount: 0, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection("courses").insertOne(course);
    return successResponse({ course: { ...course, _id: result.insertedId, enrolledCount: 0, teacherName: auth.user.username } }, 201);
  } catch (error) {
    console.error("Could not create course", error);
    return errorResponse("Could not create course.", 500);
  }
}

export function validateCourse(input) {
  const name = String(input.name || "").trim();
  const duration = Number(input.duration);
  const price = Number(input.price);
  const maxStudent = Number(input.maxStudent);
  const topics = Array.isArray(input.topics) ? input.topics.map((topic) => String(topic).trim()).filter(Boolean) : String(input.topics || "").split(",").map((topic) => topic.trim()).filter(Boolean);
  const status = ["Open", "Close", "Cancel"].includes(input.status) ? input.status : "Open";
  if (!name) return { error: "Course name is required." };
  if (!Number.isInteger(duration) || duration < 1) return { error: "Duration must be at least 1 day." };
  if (!topics.length) return { error: "Add at least one topic." };
  if (!Number.isFinite(price) || price < 0) return { error: "Price must be zero or higher." };
  if (!Number.isInteger(maxStudent) || maxStudent < 1) return { error: "Maximum students must be at least 1." };
  return { value: { name, duration, topics, price, maxStudent, status } };
}
