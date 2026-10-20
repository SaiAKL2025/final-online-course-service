import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "./context/UserContextValue.js";
import "./App.css";

const emptyForm = { name: "", duration: "3", topics: "", price: "0", maxStudent: "20", status: "Open" };

function Login() {
  const { login } = useContext(UserContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try { await login(username, password); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <main className="login-page">
    <section className="login-panel">
      <div className="brand-mark">OC</div>
      <p className="eyebrow">ONLINE COURSE SERVICE</p>
      <h1>Learn something<br /><span>new today.</span></h1>
      <p className="muted login-intro">Sign in to find a course or manage the classes you teach.</p>
      <form onSubmit={submit} className="login-form">
        <label>Username or email<input required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. student1" /></label>
        <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" /></label>
        {error && <p className="alert error">{error}</p>}
        <button className="button primary full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}<span aria-hidden="true">→</span></button>
      </form>
      <div className="login-note"><strong>For testing</strong><br />Use a test account listed in the project README.</div>
    </section>
    <aside className="login-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-card"><span className="art-symbol">✳</span><p>Small steps.<br /><b>Big progress.</b></p><div className="art-line" /><small>YOUR NEXT CHAPTER STARTS HERE</small></div><div className="art-caption">A place to teach, explore, and grow.</div></aside>
  </main>;
}

function CourseForm({ course, onClose, onSaved }) {
  const { api } = useContext(UserContext);
  const [form, setForm] = useState(course ? { ...course, topics: (course.topics || []).join(", ") } : emptyForm);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    const body = { ...form, duration: Number(form.duration), price: Number(form.price), maxStudent: Number(form.maxStudent), topics: form.topics.split(",").map((x) => x.trim()).filter(Boolean) };
    try {
      await api(course ? `/api/course/${course._id}` : "/api/course", { method: course ? "PUT" : "POST", body: JSON.stringify(body) });
      onSaved();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
    <div className="modal-head"><div><p className="eyebrow">COURSE SETUP</p><h2 id="form-title">{course ? "Edit course" : "Create a course"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
    <form className="course-form" onSubmit={submit}>
      <label className="span-2">Course name<input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Introduction to Web Design" /></label>
      <label>Duration in days<input required type="number" min="1" value={form.duration} onChange={(e) => set("duration", e.target.value)} /></label>
      <label>Maximum students<input required type="number" min="1" value={form.maxStudent} onChange={(e) => set("maxStudent", e.target.value)} /></label>
      <label>Price<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} /></label>
      <label>Status<select value={form.status} onChange={(e) => set("status", e.target.value)}><option>Open</option><option>Close</option><option>Cancel</option></select></label>
      <label className="span-2">Topics <span className="label-hint">Separate each topic with a comma</span><textarea required rows="3" value={form.topics} onChange={(e) => set("topics", e.target.value)} placeholder="HTML, CSS, Responsive design" /></label>
      {error && <p className="alert error span-2">{error}</p>}
      <div className="form-actions span-2"><button type="button" className="button quiet" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy ? "Saving…" : course ? "Save changes" : "Create course"}</button></div>
    </form>
  </section></div>;
}

function CourseDetails({ course, onClose, onChanged }) {
  const { user, api } = useContext(UserContext);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const seats = Math.max(0, Number(course.maxStudent || 0) - Number(course.enrolledCount || 0));
  const isEnrolled = Boolean(course.isEnrolled);
  async function enroll() {
    setBusy(true); setError("");
    try { await api(`/api/course/${course._id}`, { method: "POST" }); onChanged(); onClose(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal detail-modal" role="dialog" aria-modal="true">
    <div className="modal-head"><div><p className="eyebrow">COURSE DETAILS</p><h2>{course.name}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
    <div className="detail-meta"><span className={`status ${course.status?.toLowerCase()}`}>{course.status}</span><span>{course.duration} days</span><span>{course.price === 0 ? "Free" : `฿${Number(course.price).toLocaleString()}`}</span><span>{course.enrolledCount || 0} / {course.maxStudent} seats</span></div>
    <div className="detail-block"><h3>About this course</h3><p className="muted">Taught by <strong>{course.teacherName || "Teacher"}</strong>. Explore the course topics and learn at your own pace.</p></div>
    <div className="detail-block"><h3>Topics</h3><div className="topic-list">{(course.topics || []).map((topic) => <span className="topic" key={topic}>{topic}</span>)}</div></div>
    {user.role === "Teacher" && <div className="detail-block"><h3>Enrolled students <span className="count-pill">{course.students?.length || 0}</span></h3>{course.students?.length ? <div className="student-list">{course.students.map((student) => <div className="student-row" key={student.id}><span className="avatar small">{student.username.slice(0, 1).toUpperCase()}</span><span><b>{student.username}</b><small>{student.email}</small></span></div>)}</div> : <p className="muted">No students have enrolled yet.</p>}</div>}
    {error && <p className="alert error">{error}</p>}
    {user.role === "Student" && <div className="detail-actions"><span className="muted">{isEnrolled ? "You are enrolled" : course.status !== "Open" ? "Enrollment is closed" : seats < 1 ? "No seats remaining" : `${seats} seats remaining`}</span><button className="button primary" onClick={enroll} disabled={busy || isEnrolled || course.status !== "Open" || seats < 1}>{isEnrolled ? "Enrolled ✓" : busy ? "Enrolling…" : "Enroll in course"}</button></div>}
  </section></div>;
}

function CourseCard({ course, role, onOpen, onEdit, onDelete }) {
  const seats = Math.max(0, Number(course.maxStudent || 0) - Number(course.enrolledCount || 0));
  return <article className="course-card">
    <div className="card-topline"><span className="course-icon">{(course.name || "C").slice(0, 1).toUpperCase()}</span><span className={`status ${course.status?.toLowerCase()}`}>{course.status}</span></div>
    <button className="course-title" onClick={onOpen}>{course.name}</button>
    <p className="teacher-line">{role === "Teacher" ? "Your course" : `with ${course.teacherName || "Teacher"}`}</p>
    <div className="topic-list compact">{(course.topics || []).slice(0, 3).map((topic) => <span key={topic} className="topic">{topic}</span>)}{course.topics?.length > 3 && <span className="topic">+{course.topics.length - 3}</span>}</div>
    <div className="course-facts"><span>◷ &nbsp;{course.duration} days</span><span>{course.price === 0 ? "Free" : `฿${Number(course.price).toLocaleString()}`}</span></div>
    <div className="card-bottom"><span className="muted">{course.enrolledCount || 0} enrolled{role === "Student" ? ` · ${seats} seats left` : ` / ${course.maxStudent}`}</span><button className="text-button" onClick={onOpen}>Details <span>→</span></button></div>
    {role === "Teacher" && <div className="teacher-actions"><button className="text-button" onClick={onEdit}>Edit</button><button className="text-button danger-text" onClick={onDelete}>Delete</button></div>}
  </article>;
}

function Dashboard() {
  const { user, logout, api } = useContext(UserContext);
  const [courses, setCourses] = useState([]); const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [search, setSearch] = useState(""); const [view, setView] = useState("browse");
  const [selected, setSelected] = useState(null); const [formCourse, setFormCourse] = useState(null); const [showForm, setShowForm] = useState(false);
  const isTeacher = user.role === "Teacher";
  const refresh = useCallback(async () => {
    try {
      const result = await api("/api/course"); setCourses(result.courses || []);
      if (!isTeacher) { const mine = await api("/api/enrollment"); setEnrolled(mine.courses || []); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [api, isTeacher]);
  // Loading remote data is the purpose of this effect; the state updates happen after the network response.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, [refresh, user.id]);
  const enrolledIds = useMemo(() => new Set(enrolled.map((course) => String(course._id))), [enrolled]);
  const activeCourses = useMemo(() => courses.map((course) => ({ ...course, isEnrolled: enrolledIds.has(String(course._id)) })), [courses, enrolledIds]);
  const visibleCourses = useMemo(() => {
    let list = view === "mine" && !isTeacher ? activeCourses.filter((course) => course.isEnrolled) : activeCourses;
    const query = search.trim().toLowerCase();
    if (query) list = list.filter((course) => `${course.name} ${course.teacherName}`.toLowerCase().includes(query));
    return list;
  }, [activeCourses, view, isTeacher, search]);
  async function openDetails(course) {
    try { const result = await api(`/api/course/${course._id}`); setSelected({ ...course, ...result.course, isEnrolled: course.isEnrolled }); }
    catch (err) { setError(err.message); }
  }
  async function deleteCourse(course) {
    if (!window.confirm(`Delete “${course.name}”?`)) return;
    try { await api(`/api/course/${course._id}`, { method: "DELETE" }); await refresh(); }
    catch (err) { setError(err.message); }
  }
  async function signOut() { await logout(); }
  const enrolledCount = isTeacher ? courses.reduce((sum, course) => sum + (course.enrolledCount || 0), 0) : enrolled.length;
  return <div className="app-shell">
    <aside className="sidebar"><div className="side-brand"><span className="brand-mark small-mark">OC</span><span>OpenCourse<small>LEARNING SPACE</small></span></div>
      <div className="side-label">MENU</div><button className={`nav-item ${view === "browse" ? "active" : ""}`} onClick={() => setView("browse")}><span>▦</span>{isTeacher ? "My courses" : "Explore courses"}</button>
      {!isTeacher && <button className={`nav-item ${view === "mine" ? "active" : ""}`} onClick={() => setView("mine")}><span>▤</span>My learning<span className="nav-count">{enrolled.length}</span></button>}
      <div className="sidebar-bottom"><div className="side-label">YOUR ACCOUNT</div><div className="profile-mini"><span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span><div><strong>{user.username}</strong><small>{user.role}</small></div></div><button className="nav-item signout" onClick={signOut}><span>↪</span>Sign out</button></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> {view === "mine" ? "My learning" : isTeacher ? "Teaching dashboard" : "Explore courses"}</div><div className="top-profile"><span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span><span>{user.username}</span></div></header>
      <div className="content-wrap"><section className="welcome-row"><div><p className="eyebrow">{isTeacher ? "TEACHING DASHBOARD" : "YOUR LEARNING SPACE"}</p><h1>{view === "mine" ? "My learning" : <>Welcome back, <span>{user.username}</span></>}</h1><p className="muted">{isTeacher ? "Create courses and keep track of your students." : "Find a course that sparks your curiosity."}</p></div>{isTeacher && <button className="button primary" onClick={() => { setFormCourse(null); setShowForm(true); }}><span className="plus">+</span> Create course</button>}</section>
        <section className="stats-grid"><div className="stat-card"><span className="stat-icon lavender">▦</span><div><small>{isTeacher ? "YOUR COURSES" : "AVAILABLE COURSES"}</small><strong>{courses.length}</strong></div></div><div className="stat-card"><span className="stat-icon mint">✓</span><div><small>{isTeacher ? "TOTAL ENROLLMENTS" : "YOUR ENROLLMENTS"}</small><strong>{enrolledCount}</strong></div></div><div className="stat-card"><span className="stat-icon peach">✳</span><div><small>{isTeacher ? "OPEN COURSES" : "OPEN FOR ENROLLMENT"}</small><strong>{courses.filter((course) => course.status === "Open").length}</strong></div></div></section>
        <section className="list-heading"><div><h2>{view === "mine" ? "Courses you joined" : isTeacher ? "Your courses" : "Explore courses"}</h2><p className="muted">{isTeacher ? "Manage the courses you teach." : view === "mine" ? "Continue with your enrolled courses." : "Browse courses and enroll while seats are available."}</p></div><label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search course or teacher" /></label></section>
        {error && <p className="alert error">{error}<button onClick={() => setError("")}>×</button></p>}
        {loading ? <div className="loading-state">Loading your courses…</div> : visibleCourses.length ? <div className="course-grid">{visibleCourses.map((course) => <CourseCard key={course._id} course={course} role={user.role} onOpen={() => openDetails(course)} onEdit={() => { setFormCourse(course); setShowForm(true); }} onDelete={() => deleteCourse(course)} />)}</div> : <div className="empty-state"><span>✳</span><h3>{view === "mine" ? "No courses yet" : search ? "No matching courses" : isTeacher ? "Your teaching starts here" : "No courses to show"}</h3><p>{view === "mine" ? "When you enroll in a course, it will appear here." : search ? "Try another course name or teacher." : isTeacher ? "Create your first course and students can start enrolling." : "Please check again later."}</p>{isTeacher && !search && <button className="button primary" onClick={() => { setFormCourse(null); setShowForm(true); }}>Create your first course</button>}</div>}
        <footer className="footer">OpenCourse <span>·</span> Learn at your own pace</footer>
      </div>
    </main>
    {showForm && <CourseForm course={formCourse} onClose={() => setShowForm(false)} onSaved={async () => { setShowForm(false); await refresh(); }} />}
    {selected && <CourseDetails course={selected} onClose={() => setSelected(null)} onChanged={refresh} />}
  </div>;
}

export default function App() {
  const { user, loading } = useContext(UserContext);
  if (loading) return <div className="loading-screen">Opening your learning space…</div>;
  return user ? <Dashboard /> : <Login />;
}
