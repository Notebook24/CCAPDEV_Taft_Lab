import React from 'react';
import "../../style/admin_css/AdminManageSeatReservations.css";

function AdminManageSeatReservations() {
  return (
    <div className="admin-manage-reservations">
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

      <div className="manage-reservations-container">
        <h2>Manage Seat Reservations</h2>
        {/* TODO: Add seat reservation management content here */}
        <p>View and manage all seat reservations.</p>
      </div>
    </div>
  );
}

export default AdminManageSeatReservations;
