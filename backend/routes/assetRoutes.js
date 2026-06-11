const express = require('express');
const router = express.Router();
const { pool } = require('../config/db'); 


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM assets ORDER BY asset_id DESC');
        res.json(result.rows); 
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server error while fetching assets" });
    }
});


router.post('/', async (req, res) => {
    try {
        const { name, category, description, total_quantity } = req.body;

        
        const newAsset = await pool.query(
            'INSERT INTO assets (name, category, description, total_quantity, available_quantity) VALUES ($1, $2, $3, $4, $4) RETURNING *',
            [name, category, description, total_quantity]
        );

        res.status(201).json({
            message: "Asset added successfully!",
            asset: newAsset.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server error while adding asset" });
    }
});

module.exports = router;