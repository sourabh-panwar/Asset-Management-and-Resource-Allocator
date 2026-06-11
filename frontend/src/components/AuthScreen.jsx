import { useState } from 'react';

export default function AuthScreen({ onLoginSuccess }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('user');

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
    } catch (error) { console.error(error); }
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
        onLoginSuccess(data.user); 
      } else {
        alert(`Login failed: ${data.error}`);
      }
    } catch (error) { console.error(error); }
  };

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