const path = require("path");
const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const webpush = require("web-push");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const vapidKeys = {
  publicKey: "BJk84sc_h4ytpzjLwzuGveTG1DPPl4d9EQdsXr94UrZziXnZjjXu64MWwk66yoFBP76p4_zXKBQCvVdwq_0_ZS8",
  privateKey: "vUS5qyBwTO7u-hXfBP4B1LLwMu9-3pA4swgU_GQE9C4",
};

webpush.setVapidDetails("mailto:example@example.com", vapidKeys.publicKey, vapidKeys.privateKey);

let subscriptions = [];
const scheduledNotifications = new Map(); // Для отслеживания отложенных уведомлений

// Проверить наличие сертификатов HTTPS
const certPath = path.join(__dirname, "localhost.pem");
const keyPath = path.join(__dirname, "localhost-key.pem");
const useHttps = fs.existsSync(certPath) && fs.existsSync(keyPath);

const server = useHttps
  ? https.createServer(
      {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      },
      app
    )
  : http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

io.on("connection", (socket) => {
  console.log(`✅ WebSocket подключение: ${socket.id}`);
  
  socket.on("newTask", (task) => {
    console.log(`📝 Новая задача: ${task.text}`);
    io.emit("taskAdded", task);
    
    // Отправить пуш-уведомление
    const payload = JSON.stringify({ 
      title: "Новая задача", 
      body: task.text,
      icon: "/icons/favicon-128x128.png",
      badge: "/icons/favicon-32x32.png",
      id: Date.now(),
      actions: [
        { action: "snooze-5", title: "⏰ 5 мин" },
        { action: "snooze-10", title: "⏰ 10 мин" },
        { action: "snooze-15", title: "⏰ 15 мин" },
        { action: "open", title: "✓ Открыть" }
      ]
    });
    
    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch((error) => {
        console.log(`⚠️  Ошибка отправки пуша для ${sub.endpoint}: ${error.statusCode}`);
        // Удалить неработающую подписку
        if (error.statusCode === 410) {
          subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
        }
      });
    });
    
    console.log(`📢 Отправлено ${subscriptions.length} пуш-уведомлений`);
  });
});

app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  console.log(`✅ Новая подписка: ${subscription.endpoint.substring(0, 50)}...`);
  
  // Удалить дубликат если существует
  subscriptions = subscriptions.filter((s) => s.endpoint !== subscription.endpoint);
  subscriptions.push(subscription);
  
  console.log(`📊 Всего подписок: ${subscriptions.length}`);
  res.status(201).json({ message: "Подписка создана успешно" });
});

app.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  console.log(`❌ Отписка: ${endpoint.substring(0, 50)}...`);
  
  subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
  
  console.log(`📊 Всего подписок: ${subscriptions.length}`);
  res.status(200).json({ message: "Отписка выполнена успешно" });
});

// Endpoint для откладывания уведомлений
app.post("/schedule-push", (req, res) => {
  const { text, delay, id } = req.body;
  
  if (!text || !delay) {
    return res.status(400).json({ success: false, message: "Необходимо указать text и delay" });
  }
  
  const minutes = delay / 60000;
  console.log(`⏰ Уведомление отложено на ${minutes} минут: "${text}"`);
  
  // Отмена предыдущего таймера если существует
  if (scheduledNotifications.has(id)) {
    clearTimeout(scheduledNotifications.get(id));
  }
  
  // Установить новый таймер
  const timeoutId = setTimeout(() => {
    console.log(`⏰ Отправка отложенного уведомления через ${minutes} минут`);
    
    const payload = JSON.stringify({ 
      title: "⏰ Напоминание задачи",
      body: text,
      icon: "/icons/favicon-128x128.png",
      badge: "/icons/favicon-32x32.png",
      id: id + "-snooze",
      actions: [
        { action: "snooze-5", title: "⏰ 5 мин" },
        { action: "snooze-10", title: "⏰ 10 мин" },
        { action: "snooze-15", title: "⏰ 15 мин" },
        { action: "open", title: "✓ Открыть" }
      ]
    });
    
    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch((error) => {
        console.log(`⚠️  Ошибка отправки отложенного пуша: ${error.statusCode}`);
        if (error.statusCode === 410) {
          subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
        }
      });
    });
    
    // Удалить из памяти
    scheduledNotifications.delete(id);
  }, delay);
  
  scheduledNotifications.set(id, timeoutId);
  
  res.status(200).json({ 
    success: true, 
    message: `Уведомление отложено на ${minutes} минут`,
    scheduledIn: `${minutes} мин`
  });
});

// Отладочный endpoint для проверки количества подписок
app.get("/api/subscriptions-count", (req, res) => {
  res.json({ 
    count: subscriptions.length, 
    scheduled: scheduledNotifications.size,
    vapidPublicKey: vapidKeys.publicKey 
  });
});

const protocol = useHttps ? "https" : "http";
server.listen(3001, () => {
  console.log("\n🚀 Сервер запущен на " + protocol + "://localhost:3001");
  console.log("📚 Push Service запущен с VAPID ключами\n");
  
  if (!useHttps) {
    console.log("⚠️  Используется HTTP. Для production используйте HTTPS.");
    console.log("    Для локального HTTPS установите mkcert:");
    console.log("    choco install mkcert");
    console.log("    mkcert -install");
    console.log("    mkcert localhost");
    console.log("");
  } else {
    console.log("✅ Используется HTTPS с доверенным сертификатом (mkcert)\n");
  }
});
