import React from 'react';
import '../../styles/user_reservation_page.css';

function UserReservationPage() {
  return (
    <div className="user-reservation-page">
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

      <div className="reservation-page-container">
        <h2>Make a Reservation</h2>
        {/* TODO: Add reservation page content here */}
        <p>Select a building and date to view available slots.</p>
      </div>
    </div>
  );
}

export default UserReservationPage;
