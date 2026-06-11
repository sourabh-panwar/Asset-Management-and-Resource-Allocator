const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM assets ORDER BY asset_id DESC');
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { name, category, description, total_quantity, admin_id } = req.body;
        const newAsset = await pool.query(
            'INSERT INTO assets (name, category, description, total_quantity, available_quantity, status) VALUES ($1, $2, $3, $4, $4, $5) RETURNING *',
            [name, category, description, total_quantity, 'active']
        );
        await pool.query("INSERT INTO audit_logs (admin_id, action, details) VALUES ($1, $2, $3)", 
            [admin_id, 'ASSET_CREATED', `Created new asset: ${name} (Qty: ${total_quantity})`]);

        res.status(201).json(newAsset.rows[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description, total_quantity, admin_id } = req.body;

        const currentCheck = await pool.query('SELECT * FROM assets WHERE asset_id = $1', [id]);
        if (currentCheck.rows.length === 0) return res.status(404).json({ error: "Asset not found" });
        
        const currentAsset = currentCheck.rows[0];
        const difference = total_quantity - currentAsset.total_quantity;
        const newAvailableQuantity = currentAsset.available_quantity + difference;

        if (newAvailableQuantity < 0) return res.status(400).json({ error: "Cannot lower total below checked out items." });

        const updatedAsset = await pool.query(
            'UPDATE assets SET name = $1, category = $2, description = $3, total_quantity = $4, available_quantity = $5 WHERE asset_id = $6 RETURNING *',
            [name, category, description, total_quantity, newAvailableQuantity, id]
        );

        await pool.query("INSERT INTO audit_logs (admin_id, action, details) VALUES ($1, $2, $3)", 
            [admin_id, 'INVENTORY_UPDATE', `Updated asset #${id}: ${name} (New Total: ${total_quantity})`]);

        res.json({ message: "Asset updated successfully", asset: updatedAsset.rows[0] });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { admin_id } = req.body; 

        const asset = await client.query('SELECT name FROM assets WHERE asset_id = $1', [id]);
        const assetName = asset.rows.length > 0 ? asset.rows[0].name : "Unknown Asset";

        const activeBookings = await client.query("SELECT * FROM bookings WHERE asset_id = $1 AND status != 'returned'", [id]);
        if (activeBookings.rows.length > 0) throw new Error("Cannot delete asset with active bookings.");

        await client.query('DELETE FROM bookings WHERE asset_id = $1', [id]);
        await client.query('DELETE FROM assets WHERE asset_id = $1', [id]);

        await client.query("INSERT INTO audit_logs (admin_id, action, details) VALUES ($1, $2, $3)", 
            [admin_id, 'ASSET_DELETED', `Deleted asset: ${assetName} (ID #${id})`]);

        await client.query('COMMIT');
        res.json({ message: "Asset deleted successfully." });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    } finally { client.release(); }
});

module.exports = router;