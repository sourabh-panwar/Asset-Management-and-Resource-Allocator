const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

router.post('/', async (req, res) => {
    try {
        const { asset_id, quantity, start_date, end_date } = req.body;
        
        const user_id = 1; 

        const newBooking = await pool.query(
            'INSERT INTO bookings (user_id, asset_id, quantity, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [user_id, asset_id, quantity, start_date, end_date, 'pending']
        );

        res.status(201).json({ message: "Booking requested successfully!", booking: newBooking.rows[0] });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server error while creating booking" });
    }
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT bookings.*, assets.name AS asset_name 
            FROM bookings 
            JOIN assets ON bookings.asset_id = assets.asset_id
            ORDER BY bookings.booking_id DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server error while fetching bookings" });
    }
});

module.exports = router;