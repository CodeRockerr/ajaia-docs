const state = {
  user: null,
  documents: [],
  activeId: null,
  saveTimer: null,
  users: []
};

const $ = (id) => document.getElementById(id);

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

function listItem(doc) {
  const owned = doc.ownerId === state.user.id;
  return `<button type="button" class="document-item ${doc.id === state.activeId ? "active" : ""}" data-id="${doc.id}">
    <span class="doc-icon" aria-hidden="true">${owned ? "▤" : "⇄"}</span>
    <span class="doc-copy">
      <strong>${escapeHtml(doc.title)}</strong>
      <small>${owned ? "Owned by you" : `Shared by ${escapeHtml(doc.owner.name.split(" ")[0])}`}</small>
    </span>
  </button>`;
}

function renderList() {
  const owned = state.documents.filter((doc) => doc.ownerId === state.user.id);
  const shared = state.documents.filter((doc) => doc.ownerId !== state.user.id);

  $("owned-list").innerHTML = owned.length
    ? owned.map(listItem).join("")
    : `<div class="empty-list">No owned documents yet.</div>`;

  $("shared-list-nav").innerHTML = shared.length
    ? shared.map(listItem).join("")
    : `<div class="empty-list">Nothing shared with you yet.</div>`;

  document.querySelectorAll(".document-item").forEach((item) => {
    item.addEventListener("click", () => openDocument(item.dataset.id));
  });
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
    renderList();
    renderEditor(doc);
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
  $("save-status").textContent = "Saving…";
  $("save-status").style.color = "var(--warn)";

  try {
    const doc = await api(`/api/documents/${state.activeId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: $("title-input").value,
        content: $("editor").innerHTML
      })
    });
    $("save-status").textContent = "Saved";
    $("save-status").style.color = "var(--ok)";
    $("breadcrumb-title").textContent = doc.title;
    $("updated-label").textContent = "Updated just now";
    const local = state.documents.find((item) => item.id === doc.id);
    if (local) {
      local.title = doc.title;
      local.content = doc.content;
      local.updatedAt = doc.updatedAt;
    }
    renderList();
  } catch (error) {
    $("save-status").textContent = "Could not save";
    $("save-status").style.color = "var(--danger)";
    showToast(error.message);
  }
}

function scheduleSave() {
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(save, 650);
  $("save-status").textContent = "Unsaved changes";
  $("save-status").style.color = "var(--warn)";
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
    openShare();
    showToast(`Shared with ${doc.sharedUsers.find((user) => user.id === userId)?.name || "teammate"}`);
  } catch (error) {
    showToast(error.message);
  }
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
$("new-document").addEventListener("click", createDocument);
$("import-button").addEventListener("click", () => $("file-input").click());
$("file-input").addEventListener("change", (event) => importFile(event.target.files[0]));
$("share-button").addEventListener("click", openShare);
$("close-modal").addEventListener("click", () => $("share-modal").classList.add("hidden"));
$("confirm-share").addEventListener("click", share);
$("share-modal").addEventListener("click", (event) => {
  if (event.target === $("share-modal")) $("share-modal").classList.add("hidden");
});

$("user-select").addEventListener("change", async (event) => {
  const user = state.users.find((item) => item.id === event.target.value);
  if (!user) return;
  state.user = user;
  localStorage.setItem("ajaia-user", user.id);
  state.activeId = null;
  await refreshDocuments(true);
});

async function init() {
  state.users = await api("/api/users");
  const preferred = localStorage.getItem("ajaia-user");
  state.user = state.users.find((user) => user.id === preferred) || state.users[0];

  $("user-select").innerHTML = state.users
    .map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`)
    .join("");
  $("user-select").value = state.user.id;

  await refreshDocuments(true);
}

init().catch((error) => showToast(error.message));
