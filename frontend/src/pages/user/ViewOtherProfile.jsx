import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import profileIcon from '../../assets/images/profile-icon.png';
import "../../style/user_css/ViewOtherProfile.css";

function ViewOtherProfile() {
  const location = useLocation();
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
        const response = await fetch(
          `http://localhost:3000/user/view-profile/${encodeURIComponent(userNameFromState)}`
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to fetch profile');
        }

        const data = await response.json();

        setUserData({
          id: data._id,
          name: data.full_name,
          role: 'Student',
          college: data.college || 'N/A',
          bio: data.bio || 'No bio available',
        });

        setReservations(data.reservations || []);

        if (data.profile_picture) {
          setProfilePicture(`http://localhost:3000/user/profile-picture/${data._id}`);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userNameFromState !== 'Unknown User') {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [userNameFromState]);

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
                  <img src={profilePicture} alt="profile" className="avatar" />
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
                        <p className="seat">Seat {r.seat}</p>   {/* plain <p>, no wrapper div or className that adds bg */}
                      </div>

                        <div className="card-right">
                          <span className={`status ${r.status.toLowerCase()}`}>{r.status}</span>
                          <div className="datetime">
                            <p>{r.date}</p>
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