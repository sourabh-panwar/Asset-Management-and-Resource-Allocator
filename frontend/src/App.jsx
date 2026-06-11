import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
    
  const [user, setUser] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('user');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [assets, setAssets] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (user) {
      fetchAssets();
      fetchBookings();
    }
  }, [user]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword, role: authRole }),
      });
      if (response.ok) {
        alert('Registration successful! Please log in.');
        setIsLoginView(true);
      } else {
        const data = await response.json();
        alert(`Registration failed: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await response.json();
      if (response.ok) {

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        alert(`Login failed: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const fetchAssets = async () => {
    const res = await fetch('http://localhost:5000/api/assets');
    setAssets(await res.json());
  };

  const fetchBookings = async () => {
    const res = await fetch('http://localhost:5000/api/bookings');
    setBookings(await res.json());
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    const newAsset = { name, category, description, total_quantity: parseInt(totalQuantity) };
    const res = await fetch('http://localhost:5000/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAsset),
    });
    if (res.ok) {
      alert('Asset added!');
      setName(''); setCategory(''); setDescription(''); setTotalQuantity(1);
      fetchAssets();
    }
  };

  const handleBookAsset = async (assetId, qty, startDate, endDate) => {
    if (!startDate || !endDate) return alert("Select both dates!");
    
    const newBooking = { asset_id: assetId, quantity: parseInt(qty), start_date: startDate, end_date: endDate, user_id: user.id };

    const res = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking),
    });
    if (res.ok) {
      alert('Booking submitted!');
      fetchBookings();
    } else {
      alert('Booking failed');
    }
  };

  const handleApprove = async (bookingId) => {
    const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/approve`, { method: 'PUT' });
    if (res.ok) {
      fetchBookings();
      fetchAssets();
    }
  };

  const chartData = {
    labels: assets.map(a => a.name),
    datasets: [
      { label: 'Available', data: assets.map(a => a.available_quantity), backgroundColor: 'rgba(40, 167, 69, 0.7)' },
      { label: 'Checked Out', data: assets.map(a => a.total_quantity - a.available_quantity), backgroundColor: 'rgba(255, 193, 7, 0.7)' }
    ],
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '350px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>IITR Asset Manager</h2>
          
          <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
            <button onClick={() => setIsLoginView(true)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: isLoginView ? 'bold' : 'normal', borderBottom: isLoginView ? '2px solid #007bff' : 'none' }}>Login</button>
            <button onClick={() => setIsLoginView(false)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: !isLoginView ? 'bold' : 'normal', borderBottom: !isLoginView ? '2px solid #007bff' : 'none' }}>Register</button>
          </div>

          <form onSubmit={isLoginView ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {!isLoginView && (
              <>
                <input type="text" placeholder="Full Name" value={authName} onChange={(e) => setAuthName(e.target.value)} required style={{ padding: '10px' }} />
                <select value={authRole} onChange={(e) => setAuthRole(e.target.value)} style={{ padding: '10px' }}>
                  <option value="user">Student / User</option>
                  <option value="admin">Administrator</option>
                </select>
              </>
            )}
            <input type="email" placeholder="Email Address" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required style={{ padding: '10px' }} />
            <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required style={{ padding: '10px' }} />
            <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {isLoginView ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Asset Platform</h1>
        <div>
          <span style={{ marginRight: '15px', fontWeight: 'bold', color: user.role === 'admin' ? '#d9534f' : '#0275d8' }}>
            Hello, {user.name} ({user.role.toUpperCase()})
          </span>
          <button onClick={handleLogout} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Logout</button>
        </div>
      </div>

      {/* ADMIN ONLY SECTIONS */}
      {user.role === 'admin' && (
        <>
          <div style={{ backgroundColor: '#f0f8ff', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <h2>Add New Asset (Admin Tools)</h2>
            <form onSubmit={handleAddAsset} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Asset Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
              <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
              <input type="number" min="1" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} required style={{ width: '60px' }} />
              <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none' }}>Add</button>
            </form>
          </div>

          <h2>Analytics Dashboard</h2>
          {assets.length > 0 && (
            <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '40px' }}>
              <Bar data={chartData} options={{ responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }} />
            </div>
          )}
        </>
      )}

      {/* VISIBLE TO EVERYONE */}
      <h2>Available Inventory</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {assets.map((asset) => (
          <AssetCard key={asset.asset_id} asset={asset} onBook={handleBookAsset} />
        ))}
      </div>

      {/* ADMIN ONLY - APPROVAL QUEUE */}
      {user.role === 'admin' && (
        <>
          <h2>Active Booking Requests</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#eee' }}>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>User ID</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Asset</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Qty</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Status</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.booking_id}>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{b.user_id}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{b.asset_name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{b.quantity}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                    <span style={{ padding: '4px', borderRadius: '4px', backgroundColor: b.status === 'pending' ? '#ffc107' : '#28a745' }}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                    {b.status === 'pending' && (
                      <button onClick={() => handleApprove(b.booking_id)} style={{ padding: '5px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>Approve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
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
          <label style={{ fontSize: '12px' }}>Qty:<br/><input type="number" min="1" max={asset.available_quantity} value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: '40px' }} /></label>
          <label style={{ fontSize: '12px' }}>Start:<br/><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label style={{ fontSize: '12px' }}>End:<br/><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        </div>
        <button onClick={() => onBook(asset.asset_id, qty, start, end)} style={{ padding: '8px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>Book</button>
      </div>
    </div>
  );
}

export default App;