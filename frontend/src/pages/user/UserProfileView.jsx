import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import "../../style/Profile.css";
import profileIcon from '../../assets/images/profile-icon.png';
import editProfileIcon from '../../assets/images/edit-profile-icon.png';
import reservationIcon from '../../assets/images/reservation-icon.png';
import passwordIcon from '../../assets/images/password-icon.png';
import trashIcon from '../../assets/images/trash-icon.png';

function UserProfileView() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    student_type: '',
    department: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user_id = localStorage.getItem('user_id');
        console.log('Retrieved user_id from localStorage:', user_id);
        
        if (!user_id) {
          console.error('No user_id found in localStorage');
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:3000/user/profile/${user_id}`);
        const data = await response.json();

        console.log('Profile response:', data);
        console.log('Bio from response:', data.bio);
        console.log('Full bio value:', JSON.stringify(data.bio));

        if (!response.ok) {
          console.error('Error fetching profile:', data.error);
          setLoading(false);
          return;
        }

        console.log('Setting user data:', data);
        setUserData(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const handleConfirmDelete = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div>
        <UserNavbar />
        <div className="subheader" />
        <div className="user-profile">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <UserNavbar />
      <div className="subheader" />

      <div className="user-profile">
        <div className="menu-card">
          <div className="profile-header">
            <img src={profileIcon} alt="User-Picture" className="user-icon" />
            <div className="profile-info">
              <h2 className="user-name">{userData.full_name}</h2>
              <h4 className="user-role">Student</h4>
              <h4 className="user-college">{userData.department}</h4>
            </div>
          </div>
          <hr />

          <p className="profile-description">
            {userData.bio || "No bio added yet. Share something about yourself..."}
          </p>

          <div className="option-box-container">
            <Link to="/user/edit-profile" style={{ textDecoration: 'none', color: 'white' }}>
              <div className="option-box">
                Edit Profile
                <img src={editProfileIcon} alt="edit-profile" className="option-icon" />
              </div>
            </Link>

            <Link to="/user/reservation-history" style={{ textDecoration: 'none', color: 'white' }}>
              <div className="option-box">
                See Reservations
                <img src={reservationIcon} alt="reservation-icon" className="option-icon" />
              </div>
            </Link>

            <Link to="/user/change-password" style={{ textDecoration: 'none', color: 'white' }}>
              <div className="option-box">
                Change Password
                <img src={passwordIcon} alt="password-icon" className="option-icon" />
              </div>
            </Link>

            <a
              href="/"
              id="deleteAccountLink"
              style={{ textDecoration: 'none', color: 'white' }}
              onClick={(event) => {
                event.preventDefault();
                openDeleteModal();
              }}
            >
              <div className="option-box">
                Delete Account
                <img src={trashIcon} alt="trash-icon" className="option-icon" />
              </div>
            </a>
          </div>
        </div>
      </div>

      <div
        className={`modal-backdrop ${isDeleteModalOpen ? 'is-open' : ''}`}
        id="deleteModal"
        aria-hidden={!isDeleteModalOpen}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeDeleteModal();
          }
        }}
      >
        <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle">
          <h3 id="deleteModalTitle">Delete Account</h3>
          <p>Are you Sure????</p>
          <div className="modal-actions">
            <button className="modal-btn cancel" type="button" id="cancelDeleteBtn" onClick={closeDeleteModal}>
              Cancel
            </button>
            <button className="modal-btn danger" type="button" id="confirmDeleteBtn" onClick={handleConfirmDelete}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileView;
