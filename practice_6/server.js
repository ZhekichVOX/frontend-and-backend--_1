import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Хранилище пользователей
const users = new Map();
const messages = [];

// API для получения истории сообщений
app.get('/api/messages', (req, res) => {
  res.json(messages.slice(-50)); // Последние 50 сообщений
});

app.get('/api/users', (req, res) => {
  res.json(Array.from(users.values()));
});

// WebSocket событие подключения
io.on('connection', (socket) => {
  console.log(`✅ Пользователь подключился: ${socket.id}`);

  // Присоединение пользователя
  socket.on('join', (username, callback) => {
    if (!username || username.trim() === '') {
      callback({ success: false, message: 'Имя не может быть пустым' });
      return;
    }

    // Проверка дубликатов имён
    for (let user of users.values()) {
      if (user.username === username) {
        callback({ success: false, message: 'Это имя уже занято' });
        return;
      }
    }

    users.set(socket.id, {
      id: socket.id,
      username,
      joinedAt: new Date(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=667eea&color=fff`
    });

    socket.broadcast.emit('user:joined', {
      user: users.get(socket.id),
      message: `${username} присоединился к чату`
    });

    io.emit('users:update', Array.from(users.values()));
    callback({ success: true, message: 'Добро пожаловать!' });
  });

  // Отправка сообщения
  socket.on('message:send', (data, callback) => {
    const user = users.get(socket.id);
    if (!user) {
      callback({ success: false, message: 'Пользователь не найден' });
      return;
    }

    if (!data.text || data.text.trim() === '') {
      callback({ success: false, message: 'Сообщение не может быть пустым' });
      return;
    }

    const message = {
      id: Date.now(),
      userId: socket.id,
      username: user.username,
      avatar: user.avatar,
      text: data.text.trim(),
      timestamp: new Date(),
      reactions: {}
    };

    messages.push(message);
    
    // Ограничить историю до 100 сообщений
    if (messages.length > 100) {
      messages.shift();
    }

    io.emit('message:received', message);
    callback({ success: true, message });
  });

  // Печатание
  socket.on('typing', ({ username }) => {
    socket.broadcast.emit('user:typing', { username });
  });

  socket.on('stopped:typing', () => {
    socket.broadcast.emit('user:stopped-typing');
  });

  // Реакция на сообщение
  socket.on('message:react', (data) => {
    const message = messages.find(m => m.id === data.messageId);
    if (message) {
      const userId = socket.id;
      if (!message.reactions[data.emoji]) {
        message.reactions[data.emoji] = [];
      }
      
      const index = message.reactions[data.emoji].indexOf(userId);
      if (index > -1) {
        message.reactions[data.emoji].splice(index, 1);
      } else {
        message.reactions[data.emoji].push(userId);
      }

      io.emit('message:reactions', {
        messageId: data.messageId,
        reactions: message.reactions
      });
    }
  });

  // Удаление сообщения
  socket.on('message:delete', (messageId, callback) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > -1 && messages[messageIndex].userId === socket.id) {
      messages.splice(messageIndex, 1);
      io.emit('message:deleted', messageId);
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Вы не можете удалить это сообщение' });
    }
  });

  // Отключение пользователя
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      console.log(`❌ Пользователь отключился: ${user.username}`);
      io.emit('user:left', {
        user,
        message: `${user.username} покинул чат`
      });
      io.emit('users:update', Array.from(users.values()));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n💬 Chat Server запущен на http://localhost:${PORT}`);
  console.log(`WebSocket подключение доступно\n`);
});
