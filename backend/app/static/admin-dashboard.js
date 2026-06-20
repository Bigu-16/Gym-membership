const state = {
  token: localStorage.getItem("gym_api_token") || "",
  members: [],
  families: [],
  templates: [],
  sessions: [],
  checkIns: [],
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function toast(message, bad = false) {
  const el = $("#toast");
  el.textContent = message;
  el.style.borderColor = bad ? "var(--danger)" : "var(--line)";
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 3600);
}

function authHeaders(json = true) {
  const headers = {};
  if (json) headers["Content-Type"] = "application/json";
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  return headers;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...authHeaders(options.json !== false),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!response.ok) {
    const detail = data && data.detail ? data.detail : text || response.statusText;
    throw new Error(`${response.status} ${detail}`);
  }
  return data;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setService(ok, text) {
  const dot = $("#serviceStatus");
  dot.classList.toggle("bad", !ok);
  dot.classList.toggle("muted", ok === null);
  $("#serviceStatusText").textContent = text;
}

function row(title, subtitle, tag = "", tagClass = "") {
  return `
    <div class="row">
      <div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(subtitle || "")}</span></div>
      ${tag ? `<span class="pill ${tagClass}">${escapeHtml(tag)}</span>` : ""}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderList(target, html) {
  $(target).innerHTML = html || `<div class="empty">No records found.</div>`;
}

function fillSelect(selector, items, label, value = "id") {
  const el = $(selector);
  el.innerHTML = items.map((item) => `<option value="${item[value]}">${escapeHtml(label(item))}</option>`).join("");
}

async function checkHealth() {
  try {
    await fetch("/api/v1/health/live");
    setService(true, "API online");
  } catch {
    setService(false, "API offline");
  }
}

async function login() {
  const body = new URLSearchParams();
  body.set("username", $("#emailInput").value);
  body.set("password", $("#passwordInput").value);
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Login failed");
  state.token = data.access_token;
  localStorage.setItem("gym_api_token", state.token);
  toast("Logged in");
  await loadAll();
}

async function loadOverview() {
  const [stats, active, recent] = await Promise.all([
    api("/api/v1/dashboard/stats"),
    api("/api/v1/dashboard/active-members"),
    api("/api/v1/dashboard/recent-activities"),
  ]);
  $("#totalMembers").textContent = stats.total_members;
  $("#activeMembers").textContent = stats.active_members;
  $("#todaySessions").textContent = stats.today_sessions;
  $("#recentActivities").textContent = stats.recent_activities;
  renderList("#activeMembersList", active.map((m) => row(m.member_name, `${m.phone} checked in ${fmt(m.check_in_time)}`, "in club", "good")).join(""));
  renderList("#recentActivityList", recent.map((a) => row(a.member_name, fmt(a.timestamp), a.action, a.action === "check_in" ? "good" : "warn")).join(""));
}

async function loadMembers() {
  const query = $("#memberSearch").value.trim();
  state.members = await api(`/api/v1/members/${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  renderList("#memberList", state.members.map((m) => {
    const status = m.is_frozen ? ["frozen", "warn"] : [m.expiry_date && new Date(m.expiry_date) < new Date() ? "expired" : "active", m.expiry_date && new Date(m.expiry_date) < new Date() ? "bad" : "good"];
    return row(m.name, `${m.phone} | age ${m.age} | expires ${m.expiry_date || "not set"}`, status[0], status[1]);
  }).join(""));
  fillSelect("#checkInMemberSelect", state.members, (m) => `${m.name} (${m.phone})`);
  fillSelect("#enrollMemberSelect", state.members.filter((m) => !m.is_frozen), (m) => `${m.name} (${m.phone})`);
}

async function loadFamilies() {
  state.families = await api("/api/v1/members/families");
  renderList("#familyList", state.families.map((family) => {
    const frozenCount = family.members.filter((member) => member.is_frozen).length;
    const allFrozen = family.members.length > 0 && frozenCount === family.members.length;
    const parent = family.parent;
    return `
      <div class="row">
        <div>
          <strong>${escapeHtml(parent.name)}</strong>
          <span>${escapeHtml(parent.phone)}${parent.email ? ` | ${escapeHtml(parent.email)}` : ""} | ${family.members.length} members</span>
        </div>
        <button class="small secondary" data-family-freeze="${family.id}" data-frozen="${allFrozen ? "false" : "true"}">${allFrozen ? "Unfreeze" : "Freeze"}</button>
      </div>
    `;
  }).join(""));
}

async function loadSchedule() {
  [state.templates, state.sessions] = await Promise.all([
    api("/api/v1/schedule/templates"),
    api("/api/v1/schedule/sessions"),
  ]);
  renderList("#templateList", state.templates.map((t) => row(t.title, `${t.type} | ${t.days.join(", ")} at ${t.time}`, `${t.capacity} cap`)).join(""));
  renderList("#sessionList", state.sessions.map((s) => row(`${s.trainer_name} | ${s.date}`, `template #${s.template_id || "none"}`, s.status, s.status === "completed" ? "good" : "warn")).join(""));
  fillSelect("#sessionTemplateSelect", state.templates, (t) => `${t.title} #${t.id}`);
  fillSelect("#enrollTemplateSelect", state.templates, (t) => `${t.title} #${t.id}`);
}

async function loadCheckIns() {
  state.checkIns = await api("/api/v1/check-ins/");
  renderList("#checkInList", state.checkIns.map((c) => {
    const member = state.members.find((m) => m.id === c.member_id);
    const active = !c.check_out_time;
    return `
      <div class="row">
        <div><strong>${escapeHtml(member ? member.name : `Member #${c.member_id}`)}</strong><span>${fmt(c.check_in_time)}${c.check_out_time ? ` to ${fmt(c.check_out_time)}` : ""}</span></div>
        ${active ? `<button class="small secondary" data-checkout="${c.id}">Check out</button>` : `<span class="pill">done</span>`}
      </div>
    `;
  }).join(""));
}

async function loadEnrollments() {
  const enrollments = await api("/api/v1/enrollments/");
  renderList("#enrollmentList", enrollments.map((e) => {
    const member = state.members.find((m) => m.id === e.member_id);
    return row(member ? member.name : `Member #${e.member_id}`, `template #${e.template_id || "-"} | session #${e.session_id || "-"}`, `#${e.id}`);
  }).join(""));
}

async function loadUsers() {
  const users = await api("/api/v1/users/");
  renderList("#userList", users.map((u) => row(u.full_name, u.email, u.role, u.is_active ? "good" : "bad")).join(""));
}

async function loadNotifications() {
  const jobs = await api("/api/v1/notifications/jobs");
  renderList("#notificationList", jobs.map((j) => row(`${j.notification_type} for member #${j.member_id || "-"}`, fmt(j.scheduled_for), j.status, j.status === "failed" ? "bad" : j.status === "processed" ? "good" : "warn")).join(""));
}

async function loadAll() {
  await Promise.all([checkHealth(), loadOverview(), loadMembers(), loadFamilies(), loadSchedule(), loadUsers(), loadNotifications()]);
  await Promise.all([loadCheckIns(), loadEnrollments()]);
}

function fmt(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function bindNavigation() {
  $$(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".nav-item").forEach((item) => item.classList.remove("active"));
      $$(".section").forEach((section) => section.classList.remove("active"));
      btn.classList.add("active");
      $(`#${btn.dataset.section}`).classList.add("active");
    });
  });
}

