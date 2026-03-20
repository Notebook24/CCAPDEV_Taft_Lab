import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../style/Profile.css";
import profileIcon from '../../assets/images/profile-icon.png';
import editProfileIcon from '../../assets/images/edit-profile-icon.png';
import passwordIcon from '../../assets/images/password-icon.png';
import trashIcon from '../../assets/images/trash-icon.png';

function AdminProfileView() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminData, setAdminData] = useState({
    full_name: '',
    email: '',
    user_type: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const user_id = localStorage.getItem('user_id');
        console.log('Retrieved user_id from localStorage:', user_id);
        
        if (!user_id) {
          console.error('No user_id found in localStorage');
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:3000/admin/profile/${user_id}`);
        const data = await response.json();

        console.log('Admin profile response:', data);

        if (!response.ok) {
          console.error('Error fetching admin profile:', data.error);
          setLoading(false);
          return;
        }

        console.log('Setting admin data:', data);
        setAdminData(data);
      } catch (err) {
        console.error('Error fetching admin profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, [navigate]);

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const handleConfirmDelete = async () => {
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        console.error('No user_id found in localStorage');
        alert('Error: User ID not found');
        return;
      }

      // Use the admin-specific delete endpoint
      const response = await fetch(`http://localhost:3000/admin/delete/${user_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error deleting account:', data.error);
        alert('Error deleting account: ' + data.error);
        return;
      }

      // Clear localStorage and navigate to login
      localStorage.clear();
      closeDeleteModal();
      alert('Admin account deleted successfully!');
      navigate('/admin-login');
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Error deleting account: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="admin-profile">
        <header>
          <div className="logo">
            <a href="/admin">
              <img src="/assets/images/taftlab-logo.png" alt="TaftLab Logo" />
            </a>
          </div>
          <div className="header-right">
            <nav>
              <ul>
                <li><a href="/admin">Home</a></li>
                <li><a href="/admin/add-lab-technician">Add Lab Technician</a></li>
                <li><a href="/admin/profile" style={{ color: 'green' }}>Profile</a></li>
                <li><a href="#" onClick={handleLogout}>Logout</a></li>
              </ul>
            </nav>
            <div className="profile-icon">
              <img src={profileIcon} alt="Profile Icon" />
            </div>
          </div>
        </header>
        <div className="subheader" />
        <div className="user-profile">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profile">
      <header>
        <div className="logo">
          <a href="/admin">
            <img src="/assets/images/taftlab-logo.png" alt="TaftLab Logo" />
          </a>
        </div>
        <div className="header-right">
          <nav>
            <ul>
              <li><a href="/admin">Home</a></li>
              <li><a href="/admin/add-lab-technician">Add Lab Technician</a></li>
              <li><a href="/admin/profile" style={{ color: 'green' }}>Profile</a></li>
              <li><a href="#" onClick={handleLogout}>Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <img src={profileIcon} alt="Profile Icon" />
          </div>
        </div>
      </header>

      <div className="subheader" />

      <div className="user-profile">
        <div className="menu-card">
          <div className="profile-header">
            <img src={profileIcon} alt="User-Picture" className="user-icon" />
            <div className="profile-info">
              <h2 className="user-name">{adminData.full_name}</h2>
              <h4 className="user-role">Lab Technician / Administrator</h4>
              <h4 className="user-college">{adminData.email}</h4>
            </div>
          </div>
          <hr />

          <p className="profile-description">
            Welcome to your admin dashboard. You have access to manage computer laboratories, view reservations, and add new lab technicians.
          </p>

          <div className="option-box-container">
            <div className="option-box" onClick={openDeleteModal} style={{ cursor: 'pointer' }}>
              Delete Account
              <img src={trashIcon} alt="trash-icon" className="option-icon" />
            </div>
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
          <p>Are you sure you want to delete your admin account? This action cannot be undone.</p>
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

export default AdminProfileView;