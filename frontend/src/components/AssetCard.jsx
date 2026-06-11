import { useState } from 'react';

export default function AssetCard({ asset, onBook, isAdmin, onEdit, onDelete }) {
    
  const [qty, setQty] = useState(1);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: asset.name,
    category: asset.category,
    description: asset.description,
    total_quantity: asset.total_quantity
  });

  let statusText = "Available";
  let statusColor = "#28a745"; 
  if (asset.available_quantity === 0) {
    statusText = "Out of Stock";
    statusColor = "#dc3545"; 
  } else if (asset.available_quantity <= 2 && asset.total_quantity > 2) {
    statusText = "Low Stock";
    statusColor = "#ffc107"; 
  }

  const handleSaveEdit = () => {
    onEdit(asset.asset_id, editData);
    setIsEditing(false);
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
          
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>Total System Quantity:</label>
          <input type="number" min="1" value={editData.total_quantity} onChange={e => setEditData({...editData, total_quantity: parseInt(e.target.value)})} style={{padding: '5px'}}/>
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
      
      {/* Top Info Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>{asset.name}</h3>
          <span style={{ backgroundColor: statusColor, color: statusColor === '#ffc107' ? 'black' : 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
            {statusText}
          </span>
        </div>
        
        <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Category:</strong> {asset.category}</p>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>{asset.description}</p>
        <p style={{ margin: '10px 0', fontWeight: 'bold', color: '#28a745' }}>
          Available: {asset.available_quantity} / {asset.total_quantity}
        </p>
      </div>

      {/* Admin Operations */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
          <button onClick={() => setIsEditing(true)} style={{ padding: '5px 10px', background: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Edit</button>
          <button onClick={() => { if(window.confirm('Are you sure you want to delete this asset?')) onDelete(asset.asset_id) }} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Delete</button>
        </div>
      )}
      
      {/* User Booking Section */}
      <div style={{ marginTop: '15px', borderTop: '1px dashed #ccc', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ fontSize: '12px' }}>Qty:<br/>
            <input type="number" min="1" max={asset.available_quantity} value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: '40px' }} />
          </label>
          <label style={{ fontSize: '12px' }}>Start:<br/>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label style={{ fontSize: '12px' }}>End:<br/>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>
        {asset.available_quantity > 0 ? (
          <button onClick={() => onBook(asset.asset_id, qty, start, end)} style={{ padding: '8px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            Request Booking
          </button>
        ) : (
          <button disabled style={{ padding: '8px', background: '#ccc', color: 'white', border: 'none', borderRadius: '4px' }}>Out of Stock</button>
        )}
      </div>

    </div>
  );
}