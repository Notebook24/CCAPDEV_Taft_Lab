import React from 'react';
import '../../styles/profile.css';

function ViewOtherProfile() {
  return (
    <div className="view-other-profile">
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
              <li><a href="/user/reservation-history">My Reservations</a></li>
              <li><a href="/user/advanced-search">Advanced Search</a></li>
              <li><a href="/user/profile">Profile</a></li>
              <li><a href="/login">Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <a href="/user/profile">
              <img src="/assets/images/profile-icon.png" alt="Profile Icon" />
            </a>
          </div>
        </div>
      </header>

      <div className="profile-container">
        <h2>User Profile</h2>
        {/* TODO: Add other user's profile content here */}
        <p>View other user's profile information.</p>
      </div>
    </div>
  );
}

export default ViewOtherProfile;
