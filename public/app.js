const state = {
  user: null,
  documents: [],
  activeId: null,
  saveTimer: null,
  users: [],
  rhythm: 8,
  energyHistory: [12, 18, 14, 22, 19, 28, 24, 31, 27, 35, 30, 38],
  focus: false
};

const $ = (id) => document.getElementById(id);
const CIRC = 2 * Math.PI * 28;

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-user-id": state.user?.id || localStorage.getItem("ajaia-user") || "ada",
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong");
  return body;
};

const showToast = (message) => {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => $("toast").classList.remove("show"), 2600);
};

const escapeHtml = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const relativeDate = (date) => {
  const minutes = Math.round((Date.now() - new Date(date)) / 60000);
  if (minutes < 2) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes}m ago`;
  if (minutes < 60 * 24) return `Updated ${Math.round(minutes / 60)}h ago`;
  return `Updated ${Math.round(minutes / (60 * 24))}d ago`;
};

const wordCount = (html) => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
};

const withTransition = async (fn) => {
  if (!document.startViewTransition) return fn();
  return document.startViewTransition(fn).finished.catch(() => {});
};

function setSaveState(mode, label) {
  const el = $("save-status");
  el.className = `save-status is-${mode}`;
  el.querySelector(".save-label").textContent = label;
}

function setGreeting() {
  const hour = new Date().getHours();
  const label = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  $("greeting").textContent = label;
  $("brand-tagline").textContent = `${label.split(" ")[1]} desk`;
}

function bumpRhythm() {
  state.rhythm = Math.min(100, state.rhythm + 16);
  $("rhythm-fill").style.width = `${state.rhythm}%`;
  clearTimeout(bumpRhythm.timer);
  bumpRhythm.timer = setTimeout(() => {
    state.rhythm = Math.max(8, state.rhythm - 20);
    $("rhythm-fill").style.width = `${state.rhythm}%`;
  }, 850);
}

function pushEnergy(words) {
  const next = Math.max(8, Math.min(48, Math.round(words / 4) + 10 + Math.random() * 8));
  state.energyHistory = [...state.energyHistory.slice(-11), next];
  renderSparkline();
}

function renderSparkline() {
  const svg = $("sparkline");
  const values = state.energyHistory;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const w = 160;
  const h = 36;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 6) - 3;
    return [x, y];
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  svg.innerHTML = `
    <defs>
      <linearGradient id="spark-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0e8a76"/>
        <stop offset="55%" stop-color="#3479a3"/>
        <stop offset="100%" stop-color="#e06b4a"/>
      </linearGradient>
      <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0e8a76" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#0e8a76" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path class="spark-area" d="${area}"></path>
    <path d="${line}"></path>
  `;
}

function renderStats() {
  const owned = state.documents.filter((doc) => doc.ownerId === state.user.id).length;
  const shared = state.documents.filter((doc) => doc.ownerId !== state.user.id).length;
  const total = owned + shared || 1;
  $("stat-total").textContent = String(owned + shared);
  $("stat-owned").textContent = String(owned);
  $("stat-shared").textContent = String(shared);
  $("stat-ratio").textContent = `${Math.round((owned / total) * 100)}%`;
  $("bar-owned").style.width = `${(owned / total) * 100}%`;
  $("bar-shared").style.width = `${(shared / total) * 100}%`;

  const ownedLen = (owned / total) * CIRC;
  const sharedLen = (shared / total) * CIRC;
  const ownedRing = $("ring-owned");
  const sharedRing = $("ring-shared");
  ownedRing.style.strokeDasharray = `${ownedLen} ${CIRC}`;
  ownedRing.style.strokeDashoffset = "0";
  sharedRing.style.strokeDasharray = `${sharedLen} ${CIRC}`;
  sharedRing.style.strokeDashoffset = `${-ownedLen}`;
}

function heatClass(updatedAt) {
  const hours = (Date.now() - new Date(updatedAt)) / 3600000;
  if (hours < 1) return "hot";
  if (hours < 24) return "warm";
  return "cool";
}

function listItem(doc, index) {
  const owned = doc.ownerId === state.user.id;
  return `<button type="button" class="document-item ${doc.id === state.activeId ? "active" : ""}" data-id="${doc.id}" style="animation-delay:${0.04 + index * 0.05}s">
    <span class="doc-icon" aria-hidden="true">${owned ? "▤" : "⇄"}</span>
    <span class="doc-copy">
      <strong>${escapeHtml(doc.title)}</strong>
      <small>${owned ? "Owned by you" : `Shared by ${escapeHtml(doc.owner.name.split(" ")[0])}`}</small>
    </span>
    <span class="doc-heat ${heatClass(doc.updatedAt)}" title="Recent activity"></span>
  </button>`;
}

function renderList() {
  const owned = state.documents.filter((doc) => doc.ownerId === state.user.id);
  const shared = state.documents.filter((doc) => doc.ownerId !== state.user.id);

  $("owned-list").innerHTML = owned.length
    ? owned.map((doc, i) => listItem(doc, i)).join("")
    : `<div class="empty-list">No owned documents yet.</div>`;

  $("shared-list-nav").innerHTML = shared.length
    ? shared.map((doc, i) => listItem(doc, i)).join("")
    : `<div class="empty-list">Nothing shared with you yet.</div>`;

  document.querySelectorAll(".document-item").forEach((item) => {
    item.addEventListener("click", () => openDocument(item.dataset.id));
  });

  renderStats();
}

function renderPresence(doc) {
  const people = [doc.owner, ...(doc.sharedUsers || [])].filter(Boolean);
  $("presence").innerHTML = people
    .slice(0, 4)
    .map(
      (user, i) =>
        `<span class="presence-avatar" title="${escapeHtml(user.name)}" style="background:${user.color}22;color:${user.color};animation-delay:${i * 0.05}s">${escapeHtml(user.initials)}</span>`
    )
    .join("");
}

function updateWordCount(html) {
  const count = wordCount(html);
  $("word-count").textContent = `${count} word${count === 1 ? "" : "s"}`;
  $("read-time").textContent = `${Math.max(1, Math.ceil(count / 200))} min read`;
  return count;
}

function updateProgress() {
  const editor = $("editor");
  const stage = $("paper-stage");
  if (!editor || !stage) return;
  const text = editor.innerText || "";
  const ratio = Math.min(100, (text.length / 1200) * 100);
  $("progress").style.width = `${Math.max(4, ratio)}%`;
}

function renderEditor(doc) {
  $("empty-state").classList.add("hidden");
  $("editor-view").classList.remove("hidden");

  $("title-input").value = doc.title;
  $("breadcrumb-title").textContent = doc.title;
  $("editor").innerHTML = doc.content;

  const owned = doc.ownerId === state.user.id;
  $("owner-badge").textContent = owned ? "Owned by you" : `Shared by ${doc.owner.name}`;
  $("owner-badge").classList.toggle("shared", !owned);
  $("updated-label").textContent = relativeDate(doc.updatedAt);
  updateWordCount(doc.content);
  updateProgress();
  renderPresence(doc);
  syncToolbarState();

  $("avatar").textContent = state.user.initials;
  $("avatar").style.background = `${state.user.color}22`;
  $("avatar").style.color = state.user.color;
  $("share-button").disabled = !owned;
  $("share-button").title = owned ? "Share with a teammate" : "Only the owner can manage sharing";
}

async function openDocument(id) {
  if (!id) {
    state.activeId = null;
    $("editor-view").classList.add("hidden");
    $("empty-state").classList.remove("hidden");
    renderList();
    return;
  }

  try {
    state.activeId = id;
    const doc = await api(`/api/documents/${id}`);
    await withTransition(() => {
      renderList();
      renderEditor(doc);
    });
  } catch (error) {
    showToast(error.message);
  }
}

async function refreshDocuments(selectFirst = false) {
  state.documents = await api("/api/documents");
  renderList();

  if (!state.documents.length) {
    await openDocument(null);
    return;
  }

  if (selectFirst || !state.activeId) {
    await openDocument(state.documents[0].id);
  } else if (state.documents.some((doc) => doc.id === state.activeId)) {
    await openDocument(state.activeId);
  } else {
    await openDocument(state.documents[0].id);
  }
}

async function save() {
  if (!state.activeId) return;
  setSaveState("saving", "Saving…");

  try {
    const content = $("editor").innerHTML;
    const doc = await api(`/api/documents/${state.activeId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: $("title-input").value,
        content
      })
    });
    setSaveState("saved", "Saved");
    $("breadcrumb-title").textContent = doc.title;
    $("updated-label").textContent = "Updated just now";
    const words = updateWordCount(content);
    pushEnergy(words);
    updateProgress();
    const local = state.documents.find((item) => item.id === doc.id);
    if (local) {
      local.title = doc.title;
      local.content = doc.content;
      local.updatedAt = doc.updatedAt;
    }
    renderList();
  } catch (error) {
    setSaveState("error", "Could not save");
    showToast(error.message);
  }
}