function bindForms() {
  $("#loginBtn").addEventListener("click", () => login().catch((error) => toast(error.message, true)));
  $("#refreshBtn").addEventListener("click", () => loadAll().then(() => toast("Refreshed")).catch((error) => toast(error.message, true)));
  $("#memberSearch").addEventListener("input", () => loadMembers().catch((error) => toast(error.message, true)));

  $("#memberForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    await api("/api/v1/members/", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        age: Number(data.age),
        gender: data.gender || null,
        expiry_date: data.expiry_date || null,
        messaging_opt_in: Boolean(data.messaging_opt_in),
      }),
    });
    event.currentTarget.reset();
    toast("Member created");
    await loadAll();
  });

  $("#familyForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    await api("/api/v1/members/families", {
      method: "POST",
      body: JSON.stringify({
        parent: {
          name: data.parent_name,
          phone: data.parent_phone,
          email: data.parent_email || null,
          address: data.parent_address || null,
          relationship: data.parent_relationship || "parent",
          notes: data.notes || null,
        },
        members: [
          { name: data.child_a, phone: data.child_a_phone, age: Number(data.child_a_age), parent_phone: data.parent_phone },
          { name: data.child_b, phone: data.child_b_phone, age: Number(data.child_b_age), parent_phone: data.parent_phone },
        ],
      }),
    });
    event.currentTarget.reset();
    toast("Family created");
    await loadAll();
  });

  $("#templateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    await api("/api/v1/schedule/templates", {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        type: data.type,
        days: data.days.split(",").map((day) => day.trim()).filter(Boolean),
        time: data.time,
        capacity: Number(data.capacity),
      }),
    });
    event.currentTarget.reset();
    toast("Template created");
    await loadSchedule();
  });

  $("#sessionForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    await api("/api/v1/schedule/sessions", {
      method: "POST",
      body: JSON.stringify({
        template_id: data.template_id ? Number(data.template_id) : null,
        date: data.date,
        trainer_name: data.trainer_name,
        status: data.status,
        checklist_data: { items: [] },
      }),
    });
    event.currentTarget.reset();
    toast("Session created");
    await loadSchedule();
  });

  $("#checkInForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    await api("/api/v1/check-ins/", {
      method: "POST",
      body: JSON.stringify({ member_id: Number(data.member_id) }),
    });
    toast("Member checked in");
    await Promise.all([loadOverview(), loadCheckIns()]);
  });

  $("#enrollmentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    await api("/api/v1/enrollments/", {
      method: "POST",
      body: JSON.stringify({ member_id: Number(data.member_id), template_id: Number(data.template_id) }),
    });
    toast("Enrollment created");
    await loadEnrollments();
  });

  $("#userForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    await api("/api/v1/users/", {
      method: "POST",
      body: JSON.stringify({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        role: data.role,
        is_active: Boolean(data.is_active),
      }),
    });
    event.currentTarget.reset();
    toast("User created");
    await loadUsers();
  });

  document.body.addEventListener("click", async (event) => {
    const action = event.target.dataset.action;
    if (event.target.dataset.checkout) {
      await api(`/api/v1/check-ins/${event.target.dataset.checkout}/check-out`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      toast("Checked out");
      await Promise.all([loadOverview(), loadCheckIns()]);
    }
    if (event.target.dataset.familyFreeze) {
      await api(`/api/v1/members/families/${event.target.dataset.familyFreeze}/freeze`, {
        method: "PATCH",
        body: JSON.stringify({ is_frozen: event.target.dataset.frozen === "true" }),
      });
      toast("Family updated");
      await Promise.all([loadMembers(), loadFamilies()]);
    }
    if (action === "refresh-active" || action === "refresh-activity") await loadOverview();
    if (action === "load-schedule") await loadSchedule();
    if (action === "load-families") await loadFamilies();
    if (action === "load-notifications") await loadNotifications();
    if (action === "seed-demo") {
      await runTask("/api/v1/tasks/seed-demo-data");
      await loadAll();
    }
    if (action === "expiry-reminders") await runTask("/api/v1/tasks/membership-expiry-reminders");
    if (action === "process-notifications") await runTask("/api/v1/tasks/process-notification-jobs");
  });

  $("#sendRequestBtn").addEventListener("click", async () => {
    const method = $("#methodSelect").value;
    const path = $("#pathInput").value;
    const rawBody = $("#bodyInput").value.trim();
    try {
      const options = { method };
      if (!["GET", "DELETE"].includes(method) && rawBody) options.body = rawBody;
      const data = await api(path, options);
      $("#responseOutput").textContent = JSON.stringify(data, null, 2);
    } catch (error) {
      $("#responseOutput").textContent = error.message;
    }
  });
}

async function runTask(path) {
  const result = await api(path, { method: "POST", body: JSON.stringify({}) });
  $("#taskOutput").textContent = JSON.stringify(result, null, 2);
  toast("Task queued");
}

bindNavigation();
bindForms();
checkHealth();
document.querySelectorAll('input[type="date"]').forEach((input) => {
  if (!input.value) input.value = new Date().toISOString().slice(0, 10);
});
window.addEventListener("unhandledrejection", (event) => {
  toast(event.reason?.message || "Request failed", true);
});
if (state.token) {
  loadAll().catch((error) => toast(error.message, true));
}
