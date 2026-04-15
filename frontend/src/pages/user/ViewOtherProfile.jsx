import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import profileIcon from '../../assets/images/profile-icon.png';
import "../../style/user_css/UserHomepage.css";
import "../../style/user_css/ViewOtherProfile.css";
import API_BASE_URL from '../../config/api';

// page for viewing other users' profiles and their reservation history
function ViewOtherProfile() {
  // states
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profilePicture, setProfilePicture] = useState(profileIcon);
  const userNameFromState = location.state?.userName || 'Unknown User';

  // fetch user profile data on component mount based on the username passed through state from the previous page. If no username is found, it will show an error message. It also handles fetching the user's profile picture and reservation history, with error handling for each step.
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // fetch user profile data based on username from state
        const response = await fetch(`${API_BASE_URL}/api/user/view-profile/${encodeURIComponent(userNameFromState)}`);
        // error
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user profile');
        }
        // if successful, set user data and reservations in state
        const data = await response.json();
        setUserData({
          _id: data._id,
          name: data.full_name,
          role: 'Student',
          college: data.college || 'N/A',
          bio: data.bio || 'No bio available',
        });
        setReservations(data.reservations || []);

        // profile pic handling
        if (data.profile_picture) {
          setProfilePicture(data.profile_picture);
        } 
        
        else if (data._id) {
          try {
            // fetch profile picture using user ID
            const picResponse = await fetch(`${API_BASE_URL}/api/user/profile-picture/${data._id}`);
            if (picResponse.ok) {
              const picData = await picResponse.json();
              setProfilePicture(picData.profile_picture || profileIcon);
            } 
            else {
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

    // now, fetch the user profile only if we have a valid username from state. 
    // If not, we can skip the fetch and just show an error message.
    if (userNameFromState !== 'Unknown User') 
      fetchUserProfile();
    else 
      setLoading(false);

  }, [userNameFromState]);

  // reservation status mapping
  function getStatusClass(status) {
    if (!status) 
      return '';

    // CSS classes for styling
    switch (status.toLowerCase()) {
      case 'completed': 
        return 'completed';
      case 'cancelled': 
        return 'cancelled';
      case 'ongoing':   
        return 'pending';
      case 'checked':   
        return 'active';
      default:          
        return 'pending';
    }
  }

  // formats date strings into a more readable format, 
  // or returns 'N/A' if the date string is invalid or missing
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // renders
  return (
    <>
      <UserNavbar />

      <div className="page-container">
        {loading && <p className="center-text">Loading profile...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && userData && (
          <>
            {/* PROFILE CARD */}
            <div className="other-profile">
              <div className="menu-card">
                <div className="profile-header">
                  <img 
                    src={profilePicture} 
                    alt="User-Picture" 
                    className="user-icon"
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src = profileIcon; 
                    }}
                  />
                  <div className="profile-info">
                    <h2 className="user-name">{userData.name}</h2>
                    <h4 className="user-role">{userData.role}</h4>
                    <h4 className="user-college">{userData.college}</h4>
                  </div>
                </div>
                <hr />
                <p className="profile-description">{userData.bio}</p>
              </div>
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