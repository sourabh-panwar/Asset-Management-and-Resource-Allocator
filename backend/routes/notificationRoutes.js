const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 AND is_read = FALSE ORDER BY created_at DESC', 
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = $1', [id]);
        res.json({ message: "Notification marked as read." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;