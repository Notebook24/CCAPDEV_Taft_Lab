import React from 'react';
import "../../style/Profile.css";

function AdminProfileView() {
  return (
    <div className="admin-profile">
      <header>
        <div className="logo">
          <a href="/admin">
            <img src="/assets/images/taftlab-logo.png" alt="TaftLab Logo" />
          </a>
        </div>

        <div className="header-right">
          <nav>
            <ul>
              <li><a href="/admin">Home</a></li>
              <li><a href="/admin/profile" style={{ color: 'green' }}>Profile</a></li>
              <li><a href="/login">Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <img src="/assets/images/profile-icon.png" alt="Profile Icon" />
          </div>
        </div>
      </header>

      <div className="profile-container">
        <h2>Profile</h2>
        {/* TODO: Add admin profile content here */}
        <p>Admin profile information will be displayed here.</p>
      </div>
    </div>
  );
}

export default AdminProfileView;
