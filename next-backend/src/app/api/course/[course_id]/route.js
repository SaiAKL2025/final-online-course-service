import { ObjectId } from "mongodb";
import { getDatabase, optionsResponse, requireUser, successResponse, errorResponse } from "../../../../lib/utils";
import { validateCourse } from "../route";

export async function OPTIONS() { return optionsResponse(); }

export async function GET(request, { params }) {
  const auth = requireUser(request);
  if (auth.error) return auth.error;
  const { course_id } = await params;
  if (!ObjectId.isValid(course_id)) return errorResponse("Course not found.", 404);
  try {
    const db = await getDatabase();
    const course = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });
    if (!course) return errorResponse("Course not found.", 404);
    if (auth.user.role === "Teacher" && course.teacherId !== auth.user.id) return errorResponse("You can only view your own courses.", 403);
    if (auth.user.role === "Student" && course.status === "Cancel") return errorResponse("This course is not available.", 404);
    const [teacher, enrollments] = await Promise.all([
      db.collection("users").findOne({ _id: new ObjectId(course.teacherId) }, { projection: { username: 1, email: 1 } }),
      db.collection("enrollments").find({ courseId: course._id.toString() }).toArray(),
    ]);
    let students = [];
    if (auth.user.role === "Teacher" && enrollments.length) {
      const ids = enrollments.map((enrollment) => new ObjectId(enrollment.studentId));
      students = await db.collection("users").find({ _id: { $in: ids } }, { projection: { password: 0 } }).toArray();
      students = students.map((student) => ({ id: student._id.toString(), username: student.username, email: student.email }));
    }
    return successResponse({ course: { ...course, teacherName: teacher?.username || "Teacher", enrolledCount: enrollments.length, students } });
  } catch (error) {
    console.error("Could not get course", error);
    return errorResponse("Could not load course.", 500);
  }
}

export async function PUT(request, { params }) {
  const auth = requireUser(request, "Teacher");
  if (auth.error) return auth.error;
  const { course_id } = await params;
  if (!ObjectId.isValid(course_id)) return errorResponse("Course not found.", 404);
  try {
    const db = await getDatabase();
    const current = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });
    if (!current) return errorResponse("Course not found.", 404);
    if (current.teacherId !== auth.user.id) return errorResponse("You can only update your own courses.", 403);
    const clean = validateCourse(await request.json());
    if (clean.error) return errorResponse(clean.error, 400);
    await db.collection("courses").updateOne({ _id: current._id }, { $set: { ...clean.value, updatedAt: new Date() } });
    return successResponse({ course: { ...current, ...clean.value, updatedAt: new Date() } });
  } catch (error) {
    console.error("Could not update course", error);
    return errorResponse("Could not update course.", 500);
  }
}

export async function DELETE(request, { params }) {
  const auth = requireUser(request, "Teacher");
  if (auth.error) return auth.error;
  const { course_id } = await params;
  if (!ObjectId.isValid(course_id)) return errorResponse("Course not found.", 404);
  try {
    const db = await getDatabase();
    const current = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });
    if (!current) return errorResponse("Course not found.", 404);
    if (current.teacherId !== auth.user.id) return errorResponse("You can only delete your own courses.", 403);
    const count = await db.collection("enrollments").countDocuments({ courseId: current._id.toString() });
    if (count) return errorResponse("This course cannot be deleted because students are enrolled.", 409);
    const deleted = await db.collection("courses").deleteOne({ _id: current._id, teacherId: auth.user.id, enrolledCount: 0 });
    if (!deleted.deletedCount) return errorResponse("This course cannot be deleted because students are enrolled.", 409);
    return successResponse({ message: "Course deleted." });
  } catch (error) {
    console.error("Could not delete course", error);
    return errorResponse("Could not delete course.", 500);
  }
}

export async function POST(request, { params }) {
  const auth = requireUser(request, "Student");
  if (auth.error) return auth.error;
  const { course_id } = await params;
  if (!ObjectId.isValid(course_id)) return errorResponse("Course not found.", 404);
  try {
    const db = await getDatabase();
    const course = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });
    if (!course) return errorResponse("Course not found.", 404);
    if (course.status !== "Open") return errorResponse("This course is not open for enrollment.", 409);
    const enrollments = db.collection("enrollments");
    const existing = await enrollments.findOne({ courseId: course._id.toString(), studentId: auth.user.id });
    if (existing) return errorResponse("You are already enrolled in this course.", 409);
    await enrollments.createIndex({ courseId: 1, studentId: 1 }, { unique: true });
    const reservation = await db.collection("courses").updateOne(
      { _id: course._id, status: "Open", $expr: { $lt: [{ $ifNull: ["$enrolledCount", 0] }, "$maxStudent"] } },
      { $inc: { enrolledCount: 1 } },
    );
    if (!reservation.modifiedCount) {
      const latest = await db.collection("courses").findOne({ _id: course._id });
      if (!latest || latest.status !== "Open") return errorResponse("This course is not open for enrollment.", 409);
      return errorResponse("This course has no seats available.", 409);
    }
    try {
      await enrollments.insertOne({ courseId: course._id.toString(), studentId: auth.user.id, enrolledAt: new Date() });
    } catch (error) {
      await db.collection("courses").updateOne({ _id: course._id }, { $inc: { enrolledCount: -1 } });
      if (error.code === 11000) return errorResponse("You are already enrolled in this course.", 409);
      throw error;
    }
    return successResponse({ message: "You are enrolled in this course." }, 201);
  } catch (error) {
    console.error("Could not enroll student", error);
    return errorResponse("Could not enroll in this course.", 500);
  }
}
