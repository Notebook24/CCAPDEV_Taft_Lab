import React from 'react';

function AdminHomePage() {
  return (
    <div className="admin-homepage">
      <header>
        <div className="logo">
          <a href="/admin">
            <img src="/assets/images/taftlab-logo.png" alt="TaftLab Logo" />
          </a>
        </div>

        <div className="header-right">
          <nav>
            <ul>
              <li><a href="/admin" style={{ color: 'green' }}>Home</a></li>
              <li><a href="/admin/profile">Profile</a></li>
              <li><a href="/login">Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <img src="/assets/images/profile-icon.png" alt="Profile Icon" />
          </div>
        </div>
      </header>

      <div className="admin-subheader">
        <h2>Welcome, LabTech!</h2>
      </div>

      <div className="boxes-container">
        <div className="box">
          <img src="/assets/images/AG_1904_indoor_1.jpg" alt="Lab Picture" className="box-img" />
          <div className="box-text">
            <h3>Br. Andrew Gonzales Hall</h3>
            <p>Monitor and manage student computer lab reservations in Br. Andrew Gonzales Hall.</p>
            <a href="/admin/building-dashboard" className="admin-btn">Manage Rooms</a>
          </div>
        </div>

        <div className="box">
          <img src="/assets/images/GK_304B_indoor_1.jpg" alt="Lab Picture" className="box-img" />
          <div className="box-text">
            <h3>Gokongwei Hall</h3>
            <p>Monitor and manage student computer lab reservations in Gokongwei Hall.</p>
            <a href="/admin/building-dashboard" className="admin-btn">Manage Rooms</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHomePage;
