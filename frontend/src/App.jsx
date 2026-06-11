import { useState, useEffect } from 'react';

function App() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);
  
  const [assets, setAssets] = useState([]);
  const [bookings, setBookings] = useState([]); 

  const fetchAssets = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/assets');
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings');
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchBookings(); 
  }, []);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    const newAsset = { name, category, description, total_quantity: parseInt(totalQuantity) };
    try {
      const response = await fetch('http://localhost:5000/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset),
      });
      if (response.ok) {
        alert('Asset added successfully!');
        setName(''); setCategory(''); setDescription(''); setTotalQuantity(1);
        fetchAssets();
      }
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  };

  const handleBookAsset = async (assetId, qty, startDate, endDate) => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates!");
      return;
    }
    
    const newBooking = { asset_id: assetId, quantity: parseInt(qty), start_date: startDate, end_date: endDate };

    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });

      if (response.ok) {
        alert('Booking request submitted!');
        fetchBookings(); 
      } else {
        alert('Booking failed');
      }
    } catch (error) {
      console.error('Error booking asset:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Smart Asset Management Platform</h1>
      <hr />

      {/* Admin Panel */}
      <div style={{ backgroundColor: '#f0f8ff', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2>Add New Asset (Admin View)</h2>
        <form onSubmit={handleAddAsset} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Asset Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
          <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <input type="number" min="1" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} required style={{ width: '60px' }} title="Total Quantity"/>
          <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>Add</button>
        </form>
      </div>

      {/* User Inventory View */}
      <h2>Available Inventory (User View)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {assets.map((asset) => (
          <AssetCard key={asset.asset_id} asset={asset} onBook={handleBookAsset} />
        ))}
      </div>

      {/* Admin Dashboard View */}
      <h2>Active Booking Requests</h2>
      {bookings.length === 0 ? (
        <p>No booking requests yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#eee' }}>
              <th style={{ padding: '10px', border: '1px solid #ccc' }}>ID</th>
              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Asset</th>
              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Qty</th>
              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Start Date</th>
              <th style={{ padding: '10px', border: '1px solid #ccc' }}>End Date</th>
              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.booking_id}>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{b.booking_id}</td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{b.asset_name}</td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{b.quantity}</td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{new Date(b.start_date).toLocaleDateString()}</td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{new Date(b.end_date).toLocaleDateString()}</td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#ffc107', fontSize: '12px', fontWeight: 'bold' }}>
                    {b.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AssetCard({ asset, onBook }) {
  const [qty, setQty] = useState(1);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>{asset.name}</h3>
      <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Category:</strong> {asset.category}</p>
      <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>{asset.description}</p>
      <p style={{ margin: '10px 0', fontWeight: 'bold', color: '#28a745' }}>Available: {asset.available_quantity} / {asset.total_quantity}</p>
      
      <div style={{ marginTop: '15px', borderTop: '1px dashed #ccc', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ fontSize: '12px' }}>Qty: <br/><input type="number" min="1" max={asset.available_quantity} value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: '50px' }} /></label>
          <label style={{ fontSize: '12px' }}>Start: <br/><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label style={{ fontSize: '12px' }}>End: <br/><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        </div>
        <button onClick={() => onBook(asset.asset_id, qty, start, end)} style={{ padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Request Booking
        </button>
      </div>
    </div>
  );
}

export default App;