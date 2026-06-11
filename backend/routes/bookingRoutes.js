const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

router.post('/', async (req, res) => {
    try {
        const { asset_id, quantity, start_date, end_date, user_id } = req.body;

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


router.put('/:id/approve', async (req, res) => {
    const client = await pool.connect(); 
    try {
        await client.query('BEGIN'); 

        const bookingId = req.params.id;

        const bookingCheck = await client.query('SELECT * FROM bookings WHERE booking_id = $1', [bookingId]);
        const booking = bookingCheck.rows[0];

        if (!booking || booking.status !== 'pending') {
            throw new Error("Booking not found or already processed.");
        }

        await client.query(
            'UPDATE assets SET available_quantity = available_quantity - $1 WHERE asset_id = $2',
            [booking.quantity, booking.asset_id]
        );

        await client.query(
            "UPDATE bookings SET status = 'approved' WHERE booking_id = $1",
            [bookingId]
        );

        await client.query('COMMIT'); 
        res.json({ message: "Booking approved successfully!" });
    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error(error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release(); 
    }
});

module.exports = router;