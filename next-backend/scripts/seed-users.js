import bcrypt from "bcrypt";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing. Create next-backend/.env.local first.");
  process.exit(1);
}

const client = new MongoClient(uri);
const password = "Course@123";
const passwordHash = await bcrypt.hash(password, 12);
const testUsers = [
  { username: "student1", email: "student1@example.com", role: "Student" },
  { username: "student2", email: "student2@example.com", role: "Student" },
  { username: "student3", email: "student3@example.com", role: "Student" },
  { username: "teacher1", email: "teacher1@example.com", role: "Teacher" },
  { username: "teacher2", email: "teacher2@example.com", role: "Teacher" },
  { username: "teacher3", email: "teacher3@example.com", role: "Teacher" },
];

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "online_course_service");
  const users = db.collection("users");
  await users.createIndex({ username: 1 }, { unique: true });
  await users.createIndex({ email: 1 }, { unique: true });
  for (const user of testUsers) {
    await users.updateOne(
      { username: user.username },
      { $set: { ...user, password: passwordHash, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  }
  console.log(`Seeded ${testUsers.length} test users in ${db.databaseName}.`);
  console.log(`Shared test password: ${password}`);
} catch (error) {
  console.error("Could not seed test accounts:", error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
