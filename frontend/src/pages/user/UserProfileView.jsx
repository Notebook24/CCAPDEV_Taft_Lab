import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import "../../style/Profile.css";

function UserProfileView() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    
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
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const handleConfirmDelete = () => {
    navigate('/login');
  };


  //Note for ivan or Kien
  //The data is still hardcoded for now

  return (
    <div>
      <UserNavbar />
      <div className="subheader" />

      <div className="user-profile">
        <div className="menu-card">
          <div className="profile-header">
            <img src="/assets/images/profile-icon.png" alt="User-Picture" className="user-icon" />
            <div className="profile-info">
              <h2 className="user-name">Ivan Florendo</h2>
              <h4 className="user-role">Student</h4>
              <h4 className="user-college">College of Computer Studies</h4>
            </div>
          </div>
          <hr />

          <p className="profile-description">
            Hi! My name is Ivan. I am a Second Year BS-IT student from the College of Computer Studies. During my free time,
            I like to play video games, watch netflix series, and listen to music. Im currently excited and waiting for the
            release of Resident Evil: Requiem!
          </p>

          <div className="option-box-container">
            <Link to="/user/edit-profile" style={{ textDecoration: 'none', color: 'white' }}>
              <div className="option-box">
                Edit Profile
                <img src="/assets/images/edit-profile-icon.png" alt="edit-profile" className="option-icon" />
              </div>
            </Link>

            <Link to="/user/reservation-history" style={{ textDecoration: 'none', color: 'white' }}>
              <div className="option-box">
                See Reservations
                <img src="/assets/images/reservation-icon.png" alt="reservation-icon" className="option-icon" />
              </div>
            </Link>

            <Link to="/user/change-password" style={{ textDecoration: 'none', color: 'white' }}>
              <div className="option-box">
                Change Password
                <img src="/assets/images/password-icon.png" alt="password-icon" className="option-icon" />
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
                <img src="/assets/images/trash-icon.png" alt="trash-icon" className="option-icon" />
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
