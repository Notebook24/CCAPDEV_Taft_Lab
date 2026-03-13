import React from 'react';

function UserReservationSeats() {
  return (
    <div className="user-reservation-seats">
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

      <div className="reservation-seats-container">
        <h2>Select Your Seat</h2>
        {/* TODO: Add seat selection grid/map here */}
        <p>Click on an available seat to reserve it.</p>
      </div>
    </div>
  );
}

export default UserReservationSeats;