function scheduleSave() {
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(save, 650);
  setSaveState("dirty", "Unsaved changes");
  bumpRhythm();
  updateWordCount($("editor").innerHTML);
  updateProgress();
  syncToolbarState();
}

async function createDocument() {
  try {
    const doc = await api("/api/documents", {
      method: "POST",
      body: JSON.stringify({ title: "Untitled document", content: "<p>Start writing...</p>" })
    });
    state.activeId = doc.id;
    await refreshDocuments();
    $("title-input").focus();
    $("title-input").select();
    showToast("New document ready");
  } catch (error) {
    showToast(error.message);
  }
}

async function importFile(file) {
  if (!file) return;
  try {
    const content = await file.text();
    const doc = await api("/api/import", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, content })
    });
    state.activeId = doc.id;
    await refreshDocuments();
    showToast("Imported as a new document");
    burst();
  } catch (error) {
    showToast(error.message);
  } finally {
    $("file-input").value = "";
  }
}

function renderShared(doc) {
  $("shared-list").innerHTML = doc.sharedUsers?.length
    ? `<strong>Already shared with</strong>${doc.sharedUsers
        .map((user) => `<div><span>${escapeHtml(user.name)}</span><span>${escapeHtml(user.email)}</span></div>`)
        .join("")}`
    : "No teammates have access yet.";
}

