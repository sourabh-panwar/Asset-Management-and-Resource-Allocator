import { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AssetCard from './components/AssetCard';

function App() {
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]); 
  
  const [activeTab, setActiveTab] = useState('inventory');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (user) {
      fetchAssets();
      fetchBookings();
      if (user.role === 'admin') fetchAuditLogs(); 
    }
  }, [user]);

  const fetchAssets = async () => {
    const res = await fetch('http://localhost:5000/api/assets');
    setAssets(await res.json());
  };

  const fetchBookings = async () => {
    let url = 'http://localhost:5000/api/bookings';
    if (user && user.role === 'user') url += `?user_id=${user.id}`;
    const res = await fetch(url);
    setBookings(await res.json());
  };

  const fetchAuditLogs = async () => {
    const res = await fetch('http://localhost:5000/api/audit-logs');
    setAuditLogs(await res.json());
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    const newAsset = { name, category: formattedCategory, description, total_quantity: parseInt(totalQuantity), admin_id: user.id };
    const res = await fetch('http://localhost:5000/api/assets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAsset),
    });
    if (res.ok) {
      alert('Asset added!'); setName(''); setCategory(''); setDescription(''); setTotalQuantity(1); 
      fetchAssets(); fetchAuditLogs();
    }
  };

  const handleEditAsset = async (id, updatedData) => {
    const res = await fetch(`http://localhost:5000/api/assets/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...updatedData, admin_id: user.id }),
    });
    if (res.ok) { alert('Asset updated successfully!'); fetchAssets(); fetchAuditLogs(); } 
    else { const data = await res.json(); alert(`Error updating asset: ${data.error}`); }
  };

  const handleDeleteAsset = async (id) => {
    const res = await fetch(`http://localhost:5000/api/assets/${id}`, { 
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_id: user.id }) 
    });
    if (res.ok) { alert('Asset deleted successfully!'); fetchAssets(); fetchAuditLogs(); } 
    else { const data = await res.json(); alert(`Error deleting asset: ${data.error}`); }
  };

  const handleBookAsset = async (assetId, qty, start, end) => {
    if (!start || !end) return alert("Select dates!");
    const res = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId, quantity: parseInt(qty), start_date: start, end_date: end, user_id: user.id }),
    });
    if (res.ok) { alert('Requested!'); fetchBookings(); }
  };

  const handleApproveIssue = async (id) => {
    const res = await fetch(`http://localhost:5000/api/bookings/${id}/approve`, { 
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_id: user.id }) 
    });
    if (res.ok) { fetchBookings(); fetchAssets(); fetchAuditLogs(); }
  };

  const handleRejectIssue = async (id) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    const res = await fetch(`http://localhost:5000/api/bookings/${id}/reject`, { 
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_id: user.id }) 
    });
    if (res.ok) { fetchBookings(); fetchAuditLogs(); }
  };

  const handleRequestReturn = async (id) => {
    const res = await fetch(`http://localhost:5000/api/bookings/${id}/request-return`, { method: 'PUT' });
    if (res.ok) fetchBookings();
  };

  const handleApproveReturn = async (id) => {
    const res = await fetch(`http://localhost:5000/api/bookings/${id}/approve-return`, { 
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_id: user.id }) 
    });
    if (res.ok) { fetchBookings(); fetchAssets(); fetchAuditLogs(); }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'pending': { bg: '#ffc107', text: 'black', label: 'ISSUE PENDING' },
      'approved': { bg: '#28a745', text: 'white', label: 'CHECKED OUT' },
      'rejected': { bg: '#dc3545', text: 'white', label: 'REJECTED' },
      'return_pending': { bg: '#17a2b8', text: 'white', label: 'RETURN PENDING' },
      'returned': { bg: '#6c757d', text: 'white', label: 'RETURNED' }
    };
    const c = colors[status] || colors['returned'];
    return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: c.bg, color: c.text, fontSize: '11px', fontWeight: 'bold' }}>{c.label}</span>;
  };

  if (!user) return <AuthScreen onLoginSuccess={(u) => setUser(u)} />;

  const uniqueCategories = ['All', ...new Set(assets.map(a => a.category))].sort();
  const filteredAssets = selectedCategory === 'All' ? assets : assets.filter(a => a.category === selectedCategory);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto', backgroundColor: '#f9fbfd', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>IITR Asset Platform</h1>
        <div>
          <span style={{ marginRight: '15px', fontWeight: 'bold', color: user.role === 'admin' ? '#d9534f' : '#0275d8' }}>
            {user.name} ({user.role.toUpperCase()})
          </span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Logout</button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #ddd', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('inventory')} style={getTabStyle(activeTab === 'inventory')}>Inventory</button>
        <button onClick={() => setActiveTab('operations')} style={getTabStyle(activeTab === 'operations')}>{user.role === 'admin' ? 'Booking Operations' : 'My History'}</button>
        {user.role === 'admin' && (
          <>
            <button onClick={() => setActiveTab('analytics')} style={getTabStyle(activeTab === 'analytics')}>Analytics</button>
            <button onClick={() => setActiveTab('audit')} style={getTabStyle(activeTab === 'audit')}>Audit Logs</button>
          </>
        )}
      </div>

      {/* TAB 1: INVENTORY */}
      {activeTab === 'inventory' && (
        <div>
          {user.role === 'admin' && (
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ddd' }}>
              <h2 style={{marginTop: 0}}>Add New Asset</h2>
              <form onSubmit={handleAddAsset} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Asset Name" value={name} onChange={(e) => setName(e.target.value)} required style={{padding: '8px', flex: 1}}/>
                <input type="text" list="category-suggestions" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required style={{padding: '8px', flex: 1}}/>
                <datalist id="category-suggestions">
                  {uniqueCategories.filter(cat => cat !== 'All').map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required style={{padding: '8px', flex: 2}}/>
                <input type="number" min="1" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} required style={{ width: '70px', padding: '8px' }} />
                <button type="submit" style={{ padding: '8px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
              </form>
            </div>
          )}

          <h2>Available Inventory</h2>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 16px', borderRadius: '20px', border: '1px solid #007bff',
                  backgroundColor: selectedCategory === cat ? '#007bff' : '#fff', color: selectedCategory === cat ? '#fff' : '#007bff',
                  cursor: 'pointer', fontWeight: 'bold', transition: '0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredAssets.length === 0 ? <p>No assets found.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {filteredAssets.map((asset) => (
                <AssetCard key={asset.asset_id} asset={asset} onBook={handleBookAsset} isAdmin={user.role === 'admin'} onEdit={handleEditAsset} onDelete={handleDeleteAsset} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OPERATIONS / HISTORY */}
      {activeTab === 'operations' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h2 style={{marginTop: 0}}>{user.role === 'admin' ? "System Booking Operations" : "My Borrowing History"}</h2>
          {bookings.length === 0 ? <p>No records found.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f4f7f6', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px' }}>ID</th>
                  {user.role === 'admin' && <th style={{ padding: '12px' }}>User</th>}
                  <th style={{ padding: '12px' }}>Asset</th>
                  <th style={{ padding: '12px' }}>Qty</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.booking_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>#{b.booking_id}</td>
                    {user.role === 'admin' && <td style={{ padding: '12px' }}>User {b.user_id}</td>}
                    <td style={{ padding: '12px' }}>{b.asset_name}</td>
                    <td style={{ padding: '12px' }}>{b.quantity}</td>
                    <td style={{ padding: '12px' }}>{getStatusBadge(b.status)}</td>
                    <td style={{ padding: '12px' }}>
                      {user.role === 'user' && b.status === 'approved' && (
                        <button onClick={() => handleRequestReturn(b.booking_id)} style={btnStyle('#17a2b8')}>Initiate Return</button>
                      )}
                      {user.role === 'admin' && b.status === 'pending' && (
                        <div style={{display: 'flex', gap: '5px'}}>
                          <button onClick={() => handleApproveIssue(b.booking_id)} style={btnStyle('#28a745')}>Approve</button>
                          <button onClick={() => handleRejectIssue(b.booking_id)} style={btnStyle('#dc3545')}>Reject</button>
                        </div>
                      )}
                      {user.role === 'admin' && b.status === 'return_pending' && (
                        <button onClick={() => handleApproveReturn(b.booking_id)} style={btnStyle('#6c757d')}>Approve Return</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: ANALYTICS */}
      {activeTab === 'analytics' && user.role === 'admin' && (
        <AnalyticsDashboard assets={assets} bookings={bookings} />
      )}

      {/* TAB 4: AUDIT LOGS (ADMIN ONLY) */}
      {activeTab === 'audit' && user.role === 'admin' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h2 style={{marginTop: 0}}>Security & Audit Logs</h2>
          <p style={{color: '#666', marginBottom: '20px'}}>Immutable record of all administrative actions taken on the system.</p>
          
          {auditLogs.length === 0 ? <p>No audit logs generated yet.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8d7da', color: '#721c24', borderBottom: '2px solid #f5c6cb' }}>
                    <th style={{ padding: '12px' }}>Timestamp</th>
                    <th style={{ padding: '12px' }}>Administrator</th>
                    <th style={{ padding: '12px' }}>Action Type</th>
                    <th style={{ padding: '12px' }}>Event Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.log_id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.admin_name || `Admin #${log.admin_id}`}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ backgroundColor: '#e2e3e5', color: '#383d41', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#555' }}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

const getTabStyle = (isActive) => ({
  padding: '12px 24px', backgroundColor: isActive ? '#007bff' : 'transparent', color: isActive ? 'white' : '#555',
  border: 'none', borderBottom: isActive ? '3px solid #0056b3' : '3px solid transparent', cursor: 'pointer',
  fontSize: '16px', fontWeight: 'bold', borderRadius: '4px 4px 0 0', transition: 'all 0.2s'
});

const btnStyle = (color) => ({
  padding: '6px 12px', backgroundColor: color, color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px'
});

export default App;