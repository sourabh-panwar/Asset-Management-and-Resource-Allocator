import { useState } from 'react';

export default function AssetCard({ asset, onBook, isAdmin, onEdit, onDelete, userId, onRefresh }) {
  const [qty, setQty] = useState(1);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: asset.name,
    category: asset.category,
    description: asset.description,
    total_quantity: asset.total_quantity,
    condition: asset.condition || 'Good'
  });

  const [showHealth, setShowHealth] = useState(false);
  const [healthLogs, setHealthLogs] = useState([]);
  const [reportType, setReportType] = useState('Maintenance');
  const [notes, setNotes] = useState('');
  const [newCondition, setNewCondition] = useState(asset.condition || 'Good');

  let statusText = "Available";
  let statusColor = "#28a745"; 
  if (asset.available_quantity === 0) { statusText = "Out of Stock"; statusColor = "#dc3545"; } 
  else if (asset.available_quantity <= 2 && asset.total_quantity > 2) { statusText = "Low Stock"; statusColor = "#ffc107"; }

  const handleSaveEdit = () => { onEdit(asset.asset_id, editData); setIsEditing(false); };

  const fetchHealthLogs = async () => {
    const res = await fetch(`http://localhost:5000/api/assets/${asset.asset_id}/health`);
    setHealthLogs(await res.json());
  };

  const handleToggleHealth = () => {
    if (!showHealth) fetchHealthLogs();
    setShowHealth(!showHealth);
  };

  const handleAddHealthLog = async (e) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:5000/api/assets/${asset.asset_id}/health`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: userId, report_type: reportType, notes, new_condition: newCondition })
    });
    if (res.ok) {
      alert('Health log added!');
      setNotes('');
      fetchHealthLogs();
      onRefresh(); 
    }
  };

  if (isEditing) {
    return (
      <div style={{ border: '2px solid #007bff', padding: '15px', borderRadius: '8px', backgroundColor: '#f0f8ff' }}>
        <h4 style={{marginTop: 0}}>Edit Asset</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>Name:</label>
          <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{padding: '5px'}}/>
          
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>Category:</label>
          <input type="text" value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})} style={{padding: '5px'}}/>
          
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>Description:</label>
          <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} style={{padding: '5px'}}/>
          
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>System Quantity:</label>
          <input type="number" min="1" value={editData.total_quantity} onChange={e => setEditData({...editData, total_quantity: parseInt(e.target.value)})} style={{padding: '5px'}}/>

          <label style={{fontSize: '12px', fontWeight: 'bold'}}>Base Condition:</label>
          <select value={editData.condition} onChange={e => setEditData({...editData, condition: e.target.value})} style={{padding: '5px'}}>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Needs Repair">Needs Repair</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSaveEdit} style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>Save</button>
          <button onClick={() => setIsEditing(false)} style={{ padding: '6px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>{asset.name}</h3>
          <span style={{ backgroundColor: statusColor, color: statusColor === '#ffc107' ? 'black' : 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
            {statusText}
          </span>
        </div>
        
        <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Category:</strong> {asset.category}</p>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>{asset.description}</p>
        
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          <strong>Condition:</strong> 
          <span style={{ color: ['Needs Repair', 'Damaged'].includes(asset.condition) ? '#dc3545' : '#28a745', marginLeft: '5px', fontWeight: 'bold' }}>
            {asset.condition || 'Good'}
          </span>
        </p>

        <p style={{ margin: '10px 0', fontWeight: 'bold', color: '#28a745' }}>
          Available: {asset.available_quantity} / {asset.total_quantity}
        </p>
      </div>

      {isAdmin && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
          <button onClick={() => setIsEditing(true)} style={{ padding: '5px 10px', background: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Edit</button>
          <button onClick={() => { if(window.confirm('Delete this asset?')) onDelete(asset.asset_id) }} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Delete</button>
          <button onClick={handleToggleHealth} style={{ padding: '5px 10px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Health Logs</button>
        </div>
      )}

      {isAdmin && showHealth && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h4 style={{marginTop: 0, fontSize: '13px'}}>Log Report</h4>
          <form onSubmit={handleAddHealthLog} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
            <select value={reportType} onChange={e => setReportType(e.target.value)} style={{padding: '5px', fontSize: '12px'}}>
              <option value="Maintenance">Maintenance Log</option>
              <option value="Damage">Damage Report</option>
            </select>
            <textarea placeholder="Details of maintenance or damage..." value={notes} onChange={e => setNotes(e.target.value)} required style={{padding: '5px', fontSize: '12px'}}/>
            <select value={newCondition} onChange={e => setNewCondition(e.target.value)} style={{padding: '5px', fontSize: '12px'}}>
              <option value="Good">Set Condition: Good</option>
              <option value="Fair">Set Condition: Fair</option>
              <option value="Needs Repair">Set Condition: Needs Repair</option>
              <option value="Damaged">Set Condition: Damaged</option>
            </select>
            <button type="submit" style={{ padding: '5px', background: '#343a40', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Submit Log</button>
          </form>

          <h4 style={{margin: '0 0 5px 0', fontSize: '13px'}}>History</h4>
          {healthLogs.length === 0 ? <p style={{fontSize: '12px', margin: 0}}>No logs recorded.</p> : (
            <ul style={{ paddingLeft: '15px', margin: 0, fontSize: '12px', color: '#555' }}>
              {healthLogs.map(log => (
                <li key={log.log_id} style={{marginBottom: '5px'}}>
                  <strong>{log.report_type}</strong> - {new Date(log.created_at).toLocaleDateString()}<br/>
                  {log.notes}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {/* ONLY SHOW BOOKING SECTION TO NON-ADMINS */}
      {!isAdmin && (
        <div style={{ marginTop: '15px', borderTop: '1px dashed #ccc', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ fontSize: '12px' }}>Qty:<br/><input type="number" min="1" max={asset.available_quantity} value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: '40px' }} /></label>
            <label style={{ fontSize: '12px' }}>Start:<br/><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
            <label style={{ fontSize: '12px' }}>End:<br/><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          </div>
          {asset.available_quantity > 0 && asset.condition !== 'Damaged' && asset.condition !== 'Needs Repair' ? (
            <button onClick={() => onBook(asset.asset_id, qty, start, end)} style={{ padding: '8px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Request Booking</button>
          ) : (
             <button disabled style={{ padding: '8px', background: '#ccc', color: '#666', border: 'none', borderRadius: '4px' }}>
               {asset.condition === 'Damaged' || asset.condition === 'Needs Repair' ? 'Under Maintenance' : 'Out of Stock'}
             </button>
          )}
        </div>
      )}

    </div>
  );
}