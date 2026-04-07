import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import taftlabLogo from '../assets/images/taftlab-logo.png';
import profileIcon from '../assets/images/profile-icon.png';
import API_BASE_URL from '../config/api';

function UserNavbar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [profilePicture, setProfilePicture] = useState(profileIcon);

  useEffect(() => {
    const id = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
    if (!id) return;

    // Fetch the profile — the profile_picture field is now a Cloudinary URL
    fetch(`${API_BASE_URL}/api/user/profile/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.profile_picture) {
          setProfilePicture(data.profile_picture);
        }
      })
      .catch(() => setProfilePicture(profileIcon));
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('user_id');
      sessionStorage.removeItem('user_id');
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path ? { color: 'green' } : {};

  return (
    <header>
      <div className="logo">
        <Link to="/user"><img src={taftlabLogo} alt="TaftLab Logo" /></Link>
      </div>

      <div className="header-right">
        <nav>
          <ul>
            <li><Link to="/user" style={isActive('/user')}>Home</Link></li>
            <li><Link to="/user/about" style={isActive('/user/about')}>About</Link></li>
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