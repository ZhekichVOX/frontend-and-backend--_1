const socket = io("http://localhost:3001");

const contentDiv = document.getElementById("app-content");
const homeBtn = document.getElementById("home-btn");
const aboutBtn = document.getElementById("about-btn");

function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach((btn) => btn.classList.remove("active"));
  document.getElementById(activeId).classList.add("active");
}

async function loadContent(page) {
  const response = await fetch(`/content/${page}.html`);
  const html = await response.text();
  contentDiv.innerHTML = html;
  if (page === "home") initNotes();
}

homeBtn.addEventListener("click", () => {
  setActiveButton("home-btn");
  loadContent("home");
});

aboutBtn.addEventListener("click", () => {
  setActiveButton("about-btn");
  loadContent("about");
});

function showToast(text) {
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText = "position:fixed;top:10px;right:10px;background:#4285f4;color:#fff;padding:12px;border-radius:8px;z-index:9999;";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function initNotes() {
  const form = document.getElementById("note-form");
  const input = document.getElementById("note-input");
  const list = document.getElementById("notes-list");

  const loadNotes = () => {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    list.innerHTML = notes
      .map(
        (n) => `
          <li class="card row" style="align-items:center; gap:8px;">
            <span class="col-9">${n.text}</span>
            <button class="col-3 button error" type="button" data-delete-id="${n.id}">Удалить</button>
          </li>
        `
      )
      .join("");
  };

  const addNote = (text) => {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    const note = { id: Date.now(), text };
    notes.push(note);
    localStorage.setItem("notes", JSON.stringify(notes));
    loadNotes();
    socket.emit("newTask", { text, timestamp: Date.now() });
  };

  const deleteNote = (id) => {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    const nextNotes = notes.filter((n) => n.id !== id);
    localStorage.setItem("notes", JSON.stringify(nextNotes));
    loadNotes();
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addNote(text);
    input.value = "";
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete-id]");
    if (!btn) return;
    const id = Number(btn.dataset.deleteId);
    if (Number.isNaN(id)) return;
    deleteNote(id);
  });

  loadNotes();
}

socket.on("taskAdded", (task) => {
  showToast(`Новая задача: ${task.text}`);
});

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const vapidKey = "BJk84sc_h4ytpzjLwzuGveTG1DPPl4d9EQdsXr94UrZziXnZjjXu64MWwk66yoFBP76p4_zXKBQCvVdwq_0_ZS8";
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
  await fetch("http://localhost:3001/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
}

async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await fetch("http://localhost:3001/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    await navigator.serviceWorker.register("/sw.js");
    const enableBtn = document.getElementById("enable-push");
    const disableBtn = document.getElementById("disable-push");
    const reg = await navigator.serviceWorker.ready;
    const current = await reg.pushManager.getSubscription();
    if (current) {
      enableBtn.style.display = "none";
      disableBtn.style.display = "inline-block";
    }

    enableBtn.addEventListener("click", async () => {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }
      await subscribeToPush();
      enableBtn.style.display = "none";
      disableBtn.style.display = "inline-block";
    });

    disableBtn.addEventListener("click", async () => {
      await unsubscribeFromPush();
      disableBtn.style.display = "none";
      enableBtn.style.display = "inline-block";
    });
  });
}

loadContent("home");
