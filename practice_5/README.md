# Practice 5 - Library REST API

Полнофункциональный REST API для управления библиотекой книг с поддержкой поиска, фильтрации и пагинации.

## Установка

```bash
npm install
```

## Запуск

```bash
npm start
```

Сервер будет доступен на `http://localhost:3000`

## API Endpoints

### 1. Получить все книги (с фильтрацией и пагинацией)

**Запрос:**
```http
GET /api/books?page=1&limit=10&genre=Исторический&author=Толстой
```

**Параметры:**
- `page` - номер страницы (по умолчанию: 1)
- `limit` - количество книг на странице (по умолчанию: 10)
- `genre` - фильтр по жанру (опционально)
- `author` - фильтр по автору (опционально)

**Пример ответа:**
```json
{
  "success": true,
  "total": 1,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": "abc123",
      "title": "Война и мир",
      "author": "Лев Толстой",
      "year": 1869,
      "pages": 1200,
      "genre": "Исторический роман"
    }
  ]
}
```

### 2. Поиск по названию или автору

**Запрос:**
```http
GET /api/books/search?title=война&author=Толстой
```

**Параметры:**
- `title` - поиск по названию (опционально)
- `author` - поиск по автору (опционально)

### 3. Получить книгу по ID

**Запрос:**
```http
GET /api/books/:id
```

**Пример (id = "1"):**
```http
GET /api/books/1
```

### 4. Добавить новую книгу

**Запрос:**
```http
POST /api/books
Content-Type: application/json

{
  "title": "Анна Каренина",
  "author": "Лев Толстой",
  "year": 1877,
  "pages": 960,
  "genre": "Исторический роман"
}
```

**Обязательные поля:** title, author, year, pages, genre

### 5. Обновить книгу

**Запрос:**
```http
PUT /api/books/:id
Content-Type: application/json

{
  "title": "Новое название",
  "pages": 800
}
```

**Примечание:** Можно обновлять любые поля (не обязательно все)

### 6. Удалить книгу

**Запрос:**
```http
DELETE /api/books/:id
```

## Примеры использования с curl

```bash
# Получить все книги
curl http://localhost:3000/api/books

# Получить книги Толстого
curl "http://localhost:3000/api/books?author=Толстой"

# Добавить книгу
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Мертвые души",
    "author": "Николай Гоголь",
    "year": 1842,
    "pages": 460,
    "genre": "Писательская сатира"
  }'

# Обновить книгу
curl -X PUT http://localhost:3000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{"pages": 1300}'

# Удалить книгу
curl -X DELETE http://localhost:3000/api/books/1
```

## Возможности

✅ CRUD операции (Create, Read, Update, Delete)
✅ Поиск и фильтрация
✅ Пагинация
✅ Валидация данных
✅ Логирование запросов
✅ Обработка ошибок
✅ JSON API

## Структура данных книги

```javascript
{
  id: string,           // Уникальный ID (nanoid)
  title: string,        // Название книги
  author: string,       // ФИО автора
  year: number,         // Год публикации (1000-текущий год)
  pages: number,        // Количество страниц (>0)
  genre: string         // Жанр книги
}
```
