import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import profileIcon from '../../assets/images/profile-icon.png';
import "../../style/user_css/ViewOtherProfile.css";
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
          bio: data.bio || 'No bio available',
        });
        setReservations(data.reservations || []);

        if (data.profile_picture) {
          setProfilePicture(data.profile_picture);
        } else if (data._id) {
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

    if (userNameFromState !== 'Unknown User') fetchUserProfile();
    else setLoading(false);
  }, [userNameFromState]);

  function getStatusClass(status) {
    if (!status) return '';
    switch (status.toLowerCase()) {
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      case 'ongoing':   return 'pending';
      case 'checked':   return 'active';
      default:          return 'pending';
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

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
                  onError={e => { e.target.onerror = null; e.target.src = profileIcon; }}
                />
                <div className="profile-details">
                  <h2>{userData.name}</h2>
                  <p className="role">{userData.role}</p>
                  <span className="college">{userData.college}</span>
                </div>
              </div>
              <hr className="bio-divider" />
              <p className="profile-bio">{userData.bio}</p>
              <div className="bottom-accent" />
            </div>

            {/* SECTION HEADER */}
            <div className="reservations-header">
              <h3>{userData.name.split(' ')[0]}'s Reservations</h3>
              <p>{reservations.length} reservation{reservations.length !== 1 ? 's' : ''} total</p>
            </div>

            {/* RESERVATIONS */}
            <div className="reservation-section">
              {reservations.length > 0 ? (
                <div className="card-grid">
                  {reservations.map((r) => (
                    <div key={r.id} className="reservation-card">
                      <div className="card-left">
                        <span className="building-label">Building</span>
                        <h3 className="building">{r.building}</h3>
                        <p className="room">{r.room}</p>
                        <p className="seat">Seat {r.seat}</p>
                      </div>
                      <div className="card-right">
                        <span className={`status ${getStatusClass(r.status)}`}>{r.status}</span>
                        <div className="datetime">
                          <p>{formatDate(r.date)}</p>
                          <p>{r.time}</p>
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
    </>
  );
}

export default ViewOtherProfile;