# Online Course Service

Final examination project built with Next.js API routes, React + Vite, and MongoDB. The repository keeps the teacher's original two-project structure.

## Test accounts

Run the seed command in `next-backend/` before signing in. It creates or refreshes these six local test accounts. They all use the same password:

**Password:** `Course@123`

| Role | Username | Email |
|---|---|---|
| Student | `student1` | `student1@example.com` |
| Student | `student2` | `student2@example.com` |
| Student | `student3` | `student3@example.com` |
| Teacher | `teacher1` | `teacher1@example.com` |
| Teacher | `teacher2` | `teacher2@example.com` |
| Teacher | `teacher3` | `teacher3@example.com` |

These are exam/demo accounts. Do not reuse their password for real accounts.

## Project folders

```text
Online-Course-Service/
├── INSTRUCTION.md
├── README.md
├── next-backend/                  # Next.js API + MongoDB
│   ├── scripts/seed-users.js
│   └── src/
│       ├── app/api/                # login, user, course, enrollment endpoints
│       └── lib/                    # auth, MongoDB, CORS, response helpers
└── react-frontend/                 # React + Vite interface
    └── src/
        ├── context/UserContext.jsx
        ├── App.jsx
        ├── App.css
        └── index.css
```

## Requirements

- Node.js 20.19+ or 22.12+ and npm
- A MongoDB database. MongoDB Atlas is fine.

## Run locally in VS Code

1. Download or clone the complete repository, then in VS Code choose **File → Open Folder** and select `Online-Course-Service` (the folder containing this README).
2. Open a terminal in VS Code. Set up the backend environment file: `next-backend/.env.local`.

   Copy `next-backend/.env.example` into that new file and replace the MongoDB values. In Atlas, create a database user, allow your computer's IP under **Network Access**, and copy the connection string from **Connect → Drivers**. Replace the username and password in the string. If the database password contains special symbols, URL-encode them. Keep `.env.local` private and do not commit it.

   Example values:

   ```env
   MONGODB_URI=mongodb+srv://dbuser:encoded-password@cluster-name.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=online_course_service
   JWT_SECRET=use-a-long-random-secret-value
   FRONTEND_ORIGIN=http://localhost:5173
   ```

3. Open a second terminal and install backend packages, create the six test users, then start the API:

   ```bash
   cd next-backend
   npm install
   npm run seed
   npm run dev
   ```

   Keep this terminal running. The API is at `http://localhost:3000`.

4. Open a third terminal, create the frontend environment file: `react-frontend/.env.local`. Copy `react-frontend/.env.example` into it. For local development, leave `VITE_API_URL=http://localhost:3000`.
5. Install and start the frontend:

   ```bash
   cd react-frontend
   npm install
   npm run dev
   ```

6. Open the Local URL printed by Vite, usually `http://localhost:5173`. Sign in with `teacher1` or `student1` and password `Course@123`.

## Test the requirements

1. Sign in as `teacher1`. Create a course with a name, duration, comma-separated topics, price, maximum student count, and status `Open`.
2. Open the course details. Confirm the teacher sees enrolled students. Edit the course and save the change.
3. Try to delete the course while students are enrolled. The API must reject deletion; when there are no enrollments, the teacher can delete it.
4. Sign out and sign in as `student1`. Find the new course by course name or teacher name, open it, and enroll.
5. Confirm the course appears in **My learning**. Try to enroll in it again; the API rejects duplicate enrollment.
6. As another student, enroll until `Max Student` is reached. Further enrollment attempts are rejected by the API. Change the course to `Close` as the teacher and confirm it stays visible but cannot be joined. Set it to `Cancel` and confirm it disappears from the student browse list.
7. Sign out and verify that a protected API request (for example `http://localhost:3000/api/course`) returns `401` when no authenticated browser session is present.

Authentication, role checks, course ownership, enrollment limits, course status, and duplicate enrollment are checked in the backend API as well as reflected in the interface.

## Grading checklist

| Grading area | Where it is covered |
|---|---|
| Authentication | Username/email and password login, bcrypt password checks, HTTP-only session cookie, logout, session restore, and `401` for protected requests. |
| Role and authorization | Student and Teacher roles; API routes enforce the required role. Teachers can only view, edit, and delete their own courses. |
| Teacher course management | Teachers create, view, update, and delete courses; details include enrolled students. A course with enrollments cannot be deleted. |
| Enrollment relationship and rules | MongoDB `enrollments` records connect student IDs to course IDs. Duplicate enrollment is prevented by a unique index; seat limits and Open status are checked by the API. |
| Student course functions | Students search by course or teacher name, view details, enroll in eligible courses, and see their courses under **My learning**. Close courses stay visible but cannot be joined; Cancel courses are hidden. |
| Frontend integration and usability | React + Vite calls the Next.js API with credentials enabled; the interface has role-specific dashboards, forms, search, status labels, and error/loading messages. |
| Deployment | The backend and frontend are configured to deploy as separate Vercel projects. Follow the deployment steps below and confirm the live frontend can log in and use the live API. |
| Code quality and submission | Existing two-folder starter structure is retained; environment examples, lockfiles, seed script, API route list, test accounts, run instructions, and submission checklist are included. |

## API routes

| Method | Route | Access |
|---|---|---|
| `POST` | `/api/auth/login` | Public; sets an HTTP-only session cookie |
| `POST` | `/api/auth/logout` | Clears the session cookie |
| `GET` | `/api/auth/me` | Signed-in user |
| `GET` | `/api/course` | Teacher sees own courses; student sees courses except Cancel |
| `POST` | `/api/course` | Teacher creates an owned course |
| `GET` | `/api/course/:course_id` | Signed-in user, with ownership/status checks |
| `PUT` | `/api/course/:course_id` | Owning teacher only |
| `DELETE` | `/api/course/:course_id` | Owning teacher; only if no student is enrolled |
| `POST` | `/api/course/:course_id` | Student enrollment; status, seat, and duplicate checks |
| `GET` | `/api/enrollment` | Student's enrolled courses |
| `GET` | `/api/user` | Teacher's student list |

## Deployment notes

Deploy the two folders as separate Vercel projects:

1. Import the repository into Vercel and set the backend project's **Root Directory** to `next-backend`.
2. In the backend project's **Settings → Environment Variables**, add `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`, and `FRONTEND_ORIGIN`. Set `FRONTEND_ORIGIN` to the exact deployed frontend origin after the frontend is deployed, with no trailing slash.
3. Deploy the backend and copy its URL, for example `https://your-backend.vercel.app`.
4. Create/import a second Vercel project from the same repository and set its **Root Directory** to `react-frontend`.
5. Add `VITE_API_URL` to the frontend project's environment variables, using the backend URL from step 3, then deploy the frontend.
6. Update the backend's `FRONTEND_ORIGIN` with the frontend's exact deployed origin and redeploy the backend.
7. Test the live frontend: sign in with a seeded account, load course data, and test a role-specific action. If the browser blocks the session cookie, confirm both URLs use HTTPS and the origin values match exactly.

Seed the MongoDB database by running `npm run seed` from `next-backend/` with the production database environment values only if the instructor expects the demo accounts there. Never upload `.env.local` or publish production secrets.

## Submission checklist

- Backend repository URL: add your submitted link.
- Frontend repository URL: add your submitted link.
- Deployed backend URL: add your submitted link.
- Deployed frontend URL: add your submitted link.
- Confirm the README test accounts work against the submitted database and deployed application.

If the browser blocks the cookie in production, check that both deployed applications use HTTPS and that the backend `FRONTEND_ORIGIN` exactly matches the frontend domain.
