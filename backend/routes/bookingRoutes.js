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
    } catch (error) { res.status(500).json({ error: "Server error" }); }
});

router.get('/', async (req, res) => {
    try {
        const { user_id } = req.query; 
        let query = `SELECT bookings.*, assets.name AS asset_name FROM bookings JOIN assets ON bookings.asset_id = assets.asset_id`;
        const params = [];
        if (user_id) { query += ` WHERE bookings.user_id = $1`; params.push(user_id); }
        query += ` ORDER BY bookings.booking_id DESC`;
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: "Server error" }); }
});

router.put('/:id/approve', async (req, res) => {
    const client = await pool.connect(); 
    try {
        await client.query('BEGIN'); 
        const bookingId = req.params.id;
        const { admin_id } = req.body; 

        const bookingCheck = await client.query('SELECT * FROM bookings WHERE booking_id = $1', [bookingId]);
        const booking = bookingCheck.rows[0];

        if (!booking || booking.status !== 'pending') throw new Error("Invalid status.");

        await client.query('UPDATE assets SET available_quantity = available_quantity - $1 WHERE asset_id = $2', [booking.quantity, booking.asset_id]);
        await client.query("UPDATE bookings SET status = 'approved' WHERE booking_id = $1", [bookingId]);

        await client.query("INSERT INTO audit_logs (admin_id, action, details) VALUES ($1, $2, $3)", 
            [admin_id, 'BOOKING_APPROVAL', `Approved Booking #${bookingId} (Asset ID: ${booking.asset_id}, Qty: ${booking.quantity})`]);

        await client.query('COMMIT'); 
        res.json({ message: "Booking approved successfully!" });
    } catch (error) {
        await client.query('ROLLBACK'); res.status(500).json({ error: error.message });
    } finally { client.release(); }
});

router.put('/:id/reject', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { admin_id } = req.body;
        await pool.query("UPDATE bookings SET status = 'rejected' WHERE booking_id = $1 AND status = 'pending'", [bookingId]);
        
        await pool.query("INSERT INTO audit_logs (admin_id, action, details) VALUES ($1, $2, $3)", 
            [admin_id, 'BOOKING_REJECTED', `Rejected Booking #${bookingId}`]);

        res.json({ message: "Booking rejected." });
    } catch (error) { res.status(500).json({ error: "Server error" }); }
});

router.put('/:id/request-return', async (req, res) => {
    try {
        const bookingId = req.params.id;
        await pool.query("UPDATE bookings SET status = 'return_pending' WHERE booking_id = $1", [bookingId]);
        res.json({ message: "Return requested successfully!" });
    } catch (error) { res.status(500).json({ error: "Server error" }); }
});

router.put('/:id/approve-return', async (req, res) => {
    const client = await pool.connect(); 
    try {
        await client.query('BEGIN'); 
        const bookingId = req.params.id;
        const { admin_id } = req.body;

        const bookingCheck = await client.query('SELECT * FROM bookings WHERE booking_id = $1', [bookingId]);
        const booking = bookingCheck.rows[0];

        if (!booking || booking.status !== 'return_pending') throw new Error("Invalid status.");

        await client.query('UPDATE assets SET available_quantity = available_quantity + $1 WHERE asset_id = $2', [booking.quantity, booking.asset_id]);
        await client.query("UPDATE bookings SET status = 'returned' WHERE booking_id = $1", [bookingId]);

        await client.query("INSERT INTO audit_logs (admin_id, action, details) VALUES ($1, $2, $3)", 
            [admin_id, 'RETURN_APPROVAL', `Approved Return for Booking #${bookingId} (Asset ID: ${booking.asset_id}, Qty: ${booking.quantity})`]);

        await client.query('COMMIT'); 
        res.json({ message: "Asset returned successfully!" });
    } catch (error) {
        await client.query('ROLLBACK'); res.status(500).json({ error: error.message });
    } finally { client.release(); }
});

module.exports = router;