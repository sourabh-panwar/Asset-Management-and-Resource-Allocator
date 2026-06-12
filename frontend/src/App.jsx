import { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AssetCard from './components/AssetCard';

function App() {
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]); 
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [activeTab, setActiveTab] = useState('inventory');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (user) {
      fetchAssets();
      fetchBookings();
      fetchNotifications(); 
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

  const fetchNotifications = async () => {
    if (!user) return;
    const res = await fetch(`http://localhost:5000/api/notifications/${user.id}`);
    setNotifications(await res.json());
  };

  const handleDismissNotification = async (notifId) => {
    const res = await fetch(`http://localhost:5000/api/notifications/${notifId}/read`, { method: 'PUT' });
    if (res.ok) { fetchNotifications(); } 
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      const newAsset = { name, category: formattedCategory, description, total_quantity: parseInt(totalQuantity), admin_id: user.id };
      const res = await fetch('http://localhost:5000/api/assets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAsset),
      });
      if (res.ok) {
        alert('Asset added!'); setName(''); setCategory(''); setDescription(''); setTotalQuantity(1); 
        await fetchAssets(); await fetchAuditLogs();
      }
    } finally { setIsLoading(false); }
  };

  const handleEditAsset = async (id, updatedData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/assets/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...updatedData, admin_id: user.id }),
      });
      if (res.ok) { alert('Asset updated successfully!'); await fetchAssets(); await fetchAuditLogs(); } 
      else { const data = await res.json(); alert(`Error: ${data.error}`); }
    } finally { setIsLoading(false); }
  };

  const handleDeleteAsset = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/assets/${id}`, { 
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_id: user.id }) 
      });
      if (res.ok) { alert('Asset deleted successfully!'); await fetchAssets(); await fetchAuditLogs(); } 
      else { const data = await res.json(); alert(`Error: ${data.error}`); }
    } finally { setIsLoading(false); }
  };

  const handleBookAsset = async (assetId, qty, start, end) => {
    if (!start || !end) return alert("Select dates!");
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: assetId, quantity: parseInt(qty), start_date: start, end_date: end, user_id: user.id }),
      });
      if (res.ok) { alert('Requested!'); await fetchBookings(); }
    } finally { setIsLoading(false); }
  };

  const handleApproveIssue = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}/approve`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_id: user.id }) 
      });
      if (res.ok) { await fetchBookings(); await fetchAssets(); await fetchAuditLogs(); }
    } finally { setIsLoading(false); }
  };

  const handleRejectIssue = async (id) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}/reject`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_id: user.id }) 
      });
      if (res.ok) { await fetchBookings(); await fetchAuditLogs(); }
    } finally { setIsLoading(false); }
  };

  const handleRequestReturn = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}/request-return`, { method: 'PUT' });
      if (res.ok) await fetchBookings();
    } finally { setIsLoading(false); }
  };

  const handleApproveReturn = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}/approve-return`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_id: user.id }) 
      });
      if (res.ok) { await fetchBookings(); await fetchAssets(); await fetchAuditLogs(); }
    } finally { setIsLoading(false); }
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
    return <span style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: c.bg, color: c.text, fontSize: '12px', fontWeight: 'bold' }}>{c.label}</span>;
  };

  if (!user) return <AuthScreen onLoginSuccess={(u) => setUser(u)} />;

  const uniqueCategories = ['All', ...new Set(assets.map(a => a.category))].sort();
  const filteredAssets = selectedCategory === 'All' ? assets : assets.filter(a => a.category === selectedCategory);

  const premiumCardStyle = {
    backgroundColor: '#fff', padding: '40px 50px', borderRadius: '20px', marginBottom: '30px', 
    border: '1px solid #eaeaea', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' 
  };

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '30px 20px', position: 'relative' }}>
      
      {isLoading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(3px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{ width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '20px', fontWeight: 'bold', color: '#2c3e50', fontSize: '18px' }}>Processing...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '24px', padding: '40px 50px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', fontFamily: 'sans-serif' }}>
        
        {/* bell icon for notifs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eaeaea', paddingBottom: '20px', marginBottom: '25px' }}>
          <h1 style={{ margin: 0, color: '#2c3e50', fontWeight: '800' }}>IITR Asset Platform</h1>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            
            {/* wigget for that */}
            <div style={{ position: 'relative', marginRight: '20px' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', position: 'relative', padding: 0 }}
              >
                🔔
                {notifications.length > 0 && (
                  <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: '#dc3545', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold', border: '2px solid white' }}>
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {/* DROPDOWN MENU */}
              {showNotifications && (
                <div style={{ position: 'absolute', top: '40px', right: '0', background: 'white', border: '1px solid #eaeaea', borderRadius: '12px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000, padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                     <h4 style={{ margin: 0, color: '#2c3e50' }}>Alerts</h4>
                     <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#6c757d' }}>✖</button>
                  </div>
                  
                  {notifications.length === 0 ? <p style={{ fontSize: '13px', color: '#6c757d', textAlign: 'center', margin: '20px 0' }}>No new notifications.</p> : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.map(n => (
                        <li key={n.notification_id} style={{ fontSize: '13px', marginBottom: '10px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #007bff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                           <span style={{ color: '#2c3e50', lineHeight: '1.4' }}>{n.message}</span>
                           <button onClick={() => handleDismissNotification(n.notification_id)} style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', fontSize: '14px', padding: 0 }} title="Dismiss">
                             ✓
                           </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <span style={{ marginRight: '20px', fontWeight: '600', color: user.role === 'admin' ? '#d9534f' : '#0275d8' }}>
              {user.name} ({user.role.toUpperCase()})
            </span>
            <button onClick={handleLogout} style={{ padding: '8px 18px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Logout</button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '35px', borderBottom: '2px solid #eaeaea', flexWrap: 'wrap' }}>
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
              <div style={premiumCardStyle}>
                <h2 style={{marginTop: 0, color: '#2c3e50'}}>Add New Asset</h2>
                <form onSubmit={handleAddAsset} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '20px' }}>
                  <input type="text" placeholder="Asset Name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle}/>
                  <input type="text" list="category-suggestions" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required style={inputStyle}/>
                  <datalist id="category-suggestions">
                    {uniqueCategories.filter(cat => cat !== 'All').map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required style={{...inputStyle, flex: 2}}/>
                  <input type="number" min="1" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} required style={{ ...inputStyle, width: '80px' }} />
                  <button type="submit" style={{ padding: '10px 24px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add Asset</button>
                </form>
              </div>
            )}

            <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>Available Inventory</h2>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
              {uniqueCategories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 20px', borderRadius: '24px', border: '1px solid #007bff', backgroundColor: selectedCategory === cat ? '#007bff' : '#fff', color: selectedCategory === cat ? '#fff' : '#007bff', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s', boxShadow: selectedCategory === cat ? '0 4px 8px rgba(0,123,255,0.2)' : 'none'
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            {filteredAssets.length === 0 ? <p style={{color: '#6c757d'}}>No assets found.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px', marginBottom: '40px' }}>
                {filteredAssets.map((asset) => (
                  <AssetCard 
                    key={asset.asset_id} asset={asset} onBook={handleBookAsset} isAdmin={user.role === 'admin'} onEdit={handleEditAsset} onDelete={handleDeleteAsset} userId={user.id} 
                    onRefresh={async () => { setIsLoading(true); await fetchAssets(); if(user.role === 'admin') await fetchAuditLogs(); setIsLoading(false); }} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OPERATIONS / HISTORY */}
        {activeTab === 'operations' && (
          <div style={premiumCardStyle}>
            <h2 style={{marginTop: 0, color: '#2c3e50', marginBottom: '25px'}}>{user.role === 'admin' ? "System Booking Operations" : "My Borrowing History"}</h2>
            {bookings.length === 0 ? <p style={{color: '#6c757d'}}>No records found.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eaeaea' }}>
                      <th style={{ padding: '16px 12px', color: '#495057' }}>ID</th>
                      {user.role === 'admin' && <th style={{ padding: '16px 12px', color: '#495057' }}>User</th>}
                      <th style={{ padding: '16px 12px', color: '#495057' }}>Asset</th>
                      <th style={{ padding: '16px 12px', color: '#495057' }}>Qty</th>
                      <th style={{ padding: '16px 12px', color: '#495057' }}>Duration</th>
                      <th style={{ padding: '16px 12px', color: '#495057' }}>Status</th>
                      <th style={{ padding: '16px 12px', color: '#495057' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.booking_id} style={{ borderBottom: '1px solid #f1f3f5', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbfc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '16px 12px', fontWeight: '500' }}>#{b.booking_id}</td>
                        {user.role === 'admin' && <td style={{ padding: '16px 12px' }}>User {b.user_id}</td>}
                        <td style={{ padding: '16px 12px', fontWeight: '600', color: '#2c3e50' }}>{b.asset_name}</td>
                        <td style={{ padding: '16px 12px' }}>{b.quantity}</td>
                        <td style={{ padding: '16px 12px', fontSize: '14px', color: '#6c757d' }}>
                          {new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px 12px' }}>{getStatusBadge(b.status)}</td>
                        <td style={{ padding: '16px 12px' }}>
                          {user.role === 'user' && b.status === 'approved' && (
                            <button onClick={() => handleRequestReturn(b.booking_id)} style={btnStyle('#17a2b8')}>Initiate Return</button>
                          )}
                          {user.role === 'admin' && b.status === 'pending' && (
                            <div style={{display: 'flex', gap: '8px'}}>
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
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ANALYTICS */}
        {activeTab === 'analytics' && user.role === 'admin' && (
          <AnalyticsDashboard assets={assets} bookings={bookings} />
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'audit' && user.role === 'admin' && (
          <div style={premiumCardStyle}>
            <h2 style={{marginTop: 0, color: '#2c3e50'}}>Security & Audit Logs</h2>
            <p style={{color: '#6c757d', marginBottom: '25px'}}>Immutable record of all administrative actions taken on the system.</p>
            
            {auditLogs.length === 0 ? <p style={{color: '#6c757d'}}>No audit logs generated yet.</p> : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #eaeaea' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fff5f5', color: '#c53030', borderBottom: '2px solid #fed7d7' }}>
                      <th style={{ padding: '16px' }}>Timestamp</th>
                      <th style={{ padding: '16px' }}>Administrator</th>
                      <th style={{ padding: '16px' }}>Action Type</th>
                      <th style={{ padding: '16px' }}>Event Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.log_id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                        <td style={{ padding: '16px', whiteSpace: 'nowrap', color: '#495057' }}>{new Date(log.created_at).toLocaleString()}</td>
                        <td style={{ padding: '16px', fontWeight: 'bold', color: '#2c3e50' }}>{log.admin_name || `Admin #${log.admin_id}`}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ backgroundColor: '#e2e8f0', color: '#4a5568', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#6c757d' }}>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const getTabStyle = (isActive) => ({
  padding: '14px 28px', backgroundColor: isActive ? '#007bff' : 'transparent', color: isActive ? 'white' : '#6c757d',
  border: 'none', borderBottom: isActive ? '3px solid #0056b3' : '3px solid transparent', cursor: 'pointer',
  fontSize: '16px', fontWeight: 'bold', borderRadius: '8px 8px 0 0', transition: 'all 0.2s ease-in-out'
});

const btnStyle = (color) => ({
  padding: '8px 14px', backgroundColor: color, color: 'white', border: 'none', cursor: 'pointer', borderRadius: '6px',
  fontWeight: 'bold', fontSize: '13px', transition: 'opacity 0.2s'
});

const inputStyle = {
  padding: '12px 16px', flex: 1, borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', outline: 'none'
};

export default App;