import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import profileIcon from '../../assets/images/profile-icon.png';
import "../../style/Profile.css";
import "../../style/user_css/UserHomepage.css";

function ViewOtherProfile() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profilePicture, setProfilePicture] = useState(profileIcon);
  
  const userNameFromState = location.state?.userName || 'Unknown User';

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/user/view-profile/${encodeURIComponent(userNameFromState)}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user profile');
        }

        const data = await response.json();
        
        setUserData({
          _id: data._id,
          name: data.full_name,
          role: 'Student',
          college: data.college || 'N/A',
          description: data.bio || 'No bio available'
        });
        setReservations(data.reservations || []);
        
        // Set profile picture from the returned data
        if (data.profile_picture) {
          setProfilePicture(`http://localhost:3000/user/profile-picture/${data._id}`);
        } else {
          setProfilePicture(profileIcon);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.message);
        setUserData(null);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    if (userNameFromState && userNameFromState !== 'Unknown User') {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [userNameFromState]);

  useEffect(() => {
    const stylesheetUrls = ['/assets/style/profile.css'];

    const appendedLinks = [];
    stylesheetUrls.forEach((url) => {
      const existing = document.querySelector(`link[href="${url}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
        appendedLinks.push(link);
      }
    });

    return () => {
      appendedLinks.forEach((link) => document.head.removeChild(link));
    };
  }, []);

  const openModal = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    // TODO: Implement actual delete logic
    window.location.href = '/login';
  };

  return (
    <>
      <UserNavbar />

      <div className="subheader"></div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
          Loading user profile...
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '20px', fontSize: '16px', color: '#d9534f', background: '#fdeaea', borderRadius: '8px', margin: '20px' }}>
          Error: {error}
        </div>
      )}

      {!loading && userData && (
      <div className="other-profile">
        <div className="menu-card">
          <div className="profile-header">
            <img 
              src={profilePicture} 
              alt="User-Picture" 
              className="user-icon"
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div className="profile-info">
              <h2 className="user-name">{userData.name}</h2>
              <h4 className="user-role">{userData.role}</h4>
              <h4 className="user-college">{userData.college}</h4>
            </div>
          </div>
          <hr />

          <p className="profile-description">
            {userData.description}
          </p>
        </div>
      </div>
      )}

      {!loading && !error && (
      <div className="lower-box">
        <div id="reservationListView">
          <div id="cardContainer">
            {reservations && reservations.length > 0 ? (
              reservations.map((reservation) => (
                <div key={reservation.id} className="reservation-card" data-status={reservation.status}>
                  <div className="card-info">
                    <h2>{reservation.building}</h2>
                    <h3>{reservation.room}</h3>
                    <p>
                      Seat: {reservation.seat}<br />
                      {reservation.date}<br />
                      {reservation.time}
                    </p>
                    {reservation.status !== 'Active' && (
                      <span className={`status-badge status-${reservation.status}`}>
                        {reservation.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', padding: '20px' }}>No reservations found</p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Modal Backdrop */}
      <div
        className={`modal-backdrop${isModalOpen ? ' is-open' : ''}`}
        id="deleteModal"
        aria-hidden={!isModalOpen}
        onClick={closeModal}
      >
        <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle">
          <h3 id="deleteModalTitle">Delete Account</h3>
          <p>Are you Sure????</p>
          <div className="modal-actions">
            <button
              className="modal-btn cancel"
              type="button"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              className="modal-btn danger"
              type="button"
              onClick={handleConfirmDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.45);
          z-index: 1200;
        }

        .modal-backdrop.is-open {
          display: flex;
        }

        .modal-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px 24px;
          width: 380px;
          max-width: calc(100% - 32px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
          text-align: center;
        }

        .modal-card h3 {
          margin: 0 0 10px;
        }

        .modal-card p {
          margin: 0 0 16px;
          font-size: 14px;
          color: #2e2e2e;
        }

        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .modal-btn {
          border: none;
          padding: 8px 18px;
          border-radius: 18px;
          font-weight: 600;
          cursor: pointer;
        }

        .modal-btn.cancel {
          background: #e6ece8;
          color: #264237;
        }

        .modal-btn.danger {
          background: #b64343;
          color: #ffffff;
        }
      `}</style>
    </>
  );
}

export default ViewOtherProfile;