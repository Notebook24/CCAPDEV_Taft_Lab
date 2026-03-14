import React from 'react';
import "../../style/admin_css/AdminBuildingDashboard.css";

function AdminBuildingDashboard() {
  return (
    <div className="admin-building-dashboard">
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
              <li><a href="/admin/profile">Profile</a></li>
              <li><a href="/login">Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <img src="/assets/images/profile-icon.png" alt="Profile Icon" />
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <h2>Building Dashboard</h2>
        {/* TODO: Add building dashboard content here */}
        <p>Manage rooms and reservations for this building.</p>
      </div>
    </div>
  );
}

export default AdminBuildingDashboard;
