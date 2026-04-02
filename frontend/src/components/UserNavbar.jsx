import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import taftlabLogo from '../assets/images/taftlab-logo.png';
import profileIcon from '../assets/images/profile-icon.png';
import API_BASE_URL from '../config/api';

function UserNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState(profileIcon);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Check both localStorage and sessionStorage
    const id = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
    setUserId(id);
    
    if (id) {
      fetch(`${API_BASE_URL}/api/user/profile-picture/${id}`)
        .then(response => {
          if (response.ok) {
            setProfilePicture(`${API_BASE_URL}/api/user/profile-picture/${id}`);
          }
        })
        .catch(() => {
          setProfilePicture(profileIcon);
        });
    }
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      // Call the logout API endpoint
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear both storages regardless of API response
      localStorage.removeItem('user_id');
      sessionStorage.removeItem('user_id');
      
      // Redirect to login page
      navigate('/login');
    }
  };

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
            <li><a href="#" onClick={handleLogout}>Logout</a></li>
          </ul>
        </nav>

        <div className="profile-icon">
          <Link to="/user/profile">
            <img 
              src={profilePicture} 
              alt="Profile Icon" 
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => { e.target.onerror = null; e.target.src = profileIcon; }}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default UserNavbar;