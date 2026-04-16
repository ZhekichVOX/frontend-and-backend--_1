// Определить правильный протокол (http или https)
const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
const host = window.location.host;
const socket = io(`${protocol}://${host}`);

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

function showToast(text, duration = 3000) {
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText = "position:fixed;top:10px;right:10px;background:#4285f4;color:#fff;padding:12px 16px;border-radius:8px;z-index:9999;font-size:14px;max-width:300px;word-wrap:break-word;";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// Улучшенная функция для показа уведомления об отложении
function showSnoozeNotification(minutes) {
  const el = document.createElement("div");
  el.innerHTML = `<div style="display:flex;align-items:center;gap:8px;">
    <span>⏰ Напоминание отложено на <strong>${minutes}</strong> ${minutes === 1 ? "минуту" : "минут"}</span>
  </div>`;
  el.style.cssText = "position:fixed;top:10px;right:10px;background:#ff9800;color:#fff;padding:12px 16px;border-radius:8px;z-index:9999;font-size:14px;max-width:350px;word-wrap:break-word;";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
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
  try {
    const registration = await navigator.serviceWorker.ready;
    const vapidKey = "BJk84sc_h4ytpzjLwzuGveTG1DPPl4d9EQdsXr94UrZziXnZjjXu64MWwk66yoFBP76p4_zXKBQCvVdwq_0_ZS8";
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    
    const res = await fetch("/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    
    if (!res.ok) throw new Error("Процедура подписки ошибка");
    console.log("✅ Успешно подписались на пуш-уведомления");
    showToast("✅ Уведомления включены");
  } catch (error) {
    console.error("❌ Ошибка подписки:", error);
    showToast("❌ Не удалось включить уведомления");
    throw error;
  }
}

async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    
    await fetch("/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    
    await subscription.unsubscribe();
    console.log("✅ Отписались от пуш-уведомлений");
    showToast("✅ Уведомления отключены");
  } catch (error) {
    console.error("❌ Ошибка отписки:", error);
    showToast("❌ Не удалось отключить уведомления");
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ Service Worker зарегистрирован:", reg.scope);
      
      const enableBtn = document.getElementById("enable-push");
      const disableBtn = document.getElementById("disable-push");
      const pushReg = await navigator.serviceWorker.ready;
      const currentSubscription = await pushReg.pushManager.getSubscription();
      
      if (currentSubscription) {
        console.log("✅ Текущая подписка:", currentSubscription.endpoint.substring(0, 50) + "...");
        enableBtn.style.display = "none";
        disableBtn.style.display = "inline-block";
      } else {
        console.log("❌ Подписки не найдено");
      }

      enableBtn.addEventListener("click", async () => {
        try {
          if (Notification.permission === "default") {
            console.log("📢 Запрашиваем разрешение на уведомления...");
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
              console.log("❌ Разрешение отказано");
              showToast("❌ Разрешение на уведомления отказано");
              return;
            }
          }
          console.log("🔔 Подписываемся на push-уведомления...");
          await subscribeToPush();
          enableBtn.style.display = "none";
          disableBtn.style.display = "inline-block";
        } catch (error) {
          console.error("❌ Ошибка при включении уведомлений:", error);
        }
      });

      disableBtn.addEventListener("click", async () => {
        try {
          console.log("🔕 Отписываемся от push-уведомлений...");
          await unsubscribeFromPush();
          disableBtn.style.display = "none";
          enableBtn.style.display = "inline-block";
        } catch (error) {
          console.error("❌ Ошибка при отключении уведомлений:", error);
        }
      });
    } catch (error) {
      console.error("❌ Ошибка регистрации Service Worker:", error);
    }
  });
} else {
  console.log("⚠️  Service Workers не поддерживаются в этом браузере");
}

loadContent("home");
