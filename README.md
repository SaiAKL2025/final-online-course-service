# Online Course Service

A web app where teachers manage courses and students browse and enroll in courses.

## Run locally

Backend: open `next-backend` in a terminal.

```bash
npm install
npm run dev

## Test accounts

They all use the same password:

**Password:** `Course@123`

| Role | Username | Email |
|---|---|---|
| Student | `student1` | `student1@example.com` |
| Student | `student2` | `student2@example.com` |
| Student | `student3` | `student3@example.com` |
| Teacher | `teacher1` | `teacher1@example.com` |
| Teacher | `teacher2` | `teacher2@example.com` |
| Teacher | `teacher3` | `teacher3@example.com` |

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