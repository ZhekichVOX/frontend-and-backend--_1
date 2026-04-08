const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const webpush = require("web-push");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const vapidKeys = {
  publicKey: "BJk84sc_h4ytpzjLwzuGveTG1DPPl4d9EQdsXr94UrZziXnZjjXu64MWwk66yoFBP76p4_zXKBQCvVdwq_0_ZS8",
  privateKey: "vUS5qyBwTO7u-hXfBP4B1LLwMu9-3pA4swgU_GQE9C4",
};

webpush.setVapidDetails("mailto:example@example.com", vapidKeys.publicKey, vapidKeys.privateKey);

let subscriptions = [];
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

io.on("connection", (socket) => {
  socket.on("newTask", (task) => {
    io.emit("taskAdded", task);
    const payload = JSON.stringify({ title: "Новая задача", body: task.text });
    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch(() => {});
    });
  });
});

app.post("/subscribe", (req, res) => {
  subscriptions = [...subscriptions.filter((s) => s.endpoint !== req.body.endpoint), req.body];
  res.status(201).json({ message: "ok" });
});

app.post("/unsubscribe", (req, res) => {
  subscriptions = subscriptions.filter((s) => s.endpoint !== req.body.endpoint);
  res.status(200).json({ message: "ok" });
});

server.listen(3001, () => {
  console.log("Server started on http://localhost:3001");
});