async function openShare() {
  const doc = state.documents.find((item) => item.id === state.activeId);
  if (!doc) return;
  if (doc.ownerId !== state.user.id) {
    showToast("Only the document owner can manage sharing");
    return;
  }

  const sharedIds = new Set(doc.sharedWith || []);
  const candidates = state.users.filter((user) => user.id !== state.user.id && !sharedIds.has(user.id));

  $("share-user").innerHTML = candidates.length
    ? candidates.map((user) => `<option value="${user.id}">${escapeHtml(user.name)} · ${escapeHtml(user.email)}</option>`).join("")
    : `<option value="">No teammates available</option>`;

  renderShared(doc);
  $("share-modal").classList.remove("hidden");
}

function closeShare() {
  $("share-modal").classList.add("hidden");
}

function burst() {
  const host = $("burst");
  const colors = ["#16b89d", "#3479a3", "#e06b4a", "#0a6a5b", "#8eb8d4"];
  host.innerHTML = "";
  for (let i = 0; i < 18; i += 1) {
    const bit = document.createElement("i");
    const angle = (Math.PI * 2 * i) / 18;
    const dist = 60 + Math.random() * 120;
    bit.style.left = "50%";
    bit.style.top = "42%";
    bit.style.background = colors[i % colors.length];
    bit.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    bit.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    host.appendChild(bit);
  }
  setTimeout(() => {
    host.innerHTML = "";
  }, 900);
}

