import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function UserNavbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? { color: 'green' } : {};
  };

  return (
    <header>
      <div className="logo">
        <Link to="/user">
          <img src="/assets/images/taftlab-logo.png" alt="TaftLab Logo" />
        </Link>
      </div>

      <div className="header-right">
        <nav>
          <ul>
            <li><Link to="/user" style={isActive('/user')}>Home</Link></li>
            <li><Link to="/user/reservation-history" style={isActive('/user/reservation-history')}>My Reservations</Link></li>
            <li><Link to="/user/advanced-search" style={isActive('/user/advanced-search')}>Advanced Search</Link></li>
            <li><Link to="/user/profile" style={isActive('/user/profile')}>Profile</Link></li>
            <li><Link to="/login">Logout</Link></li>
          </ul>
        </nav>

        <div className="profile-icon">
          <Link to="/user/profile">
            <img src="/assets/images/profile-icon.png" alt="Profile Icon" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default UserNavbar;