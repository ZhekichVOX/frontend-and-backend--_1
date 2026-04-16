import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// База данных (хранится в памяти)
let books = [
  {
    id: '1',
    title: 'Война и мир',
    author: 'Лев Толстой',
    year: 1869,
    pages: 1200,
    genre: 'Исторический роман'
  },
  {
    id: '2',
    title: 'Преступление и наказание',
    author: 'Федор Достоевский',
    year: 1866,
    pages: 671,
    genre: 'Психологический роман'
  },
  {
    id: '3',
    title: 'Мастер и Маргарита',
    author: 'Михаил Булгаков',
    year: 1967,
    pages: 480,
    genre: 'Фантастический роман'
  }
];

// Логгирование
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode}`);
  });
  next();
});

// ============ API ENDPOINTS ============

// GET / - Главная страница API
app.get('/', (req, res) => {
  res.json({
    message: 'Library API v1.0',
    endpoints: {
      'GET /api/books': 'Получить все книги',
      'GET /api/books/:id': 'Получить книгу по ID',
      'POST /api/books': 'Добавить новую книгу',
      'PUT /api/books/:id': 'Обновить книгу',
      'DELETE /api/books/:id': 'Удалить книгу',
      'GET /api/books/search?title=...': 'Поиск по названию'
    }
  });
});

// GET /api/books - Получить все книги (с фильтрацией и пагинацией)
app.get('/api/books', (req, res) => {
  const { page = 1, limit = 10, genre, author } = req.query;

  let filteredBooks = [...books];

  // Фильтрация по жанру
  if (genre) {
    filteredBooks = filteredBooks.filter(b =>
      b.genre.toLowerCase().includes(genre.toLowerCase())
    );
  }

  // Фильтрация по автору
  if (author) {
    filteredBooks = filteredBooks.filter(b =>
      b.author.toLowerCase().includes(author.toLowerCase())
    );
  }

  // Пагинация
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const paginatedBooks = filteredBooks.slice(start, end);

  res.json({
    success: true,
    total: filteredBooks.length,
    page: pageNum,
    limit: limitNum,
    data: paginatedBooks
  });
});

// GET /api/books/search - Поиск по названию
app.get('/api/books/search', (req, res) => {
  const { title, author } = req.query;

  if (!title && !author) {
    return res.status(400).json({
      success: false,
      message: 'Укажите хотя бы один параметр поиска: title или author'
    });
  }

  let results = books;

  if (title) {
    results = results.filter(b =>
      b.title.toLowerCase().includes(title.toLowerCase())
    );
  }

  if (author) {
    results = results.filter(b =>
      b.author.toLowerCase().includes(author.toLowerCase())
    );
  }

  res.json({
    success: true,
    count: results.length,
    data: results
  });
});

// GET /api/books/:id - Получить книгу по ID
app.get('/api/books/:id', (req, res) => {
  const book = books.find(b => b.id === req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Книга не найдена'
    });
  }

  res.json({
    success: true,
    data: book
  });
});

// POST /api/books - Добавить новую книгу
app.post('/api/books', (req, res) => {
  const { title, author, year, pages, genre } = req.body;

  // Валидация
  if (!title || !author || !year || !pages || !genre) {
    return res.status(400).json({
      success: false,
      message: 'Необходимо указать все поля: title, author, year, pages, genre'
    });
  }

  if (typeof pages !== 'number' || pages < 1) {
    return res.status(400).json({
      success: false,
      message: 'Количество страниц должно быть положительным числом'
    });
  }

  if (typeof year !== 'number' || year < 1000 || year > new Date().getFullYear()) {
    return res.status(400).json({
      success: false,
      message: 'Год должен быть между 1000 и ' + new Date().getFullYear()
    });
  }

  const newBook = {
    id: nanoid(),
    title,
    author,
    year,
    pages,
    genre
  };

  books.push(newBook);

  res.status(201).json({
    success: true,
    message: 'Книга добавлена успешно',
    data: newBook
  });
});

// PUT /api/books/:id - Обновить книгу
app.put('/api/books/:id', (req, res) => {
  const book = books.find(b => b.id === req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Книга не найдена'
    });
  }

  // Обновляем только переданные поля
  const { title, author, year, pages, genre } = req.body;

  if (title) book.title = title;
  if (author) book.author = author;
  if (year) {
    if (year < 1000 || year > new Date().getFullYear()) {
      return res.status(400).json({
        success: false,
        message: 'Год должен быть между 1000 и ' + new Date().getFullYear()
      });
    }
    book.year = year;
  }
  if (pages) {
    if (pages < 1) {
      return res.status(400).json({
        success: false,
        message: 'Количество страниц должно быть положительным числом'
      });
    }
    book.pages = pages;
  }
  if (genre) book.genre = genre;

  res.json({
    success: true,
    message: 'Книга обновлена успешно',
    data: book
  });
});

// DELETE /api/books/:id - Удалить книгу
app.delete('/api/books/:id', (req, res) => {
  const initialLength = books.length;
  books = books.filter(b => b.id !== req.params.id);

  if (books.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: 'Книга не найдена'
    });
  }

  res.json({
    success: true,
    message: 'Книга удалена успешно'
  });
});

// Обработчик ошибок 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint не найден',
    path: req.path
  });
});

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`\n📚 Library API запущен на http://localhost:${PORT}`);
  console.log(`Основной endpoint: http://localhost:${PORT}/api/books\n`);
});