async function exportMarkdown() {
  if (!state.activeId) return;
  try {
    // Persist latest edits first so export matches the editor.
    await save();
    const response = await fetch(`/api/documents/${state.activeId}/export/markdown`, {
      headers: { "x-user-id": state.user?.id || "ada" }
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "Export failed");
    }
    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] || "document.md";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}`);
  } catch (error) {
    showToast(error.message);
  }
}

async function share() {
  const userId = $("share-user").value;
  if (!userId) return;

  try {
    const doc = await api(`/api/documents/${state.activeId}/share`, {
      method: "POST",
      body: JSON.stringify({ userId })
    });
    state.documents = state.documents.map((item) => (item.id === doc.id ? doc : item));
    renderShared(doc);
    renderPresence(doc);
    openShare();
    burst();
    showToast(`Shared with ${doc.sharedUsers.find((user) => user.id === userId)?.name || "teammate"}`);
  } catch (error) {
    showToast(error.message);
  }
}

function syncToolbarState() {
  document.querySelectorAll("[data-command]").forEach((button) => {
    const command = button.dataset.command;
    if (["bold", "italic", "underline"].includes(command)) {
      button.classList.toggle("is-active", document.queryCommandState(command));
    }
  });
}

function toggleFocus() {
  state.focus = !state.focus;
  document.body.classList.toggle("is-focus", state.focus);
  $("focus-toggle").textContent = state.focus ? "Exit focus" : "Focus";
  $("footer-hint").textContent = state.focus ? "Focus mode on · press Focus to exit" : "Supported import: .txt, .md";
}

/* Subtle ink trail on ambient canvas */
function initInkTrail() {
  const canvas = $("ink-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const points = [];
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("pointermove", (event) => {
    points.push({ x: event.clientX, y: event.clientY, life: 1 });
    if (points.length > 40) points.shift();
  });

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      b.life *= 0.96;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(14, 138, 118, ${0.12 * b.life})`;
      ctx.lineWidth = 2.2 * b.life;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  };
  draw();
}

function setupDropzone() {
  const zone = $("dropzone");
  const onDrag = (active) => () => zone.classList.toggle("is-active", active);
  ["dragenter", "dragover"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      onDrag(true)();
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      onDrag(false)();
    });
  });
  zone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) importFile(file);
  });
  zone.addEventListener("click", () => $("file-input").click());

  document.body.addEventListener("dragover", (event) => event.preventDefault());
  document.body.addEventListener("drop", (event) => {
    if (event.target.closest(".dropzone")) return;
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) importFile(file);
  });
}

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    $("editor").focus();
    document.execCommand(button.dataset.command, false, button.dataset.value || null);
    scheduleSave();
  });
});

$("block-format").addEventListener("change", (event) => {
  $("editor").focus();
  document.execCommand("formatBlock", false, event.target.value);
  scheduleSave();
});

$("title-input").addEventListener("input", scheduleSave);
$("editor").addEventListener("input", scheduleSave);
$("editor").addEventListener("keyup", syncToolbarState);
$("editor").addEventListener("mouseup", syncToolbarState);
$("new-document").addEventListener("click", createDocument);
$("empty-new")?.addEventListener("click", createDocument);
$("empty-import")?.addEventListener("click", () => $("file-input").click());
$("import-button").addEventListener("click", () => $("file-input").click());
$("file-input").addEventListener("change", (event) => importFile(event.target.files[0]));
$("export-button").addEventListener("click", exportMarkdown);
$("share-button").addEventListener("click", openShare);
$("close-modal").addEventListener("click", closeShare);
$("confirm-share").addEventListener("click", share);
$("focus-toggle").addEventListener("click", toggleFocus);
$("share-modal").addEventListener("click", (event) => {
  if (event.target === $("share-modal")) closeShare();
});

$("user-select").addEventListener("change", async (event) => {
  const user = state.users.find((item) => item.id === event.target.value);
  if (!user) return;
  state.user = user;
  localStorage.setItem("ajaia-user", user.id);
  state.activeId = null;
  await refreshDocuments(true);
  showToast(`Now viewing as ${user.name.split(" ")[0]}`);
});

document.addEventListener("keydown", (event) => {
  const meta = event.metaKey || event.ctrlKey;
  if (meta && event.key.toLowerCase() === "s") {
    event.preventDefault();
    save();
  }
  if (meta && event.key.toLowerCase() === "b") {
    event.preventDefault();
    document.execCommand("bold");
    scheduleSave();
  }
  if (event.key === "Escape") {
    closeShare();
    if (state.focus) toggleFocus();
  }
});

async function init() {
  setGreeting();
  state.users = await api("/api/users");
  const preferred = localStorage.getItem("ajaia-user");
  state.user = state.users.find((user) => user.id === preferred) || state.users[0];

  $("user-select").innerHTML = state.users
    .map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`)
    .join("");
  $("user-select").value = state.user.id;

  renderSparkline();
  setupDropzone();
  initInkTrail();
  await refreshDocuments(true);
}

init().catch((error) => showToast(error.message));
