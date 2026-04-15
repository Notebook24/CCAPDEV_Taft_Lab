import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../style/LoginSignup.css";
import taftLogo from '../assets/images/taftlab-logo.png';
import API_BASE_URL from "../config/api";

// admin login page with authentication check and error handling. 
function AdminLogin() {
  // states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      // remmeber me functionality:
      const user_id = localStorage.getItem('user_id') || sessionStorage.getItem('user_id'); 
      // if no user ID is found in either storage, stop checking and allow login
      if (!user_id) { setChecking(false); 
        return; 
      }

      // veriyf with backend if the user ID is valid and if the user is an admin. 
      try {
        // verify user session with backend
        const res = await fetch(`${API_BASE_URL}/api/auth/verify?user_id=${user_id}`, {
          credentials: 'include'
        });
        const data = await res.json();

        // if user is valid and admin, redirect to admin page
        if (data.valid && data.user_type === 'admin') {
          navigate('/admin');
        } 

        else {
          localStorage.removeItem('user_id');
          sessionStorage.removeItem('user_id');
          setChecking(false);
        }
      } catch {
        setChecking(false);
      }
    };
    checkSession();
  }, [navigate]);

  // handles form submission for admin login, 
  // sends credentials to backend, 
  // processes response with error handling. 
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
      if (!response.ok) { 
        return setErrorMessage(data.message); }
      if (data.user_id) {
        // if rememberMe is checked, store user ID and type in localStorage, 
        // clear the other storage to prevent conflicts just in case
        if (rememberMe) {
          localStorage.setItem('user_id', data.user_id);
          localStorage.setItem('user_type', data.user_type);
          sessionStorage.removeItem('user_id');
        } 
        // if rememberMe is not checked, store in sessionStorage and clear localStorage
        else {
          sessionStorage.setItem('user_id', data.user_id);
          sessionStorage.setItem('user_type', data.user_type);
          localStorage.removeItem('user_id');
        }
      }
      // go to admin page after successful login
      navigate("/admin");
    } catch (err) {
      console.error(err);
      setErrorMessage("Connection error. Please try again.");
    }
  };

  // handles back to user login button click, simply redirects to user login page.
  const handleBackToUserLogin = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  // if we're still checking for an existing session, 
  // don't render anything 
  if (checking) 
    return null;

  // renderss
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