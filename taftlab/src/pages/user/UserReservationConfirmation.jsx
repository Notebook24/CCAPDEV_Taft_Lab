import React from 'react';
import '../../styles/user_reservation_confirmation.css';

function UserReservationConfirmation() {
  return (
    <div className="user-reservation-confirmation">
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

      <div className="confirmation-container">
        <h2>Reservation Confirmation</h2>
        {/* TODO: Add reservation confirmation details here */}
        <p>Your reservation details will be displayed here.</p>
        <button className="btn">Confirm Reservation</button>
      </div>
    </div>
  );
}

export default UserReservationConfirmation;
