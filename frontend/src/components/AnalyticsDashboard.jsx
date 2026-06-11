import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement 
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export default function AnalyticsDashboard({ assets, bookings }) {
  if (assets.length === 0) return <p>Add assets to view analytics.</p>;

  const totalAssets = assets.reduce((sum, asset) => sum + asset.total_quantity, 0);
  const totalAvailable = assets.reduce((sum, asset) => sum + asset.available_quantity, 0);
  const activeBookings = bookings.filter(b => b.status === 'approved').length;
  
  const today = new Date();
  const overdueReturns = bookings.filter(b => {
    return b.status === 'approved' && new Date(b.end_date) < today;
  }).length;

  const utilizationRate = totalAssets === 0 ? 0 : Math.round(((totalAssets - totalAvailable) / totalAssets) * 100);

  const barData = {
    labels: assets.map(a => a.name),
    datasets: [
      { label: 'Available', data: assets.map(a => a.available_quantity), backgroundColor: '#28a745' },
      { label: 'Checked Out', data: assets.map(a => a.total_quantity - a.available_quantity), backgroundColor: '#ffc107' }
    ],
  };

  const usageCounts = bookings.reduce((acc, booking) => {
    acc[booking.asset_name] = (acc[booking.asset_name] || 0) + 1;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(usageCounts),
    datasets: [{
      data: Object.values(usageCounts),
      backgroundColor: ['#007bff', '#dc3545', '#ffc107', '#28a745', '#17a2b8', '#6c757d'],
    }]
  };

  const dateCounts = bookings.reduce((acc, booking) => {
    const date = new Date(booking.start_date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const lineData = {
    labels: Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b)), 
    datasets: [{
      label: 'New Bookings per Day',
      data: Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b)).map(date => dateCounts[date]),
      borderColor: '#007bff',
      fill: false,
      tension: 0.1
    }]
  };

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <SummaryCard title="Total Assets" value={totalAssets} color="#007bff" />
        <SummaryCard title="Active Bookings" value={activeBookings} color="#28a745" />
        <SummaryCard title="Overdue Returns" value={overdueReturns} color="#dc3545" />
        <SummaryCard title="Utilization Rate" value={`${utilizationRate}%`} color="#ffc107" />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div style={chartBoxStyle}>
          <h3 style={{textAlign: 'center'}}>Inventory Availability</h3>
          <Bar data={barData} options={{ responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }} />
        </div>
        
        <div style={chartBoxStyle}>
          <h3 style={{textAlign: 'center'}}>Most Requested Assets</h3>
          {Object.keys(usageCounts).length > 0 ? <Pie data={pieData} /> : <p style={{textAlign:'center'}}>No booking data yet.</p>}
        </div>

        <div style={{ ...chartBoxStyle, gridColumn: 'span 2' }}>
          <h3 style={{textAlign: 'center'}}>Booking Trends Over Time</h3>
          {Object.keys(dateCounts).length > 0 ? <Line data={lineData} /> : <p style={{textAlign:'center'}}>No booking data yet.</p>}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: '200px', padding: '20px', backgroundColor: 'white', borderLeft: `5px solid ${color}`, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</p>
      <h2 style={{ margin: 0, fontSize: '32px', color: '#333' }}>{value}</h2>
    </div>
  );
}

const chartBoxStyle = {
  backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center'
};