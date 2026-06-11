const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db'); 
const assetRoutes = require('./routes/assetRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const auditRoutes = require('./routes/auditRoutes'); 

const app = express();
const PORT = process.env.PORT || 5000;

connectDB(); 

app.use(cors()); 
app.use(express.json()); 

app.use('/api/assets', assetRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/audit-logs', auditRoutes); 

app.get('/api/test', (req, res) => {
    res.json({ message: "Asset Manager Backend is awake and listening!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});