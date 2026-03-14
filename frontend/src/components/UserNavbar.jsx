import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import taftlabLogo from '../assets/images/taftlab-logo.png';
import profileIcon from '../assets/images/profile-icon.png';

function UserNavbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? { color: 'green' } : {};
  };

  return (
    <header>
      <div className="logo">
        <Link to="/user">
          <img src={taftlabLogo} alt="TaftLab Logo" />
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
            <img src={profileIcon} alt="Profile Icon" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default UserNavbar;