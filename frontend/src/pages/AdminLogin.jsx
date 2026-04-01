import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../style/LoginSignup.css";
import taftLogo from '../assets/images/taftlab-logo.png';
import API_BASE_URL from "../config/api";

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) { setChecking(false); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/verify?user_id=${user_id}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.valid && data.user_type === 'admin') {
          navigate('/admin');
        } else {
          setChecking(false);
        }
      } catch {
        setChecking(false);
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password, rememberMe })
        });
        const data = await response.json();
        if (!response.ok) { return setErrorMessage(data.message); }
        
        // Only store user_id in localStorage if rememberMe is checked
        if (rememberMe && data.user_id) {
            localStorage.setItem('user_id', data.user_id);
        } else {
            localStorage.removeItem('user_id');
        }
        
        navigate("/admin");
    } catch (err) {
        console.error(err);
        setErrorMessage("Connection error. Please try again.");
    }
  };

  const handleBackToUserLogin = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  if (checking) return null;

  return (
    <div className="login-page-container">
      <div className="login">
        <div className="login-leftside">
          <img src={taftLogo} alt="TAFT LAB Logo" className="login-logo" />

          <div id="error-message" style={{ display: errorMessage ? 'block' : 'none', color: 'red', marginBottom: '15px' }}>
            <p id="error-text">{errorMessage}</p>
          </div>

          <form method="POST" onSubmit={handleSubmit}>
            <label htmlFor="email">Admin Email Address</label>
            <input type="text" id="email" name="email" placeholder="Enter your admin email here"
              value={email} onChange={(e) => setEmail(e.target.value)} required />

            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password here"
              value={password} onChange={(e) => setPassword(e.target.value)} required />

            <div className="remember-me">
              <input type="checkbox" id="remember" name="remember"
                checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              <label htmlFor="remember">Remember Me</label>
            </div>

            <button type="submit" className="top-btn">Admin Log In</button>
          </form>

          <form method="POST" onSubmit={handleBackToUserLogin}>
            <button type="submit" className="bottom-btn">Back to User Login</button>
          </form>
        </div>

        <div className="login-rightside">
          <div className="hex-design"></div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;