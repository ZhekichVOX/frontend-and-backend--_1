import express from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import bcrypt from 'bcrypt';

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

// ================= DATA =================
let products = [
  { id: nanoid(6), name: 'Hollow Knight', price: 350, category: 'Метроидвания', rating: 5, stock: 42, image: '' },
  { id: nanoid(6), name: 'Celeste', price: 415, category: 'Платформер', rating: 5, stock: 15, image: '' }
];

let users = [];

// ================= PRODUCTS =================
app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/products", (req, res) => {
  const { name, price, category, rating, stock, image } = req.body;

  const product = {
    id: nanoid(6),
    name,
    price,
    category,
    rating,
    stock,
    image
  };

  products.push(product);
  res.status(201).json(product);
});

// ================= AUTH =================

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({ error: "Пользователь уже существует" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: nanoid(),
    email,
    passwordHash
  };

  users.push(user);

  res.status(201).json({
    id: user.id,
    email: user.email
  });
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Неверные данные" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Неверные данные" });
  }

  res.json({
    message: "Успешный вход"
  });
});

// ================= ERRORS =================
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Practice 7 сервер: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api-docs`);
});