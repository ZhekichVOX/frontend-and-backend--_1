const CACHE_NAME = "app-shell-v3";
const DYNAMIC_CACHE_NAME = "dynamic-content-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/manifest.json",
  "/content/home.html",
  "/content/about.html",
  "/icons/favicon-16x16.png",
  "/icons/favicon-32x32.png",
  "/icons/favicon-128x128.png",
  "/icons/favicon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== DYNAMIC_CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.startsWith("/content/")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/content/home.html")))
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

self.addEventListener("push", (event) => {
  console.log("🔔 Push событие получено", event);
  
  let data = { 
    title: "Новая задача", 
    body: "Добавлена новая задача",
    icon: "/icons/favicon-128x128.png",
    badge: "/icons/favicon-32x32.png",
    id: Date.now()
  };
  
  try {
    if (event.data) {
      data = event.data.json();
      if (!data.id) data.id = Date.now();
    }
  } catch (error) {
    console.error("❌ Ошибка парсинга push данных:", error);
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icons/favicon-128x128.png",
      badge: data.badge || "/icons/favicon-32x32.png",
      tag: "new-task-notification",
      requireInteraction: false,
      data: { taskText: data.body, id: data.id },
      actions: [
        { action: "snooze-5", title: "⏰ 5 мин" },
        { action: "snooze-10", title: "⏰ 10 мин" },
        { action: "snooze-15", title: "⏰ 15 мин" },
        { action: "open", title: "✓ Открыть" }
      ]
    }).then(() => {
      console.log("✅ Уведомление показано успешно");
    }).catch((error) => {
      console.error("❌ Ошибка показа уведомления:", error);
    })
  );
});

// Обработка действий уведомления
self.addEventListener("notificationclick", (event) => {
  const { action, notification } = event;
  const { taskText, id } = notification.data || {};

  if (action === "snooze-5") {
    console.log("⏰ Отложено на 5 минут");
    handleSnooze(taskText, 5 * 60 * 1000, id);
    notification.close();
  } else if (action === "snooze-10") {
    console.log("⏰ Отложено на 10 минут");
    handleSnooze(taskText, 10 * 60 * 1000, id);
    notification.close();
  } else if (action === "snooze-15") {
    console.log("⏰ Отложено на 15 минут");
    handleSnooze(taskText, 15 * 60 * 1000, id);
    notification.close();
  } else if (action === "open") {
    notification.close();
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow("/");
      })
    );
  } else {
    notification.close();
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow("/");
      })
    );
  }
});

// Обработка действия отложения
async function handleSnooze(taskText, delayMs, taskId) {
  try {
    const response = await fetch("/schedule-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: taskText,
        delay: delayMs,
        id: taskId
      })
    });
    
    if (response.ok) {
      console.log(`✅ Уведомление отложено на ${delayMs / 60000} минут`);
    }
  } catch (error) {
    console.error("❌ Ошибка откладывания:", error);
  }
}
