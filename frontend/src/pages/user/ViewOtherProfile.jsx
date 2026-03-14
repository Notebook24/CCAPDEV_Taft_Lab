import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import "../../style/Profile.css";
import "../../style/user_css/UserHomepage.css";

function ViewOtherProfile() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userNameFromState = location.state?.userName || 'Kien Ong';

  // Mock user data - replace with API call
  const userData = {
    name: userNameFromState,
    role: 'Student',
    college: 'College of Computer Studies',
    description: 'Hi! My name is Kien. I am a Second Year BS-IT student from the College of Computer Studies. I am passionate about learning technology, improving my skills in computing, and exploring new ideas that can help me grow both academically and personally.'
  };

  // Mock reservation data
  const reservations = [
    {
      id: 1,
      building: 'Gokongwei Hall',
      room: 'GK304B',
      seat: 'B12',
      date: 'February 5, 2026',
      time: '09:15 AM - 10:45 AM',
      status: 'Active'
    },
    {
      id: 2,
      building: 'St. La Salle Hall',
      room: 'LS229',
      seat: 'A07',
      date: 'February 10, 2026',
      time: '02:30 PM - 04:00 PM',
      status: 'Active'
    },
    {
      id: 3,
      building: 'Velasco Hall',
      room: 'V103',
      seat: 'C03',
      date: 'January 20, 2026',
      time: '11:00 AM - 12:30 PM',
      status: 'Completed'
    },
    {
      id: 4,
      building: 'Br. Andrew Gonzales Hall',
      room: 'AG1904',
      seat: 'D21',
      date: 'January 15, 2026',
      time: '04:30 PM - 06:00 PM',
      status: 'Cancelled'
    }
  ];

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

      <div className="other-profile">
        <div className="menu-card">
          <div className="profile-header">
            <img src="/assets/images/profile-icon.png" alt="User-Picture" className="user-icon" />
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

      <div className="lower-box">
        <div id="reservationListView">
          <div id="cardContainer">
            {reservations.map((reservation) => (
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
            ))}
          </div>
        </div>
      </div>

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
