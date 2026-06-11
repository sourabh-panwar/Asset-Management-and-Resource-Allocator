const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT audit_logs.*, users.name AS admin_name 
            FROM audit_logs 
            LEFT JOIN users ON audit_logs.admin_id = users.user_id
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server error while fetching audit logs" });
    }
});

module.exports = router;