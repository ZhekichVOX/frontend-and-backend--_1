class ChatApp {
    constructor() {
        this.socket = io();
        this.currentUser = null;
        this.users = new Map();
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('messageInput').addEventListener('input', () => {
            if (this.currentUser) {
                this.socket.emit('typing', { username: this.currentUser.username });
            }
        });

        document.getElementById('messageInput').addEventListener('blur', () => {
            this.socket.emit('stopped:typing');
        });
    }

    setupSocketListeners() {
        // Получение истории сообщений при подключении
        this.socket.on('connect', async () => {
            try {
                const response = await fetch('/api/messages');
                const messages = await response.json();
                messages.forEach(msg => this.addMessageToUI(msg));
            } catch (error) {
                console.error('Ошибка при загрузке истории:', error);
            }
        });

        // Получение новых сообщений
        this.socket.on('message:received', (message) => {
            this.addMessageToUI(message);
        });

        // Обновление списка пользователей
        this.socket.on('users:update', (users) => {
            this.updateUsersList(users);
        });

        // Пользователь присоединился
        this.socket.on('user:joined', (data) => {
            this.addSystemMessage(data.message);
        });

        // Пользователь ушел
        this.socket.on('user:left', (data) => {
            this.addSystemMessage(data.message);
        });

        // Печатание
        this.socket.on('user:typing', (data) => {
            this.showTypingIndicator(data.username);
        });

        this.socket.on('user:stopped-typing', () => {
            this.hideTypingIndicator();
        });

        // Удаление сообщения
        this.socket.on('message:deleted', (messageId) => {
            const msgElement = document.querySelector(`[data-id="${messageId}"]`);
            if (msgElement) {
                msgElement.style.opacity = '0.5';
                msgElement.querySelector('.message-text').textContent = '[Сообщение удалено]';
            }
        });
    }

    login() {
        const username = document.getElementById('usernameInput').value.trim();
        
        if (!username) {
            alert('Пожалуйста, введите имя');
            return;
        }

        this.socket.emit('join', username, (response) => {
            if (response.success) {
                this.currentUser = { username };
                this.showChatScreen();
                document.getElementById('usernameInput').value = '';
            } else {
                alert(response.message);
            }
        });
    }

    logout() {
        this.socket.disconnect();
        this.currentUser = null;
        this.users.clear();
        this.showLoginScreen();
        // Переподключиться
        this.socket.connect();
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();

        if (!text) return;

        this.socket.emit('message:send', { text }, (response) => {
            if (response.success) {
                input.value = '';
            } else {
                alert(response.message);
            }
        });
    }

    addMessageToUI(message) {
        const messagesList = document.getElementById('messagesList');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.userId === this.socket.id ? 'own' : ''}`;
        messageElement.dataset.id = message.id;

        const time = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let innerHTML = `
            <img src="${message.avatar}" alt="${message.username}" class="message-avatar">
            <div class="message-content">
                <div class="message-header">${message.username}</div>
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-time">${time}</div>
                <div class="message-actions">
        `;

        if (message.userId === this.socket.id) {
            innerHTML += `<button class="delete-btn" onclick="app.deleteMessage(${message.id})">Удалить</button>`;
        }

        innerHTML += `</div></div>`;

        messageElement.innerHTML = innerHTML;
        messagesList.appendChild(messageElement);
        messagesList.parentElement.scrollTop = messagesList.parentElement.scrollHeight;
    }

    deleteMessage(messageId) {
        this.socket.emit('message:delete', messageId, (response) => {
            if (!response.success) {
                alert(response.message);
            }
        });
    }

    updateUsersList(users) {
        const usersList = document.getElementById('usersList');
        const userCount = document.getElementById('userCount');

        usersList.innerHTML = '';
        userCount.textContent = users.length;

        users.forEach(user => {
            const li = document.createElement('li');
            li.className = 'user-item';
            li.innerHTML = `
                <img src="${user.avatar}" alt="${user.username}" class="user-avatar">
                <span class="user-name">${this.escapeHtml(user.username)}</span>
                <div class="user-status"></div>
            `;
            usersList.appendChild(li);
        });
    }

    addSystemMessage(text) {
        const messagesList = document.getElementById('messagesList');
        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.textContent = text;
        messagesList.appendChild(messageElement);
        messagesList.parentElement.scrollTop = messagesList.parentElement.scrollHeight;
    }

    showTypingIndicator(username) {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'flex';
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'none';
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('chatScreen').classList.add('hidden');
    }

    showChatScreen() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('chatScreen').classList.remove('hidden');
        document.getElementById('messageInput').focus();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Глобальная переменная для доступа из HTML
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new ChatApp();
});
