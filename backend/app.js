const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Инициализация базы данных SQLite
const dbPath = path.join(__dirname, 'db', 'recipes.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite.');
    }
});

// Создаем таблицу рецептов (добавляем поле custom_key)
db.run(`CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_key INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) {
        console.error('Ошибка создания таблицы:', err.message);
    }
});

// API для получения всех рецептов
app.get('/api/recipes', (req, res) => {
    db.all("SELECT * FROM recipes ORDER BY created_at DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ recipes: rows });
    });
});

// API для добавления нового рецепта (с custom_key)
app.post('/api/recipes', (req, res) => {
    const { customKey, content } = req.body;
    if (!content) {
        res.status(400).json({ error: "Содержимое рецепта не может быть пустым" });
        return;
    }
    db.run("INSERT INTO recipes (custom_key, content) VALUES (?, ?)", [customKey, content], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, customKey, content });
    });
});

// API для загрузки рецепта по custom_key
app.get('/api/recipes/key/:key', (req, res) => {
    const key = req.params.key;
    db.get("SELECT * FROM recipes WHERE custom_key = ?", [key], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: "Рецепт не найден" });
            return;
        }
        res.json({ recipe: row });
    });
});

// Эндпоинт для очистки базы данных по URL /recipe-clean
app.get('/recipe-clean', (req, res) => {
    db.run("DELETE FROM recipes", function(err) {
        if (err) {
            res.status(500).send(`Ошибка очистки базы данных: ${err.message}`);
            return;
        }
        res.send("База данных очищена");
    });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});