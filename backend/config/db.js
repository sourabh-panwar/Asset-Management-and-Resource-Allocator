const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        require: true,
    },
});

const connectDB = async () => {
    try {
        await pool.connect();
        console.log("Database connected successfully! 🚀");
    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
};

module.exports = { pool, connectDB };