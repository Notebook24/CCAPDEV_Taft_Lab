import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Add the CSS link for this page
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/style/login_signup.css';
    document.head.appendChild(link);

    return () => {
      // Cleanup: remove the link when component unmounts
      document.head.removeChild(link);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // TODO: Add authentication logic here
    console.log('Login attempted with:', email, password);
    
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json"}, //data type of request body is in json format for pairing with back end
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if(!response.ok) {
        return setErrorMessage(data.message);
      }

      console.log("Login successful:", data);

      if(data.user_type === "student") {
        navigate("/user");
      } 
      else if(data.user_type === "admin") {
        navigate("/admin");
      }
    }
    catch(err) {
      console.error(err);
    }
  };

  const handleSignupClick = (e) => {
    e.preventDefault();
    navigate('/signup');
  };

  return (
    <div className="login-page-container">
      <div className="login">
        <div className="login-leftside">
          <img src="/assets/images/taftlab-logo.png" alt="TAFT LAB Logo" className="login-logo" />

          {/* Error message placeholder */}
          <div id="error-message" style={{ display: errorMessage ? 'block' : 'none', color: 'red', marginBottom: '15px' }}>
            <p id="error-text">{errorMessage}</p>
          </div>

          <form method="POST" onSubmit={handleSubmit}>
            <label htmlFor="email">Email Address</label>
            <input
              type="text"
              id="email"
              name="email"
              placeholder="Enter your DLSU email here"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password here"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="remember-me">
              <input type="checkbox" id="remember" name="remember" />
              <label htmlFor="remember">Remember Me</label>
            </div>

            <button type="submit" className="top-btn">Log In</button>
          </form>

          <form method="POST" onSubmit={handleSignupClick}>
            <button type="submit" className="bottom-btn">Sign Up</button>
          </form>
        </div>

        <div className="login-rightside">
          <div className="hex-design"></div>
        </div>
      </div>
    </div>
  );
}

export default Login;
