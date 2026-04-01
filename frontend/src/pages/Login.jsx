import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../style/LoginSignup.css";
import taftLogo from '../assets/images/taftlab-logo.png';
import loginHexDesign from '../assets/images/login-hexdesign.png';
import API_BASE_URL from "../config/api";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // On mount: check if user is already logged in via session or localStorage
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check if there's an active session
        const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          credentials: 'include'
        });
        const data = await res.json();
        
        if (data.valid) {
          // Session is valid, redirect
          if (data.user_type === 'admin') navigate('/admin');
          else navigate('/user');
          return;
        }
        
        // If no session, check localStorage (for remember me)
        const user_id = localStorage.getItem('user_id');
        if (user_id) {
          const res2 = await fetch(`${API_BASE_URL}/api/auth/verify?user_id=${user_id}`, {
            credentials: 'include'
          });
          const data2 = await res2.json();
          if (data2.valid) {
            if (data2.user_type === 'admin') navigate('/admin');
            else navigate('/user');
            return;
          } else {
            localStorage.removeItem('user_id');
          }
        }
        
        setChecking(false);
      } catch {
        setChecking(false);
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
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
            // For non-remember sessions, don't store in localStorage
            localStorage.removeItem('user_id');
        }
        
        if (data.user_type === "student") navigate("/user");
        else if (data.user_type === "admin") navigate("/admin");
    } catch(err) {
        console.error(err);
    }
  };

  const handleSignupClick = (e) => {
    e.preventDefault();
    navigate('/signup');
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
            <label htmlFor="email">Email Address</label>
            <input type="text" id="email" name="email" placeholder="Enter your DLSU email here"
              value={email} onChange={(e) => setEmail(e.target.value)} required />

            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password here"
              value={password} onChange={(e) => setPassword(e.target.value)} required />

            <div className="remember-me">
              <input type="checkbox" id="remember" name="remember"
                checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              <label htmlFor="remember">Remember Me</label>
            </div>

            <button type="submit" className="top-btn">Log In</button>
          </form>

          <form method="POST" onSubmit={handleSignupClick}>
            <button type="submit" className="bottom-btn">Sign Up</button>
          </form>
        </div>

        <div className="login-rightside">
          <div className="hex-design" style={{width: '500px', height: '50px'}}>
            <img src={loginHexDesign} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;