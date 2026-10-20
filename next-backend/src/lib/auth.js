import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "local-course-service-change-this-secret";

export function verifyJWT(req) {
  try {
    const cookieToken = req.cookies?.get?.("token")?.value;
    const authHeader = req.headers?.get?.("authorization");
    const token = cookieToken || authHeader?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return null;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}

export function createJWT(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}
