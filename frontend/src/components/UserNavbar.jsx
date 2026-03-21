import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import taftlabLogo from '../assets/images/taftlab-logo.png';
import profileIcon from '../assets/images/profile-icon.png';

function UserNavbar() {
  const location = useLocation();
  const [profilePicture, setProfilePicture] = useState(profileIcon);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('user_id');
    setUserId(id);
    
    if (id) {
      // Check if user has a custom profile picture
      fetch(`http://localhost:3000/user/profile-picture/${id}`)
        .then(response => {
          if (response.ok && !response.url.includes('profile-icon.png')) {
            setProfilePicture(response.url);
          }
        })
        .catch(() => {
          setProfilePicture(profileIcon);
        });
    }
  }, []);

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
            <img 
              src={profilePicture} 
              alt="Profile Icon" 
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default UserNavbar;