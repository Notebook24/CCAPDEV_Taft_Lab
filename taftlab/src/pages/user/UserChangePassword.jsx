import React, { useState } from 'react';
import '../../styles/user_change_password.css';

function UserChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add change password logic here
    console.log('Change password attempted:', formData);
  };

  return (
    <div className="user-change-password">
      <header>
        <div className="logo">
          <a href="/user">
            <img src="/assets/images/taftlab-logo.png" alt="TaftLab Logo" />
          </a>
        </div>

        <div className="header-right">
          <nav>
            <ul>
              <li><a href="/user">Home</a></li>
              <li><a href="/user/profile">Profile</a></li>
              <li><a href="/login">Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <img src="/assets/images/profile-icon.png" alt="Profile Icon" />
          </div>
        </div>
      </header>

      <div className="change-password-container">
        <h2>Change Password</h2>
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

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <button type="submit" className="btn">Change Password</button>
        </form>
      </div>
    </div>
  );
}

export default UserChangePassword;
