const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

// Создаем экземпляр приложения
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Настройка базы данных
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
}); // Используем SQLite в памяти

// Модель результата
const Result = sequelize.define('Result', {
    ip: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    time: {
        type: DataTypes.FLOAT,
        allowNull: false,
    }
});

// Инициализация базы данных
sequelize.sync();

// API для записи результата
app.post('/api/results', async (req, res) => {
    const { ip, time } = req.body;
    try {
        const result = await Result.create({ ip, time });
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// API для получения всех результатов
app.get('/api/results', async (req, res) => {
    try {
        const results = await Result.findAll();
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
