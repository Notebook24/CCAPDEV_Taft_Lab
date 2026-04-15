import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../style/user_css/UserReservationSeats.css";
import API_BASE_URL from '../../config/api';

// page for selecting seats during the reservation process
function UserReservationSeats() {
  const navigate = useNavigate();

  // Add authentication check
  useEffect(() => {
    const checkAuth = async () => {
      // check if user exists in localStorage or sessionStorage
      const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
      if (!userId) {
        navigate('/login');
        return;
      }

      // verify user authentication with backend
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify?user_id=${userId}`, {
          credentials: 'include'
        });
        // if backend verification fails, clear user data and redirect to login
        const data = await response.json();

        // if user is not valid, clear user data and redirect to login
        if (!data.valid) {
          localStorage.removeItem('user_id');
          sessionStorage.removeItem('user_id');
          navigate('/login');
        }

      } catch (err) {
        console.error('Auth check failed:', err);
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // handles logout 
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('user_id');
      sessionStorage.removeItem('user_id');
      navigate('/login');
    }
  };

  // render
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
              <li><a href="#" onClick={handleLogout}>Logout</a></li>
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