import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import profileIcon from '../../assets/images/profile-icon.png';
import "../../style/Profile.css";
import "../../style/user_css/UserHomepage.css";
import API_BASE_URL from '../../config/api';

function ViewOtherProfile() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profilePicture, setProfilePicture] = useState(profileIcon);
  const userNameFromState = location.state?.userName || 'Unknown User';

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/user/view-profile/${encodeURIComponent(userNameFromState)}`);
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
        
        // Set profile picture from the data or fetch separately
        if (data.profile_picture) {
          // If the profile picture URL is directly in the response
          setProfilePicture(data.profile_picture);
        } else if (data._id) {
          // Fetch profile picture separately if not included
          try {
            const picResponse = await fetch(`${API_BASE_URL}/api/user/profile-picture/${data._id}`);
            if (picResponse.ok) {
              const picData = await picResponse.json();
              setProfilePicture(picData.profile_picture || profileIcon);
            } else {
              setProfilePicture(profileIcon);
            }
          } catch (err) {
            console.error('Error fetching profile picture:', err);
            setProfilePicture(profileIcon);
          }
        } else {
          setProfilePicture(profileIcon);
        }
        
        setError(null);
      } catch (err) {
        setError(err.message);
        setUserData(null);
        setReservations([]);
        setProfilePicture(profileIcon);
      } finally {
        setLoading(false);
      }
    };
    if (userNameFromState && userNameFromState !== 'Unknown User') fetchUserProfile();
    else setLoading(false);
  }, [userNameFromState]);

  const closeModal = () => setIsModalOpen(false);
  const handleConfirmDelete = () => { window.location.href = '/login'; };

  return (
    <>
      <UserNavbar />

      <div className="page-container">
        {loading && <p className="center-text">Loading profile...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && userData && (
          <>
            {/* PROFILE CARD */}
            <div className="profile-card">
              <div className="corner corner-tr" />
              <div className="corner corner-bl" />
              <div className="profile-top">
                <img 
                  src={profilePicture} 
                  alt="profile" 
                  className="avatar"
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = profileIcon; 
                  }}
                />
                <div className="profile-details">
                  <h2>{userData.name}</h2>
                  <p className="role">{userData.role}</p>
                  <span className="college">{userData.college}</span>
                </div>
              </div>
              <hr className="bio-divider" />
              <p className="profile-bio">{userData.description}</p>
              <div className="bottom-accent" />
            </div>

            {/* SECTION HEADER */}
            <div className="reservations-header">
              <h3>{userData.name.split(' ')[0]}'s Reservations</h3>
              <p>{reservations.length} reservation{reservations.length !== 1 ? 's' : ''} total</p>
            </div>

            {/* RESERVATIONS */}
            <div className="reservation-section">
              {reservations && reservations.length > 0 ? (
                <div className="card-grid">
                  {reservations.map((reservation) => (
                    <div key={reservation.id} className="reservation-card">
                      <div className="card-left">
                        <span className="building-label">Building</span>
                        <h3 className="building">{reservation.building}</h3>
                        <p className="room">{reservation.room}</p>
                        <p className="seat">Seat {reservation.seat}</p>
                      </div>
                      <div className="card-right">
                        <span className={`status ${reservation.status.toLowerCase()}`}>{reservation.status}</span>
                        <div className="datetime">
                          <p>{reservation.date}</p>
                          <p>{reservation.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="center-text">No reservations found</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className={`modal-backdrop${isModalOpen ? ' is-open' : ''}`} onClick={closeModal}>
        <div className="modal-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
          <h3>Delete Account</h3>
          <p>Are you Sure????</p>
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={closeModal}>Cancel</button>
            <button className="modal-btn danger" onClick={handleConfirmDelete}>Delete</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ViewOtherProfile;