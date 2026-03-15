import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../../style/LoginSignup.css";
import "../../style/user_css/UserChangePassword.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';

function UserChangePassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New password and confirmation do not match.');
      return;
    }

    setMessage('Password changed successfully.');
    console.log('Change password attempted:', formData);
  };

  return (
    <>
      <header>
        <div className="logo">
          <Link to="/user">
            <img src={taftlabLogo} alt="TaftLab Logo" />
          </Link>
        </div>

        <div className="header-right">
          <nav>
            <ul>
              <li><Link to="/user">Home</Link></li>
              <li><Link to="/user/reservation-history">My Reservations</Link></li>
              <li><Link to="/user/advanced-search">Advanced Search</Link></li>
              <li><Link to="/user/profile" style={{ color: 'green' }}>Profile</Link></li>
              <li><Link to="/login">Logout</Link></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <Link to="/user/profile">
              <img src={profileIcon} alt="Profile Icon" />
            </Link>
          </div>
        </div>
      </header>

      <div className="change-password-page">
        <div className="signup">
          <div className="signup-leftside">
            <h2>Change User Password</h2>
            <form onSubmit={handleSubmit}>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
              />

              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
              />

              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />

              <button type="submit" className="top-btn">Change Password</button>
            </form>

            <button
              type="button"
              className="bottom-btn"
              onClick={() => navigate('/user/profile')}
            >
              Back
            </button>

            <div id="message">{message}</div>
          </div>

          <div className="signup-rightside">
            <img src={taftlabLogo} alt="TAFT LAB Logo" />
            <h2>Every Lasallian&apos;s Gateway to<br />DLSU Computer Labs.</h2>
            <p>Book your workspace today — at DLSU.</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default UserChangePassword;
