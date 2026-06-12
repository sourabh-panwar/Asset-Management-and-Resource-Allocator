import { useState } from 'react';

export default function AuthScreen({ onLoginSuccess }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('user');
  
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true); 
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
    } finally {
      setIsLoading(false); 
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); 
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
    } catch (error) { 
      console.error(error); 
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', width: '350px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>IITR Asset Manager</h2>
        
        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
          <button onClick={() => setIsLoginView(true)} disabled={isLoading} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: isLoginView ? 'bold' : 'normal', borderBottom: isLoginView ? '3px solid #007bff' : '3px solid transparent' }}>Login</button>
          <button onClick={() => setIsLoginView(false)} disabled={isLoading} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: !isLoginView ? 'bold' : 'normal', borderBottom: !isLoginView ? '3px solid #007bff' : '3px solid transparent' }}>Register</button>
        </div>

        <form onSubmit={isLoginView ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLoginView && (
            <>
              <input type="text" placeholder="Full Name" value={authName} onChange={(e) => setAuthName(e.target.value)} required disabled={isLoading} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
              <select value={authRole} onChange={(e) => setAuthRole(e.target.value)} disabled={isLoading} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <option value="user">Student / User</option>
                <option value="admin">Administrator</option>
              </select>
            </>
          )}
          <input type="email" placeholder="Email Address" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required disabled={isLoading} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
          <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required disabled={isLoading} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
          
          <button type="submit" disabled={isLoading} style={{ padding: '12px', background: isLoading ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
            {isLoading ? 'Processing...' : (isLoginView ? 'Log In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}