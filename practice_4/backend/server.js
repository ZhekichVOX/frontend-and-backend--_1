import express from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ================= LOGGER =================
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      console.log("Body:", req.body);
    }
  });
  next();
});

// ================= SWAGGER =================
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Shop API",
      version: "1.0.0",
      description: "API управления товарами"
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Local server"
      }
    ]
  },
  apis: ["./server.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *         - rating
 *         - stock
 *         - image
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID товара
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         category:
 *           type: string
 *         rating:
 *           type: number
 *         stock:
 *           type: number
 *         image:
 *           type: string
 *       example:
 *         id: "abc123"
 *         name: "Хлеб Бородинский"
 *         price: 45
 *         category: "Выпечка"
 *         rating: 5
 *         stock: 10
 *         image: "https://example.com/image.jpg"
 */

let products = [
  // Платформеры и Метроидвании
  { id: nanoid(6), name: 'Hollow Knight', price: 350, category: 'Метроидвания', rating: 5, stock: 42, image: 'https://avatars.mds.yandex.net/i?id=c71534d3a1935e1c537d85f1fa4589ddce9c2570-5233397-images-thumbs&n=13'},
  { id: nanoid(6), name: 'Celeste', price: 415, category: 'Платформер', rating: 5, stock: 15, image: 'https://avatars.mds.yandex.net/get-mpic/15106342/2a000001954d35b8cebfc08b4c0bbd227dfd/orig' },
  { id: nanoid(6), name: 'Cuphead', price: 419, category: 'Платформер', rating: 4, stock: 8, image: 'https://i.ytimg.com/vi/m4BTJxjI63g/maxresdefault.jpg' },

  // Рогалики (Roguelike)
  { id: nanoid(6), name: 'Hades', price: 880, category: 'Рогалик', rating: 5, stock: 50, image: 'https://i.playground.ru/e/8FidYLyi42qJWycZJBudIA.png' },
  { id: nanoid(6), name: 'Dead Cells', price: 499, category: 'Рогалик', rating: 4, stock: 23, image: 'https://ir.ozone.ru/s3/multimedia-e/6425264738.jpg' },
  { id: nanoid(6), name: 'The Binding of Isaac: Rebirth', price: 449, category: 'Рогалик', rating: 5, stock: 0, image: 'https://i.ytimg.com/vi/Ii-FJ5hPqjI/maxresdefault.jpg' },
  { id: nanoid(6), name: 'Slay the Spire', price: 600, category: 'Рогалик', rating: 5, stock: 12, image: 'https://avatars.mds.yandex.net/i?id=3a0dd8cf980eff42e692db095d525f80_l-5221784-images-thumbs&n=13' },

  // RPG и Сюжетные
  { id: nanoid(6), name: 'Undertale', price: 249, category: 'RPG', rating: 5, stock: 100, image: 'https://cdn1.ozone.ru/s3/multimedia-7/6254117023.jpg' },
  { id: nanoid(6), name: 'Disco Elysium', price: 725, category: 'RPG', rating: 5, stock: 7, image: 'https://store-images.s-microsoft.com/image/apps.3713.14408364206805299.cb147661-44a5-49c4-956c-0c4d330a4cf8.90b33ca8-ddc3-4d84-a37e-edb37b6c2194' },
  { id: nanoid(6), name: 'Outer Wilds', price: 600, category: 'Приключение', rating: 5, stock: 18, image: 'https://avatars.mds.yandex.net/i?id=4df015bf443733696e1e700ec1c76d0ba0761b95-12655143-images-thumbs&n=13' },
  
  // Симуляторы и Песочницы
  { id: nanoid(6), name: 'Stardew Valley', price: 299, category: 'Симулятор', rating: 5, stock: 85, image: 'https://i.ytimg.com/vi/GBBPGscE4TA/maxresdefault.jpg' },
  { id: nanoid(6), name: 'Terraria', price: 385, category: 'Песочница', rating: 4, stock: 60, image: 'https://i.playground.ru/e/lsu6IPAFO1VbtgRTLwjq6w.jpeg' },

  // Экшен / Головоломки
  { id: nanoid(6), name: 'Hotline Miami', price: 385, category: 'Экшен', rating: 4, stock: 5, image: 'https://i.ytimg.com/vi/6qxzaTF3DSc/maxresdefault.jpg' },
];



/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
app.post("/api/products", (req, res) => {
  const { name, price, category, rating, stock, image } = req.body;

  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    price: Number(price),
    category: category.trim(),
    rating: Number(rating),
    stock: Number(stock),
    image: image.trim()
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Товар обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.patch("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Товар не найден" });

  Object.assign(product, req.body);
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар удалён
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/products/:id", (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Товар не найден" });

  products.splice(index, 1);
  res.json({ message: "Товар удалён" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Сервер запущен: http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
});