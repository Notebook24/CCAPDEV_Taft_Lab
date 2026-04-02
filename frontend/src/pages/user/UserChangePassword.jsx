import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../../style/LoginSignup.css";
import "../../style/user_css/UserChangePassword.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';
import API_BASE_URL from '../../config/api';

function UserChangePassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('user_id');
      sessionStorage.removeItem('user_id');
      navigate('/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New password and confirmation do not match.');
      setMessageType('error');
      return;
    }
    if (formData.newPassword.length < 6) {
      setMessage('New password must be at least 6 characters long.');
      setMessageType('error');
      return;
    }
    try {
      const user_id = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
      if (!user_id) { navigate('/login'); return; }

      const response = await fetch(`${API_BASE_URL}/api/user/change-password/${user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: formData.currentPassword, newPassword: formData.newPassword })
      });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error || 'Failed to change password'); setMessageType('error'); return; }
      setMessage('Password changed successfully! Redirecting...');
      setMessageType('success');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => navigate('/user/profile'), 2000);
    } catch (err) {
      setMessage('An error occurred while changing your password');
      setMessageType('error');
    }
  };

  return (
    <>
      <header>
        <div className="logo"><Link to="/user"><img src={taftlabLogo} alt="TaftLab Logo" /></Link></div>
        <div className="header-right">
          <nav>
            <ul>
              <li><Link to="/user">Home</Link></li>
              <li><Link to="/user/reservation-history">My Reservations</Link></li>
              <li><Link to="/user/advanced-search">Advanced Search</Link></li>
              <li><Link to="/user/profile" style={{ color: 'green' }}>Profile</Link></li>
              <li><a href="#" onClick={handleLogout}>Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon"><Link to="/user/profile"><img src={profileIcon} alt="Profile Icon" /></Link></div>
        </div>
      </header>

      <div className="change-password-page">
        <div className="signup">
          <div className="signup-leftside">
            <h2>Change User Password</h2>
            <form onSubmit={handleSubmit}>
              <label htmlFor="currentPassword">Current Password</label>
              <input type="password" id="currentPassword" name="currentPassword" value={formData.currentPassword} onChange={handleChange} required />
              <label htmlFor="newPassword">New Password</label>
              <input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleChange} required />
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
              <button type="submit" className="top-btn">Change Password</button>
            </form>
            <button type="button" className="bottom-btn" onClick={() => navigate('/user/profile')}>Back</button>
            <div style={{
              marginTop: '15px', padding: '10px', borderRadius: '5px', minHeight: '20px',
              display: message ? 'block' : 'none',
              color: messageType === 'success' ? '#165b33' : '#d32f2f',
              backgroundColor: messageType === 'success' ? '#e8f5e9' : '#ffe6e6'
            }}>{message}</div>
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