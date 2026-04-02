import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import "../../style/Profile.css";
import profileIcon from '../../assets/images/profile-icon.png';
import editProfileIcon from '../../assets/images/edit-profile-icon.png';
import reservationIcon from '../../assets/images/reservation-icon.png';
import passwordIcon from '../../assets/images/password-icon.png';
import trashIcon from '../../assets/images/trash-icon.png';
import API_BASE_URL from '../../config/api';

function UserProfileView() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    student_type: '',
    department: '',
    bio: '',
    profile_picture: null
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  const user_id = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');

  const getProfilePictureUrl = () => {
    if (userData.profile_picture) {
      return `${API_BASE_URL}/api/user/profile-picture/${user_id}`;
    }
    return profileIcon;
  };

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

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        console.log('Retrieved user_id from storage:', user_id);
        
        if (!user_id) {
          console.error('No user_id found in storage');
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/user/profile/${user_id}`);
        const data = await response.json();

        if (!response.ok) {
          console.error('Error fetching profile:', data.error);
          setLoading(false);
          return;
        }

        setUserData(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('profile_picture', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/upload-profile-picture/${user_id}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      alert('Profile picture uploaded successfully!');
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      // Refresh user data to get the new profile_picture field
      const profileResponse = await fetch(`${API_BASE_URL}/api/user/profile/${user_id}`);
      const profileData = await profileResponse.json();
      setUserData(profileData);
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Failed to upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);
  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const handleConfirmDelete = async () => {
    try {
      if (!user_id) {
        console.error('No user_id found in storage');
        alert('Error: User ID not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/view-profile/${user_id}/delete_user`, {
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

      localStorage.clear();
      sessionStorage.clear();
      closeDeleteModal();
      navigate('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Error deleting account: ' + err.message);
    }
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
            <div style={{ position: 'relative' }}>
              <img 
                src={getProfilePictureUrl()} 
                alt="User-Picture" 
                className="user-icon"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <button
                onClick={openUploadModal}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: '#006937',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid white'
                }}
              >
                <p style={{color: 'white'}}>+</p>
              </button>
            </div>
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
              href="#"
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

      {/* Upload Profile Picture Modal */}
      <div
        className={`modal-backdrop ${isUploadModalOpen ? 'is-open' : ''}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeUploadModal();
          }
        }}
      >
        <div className="modal-card">
          <h3>Upload Profile Picture</h3>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleFileSelect}
            style={{ marginTop: '15px', width: '100%', border: '1px, solid, #333', padding: '5px', borderRadius: '10px'}}
          />
          {selectedFile && (
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
              Selected: {selectedFile.name}
            </p>
          )}
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={closeUploadModal}>
              Cancel
            </button>
            <button 
              className="modal-btn primary" 
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <div
        className={`modal-backdrop ${isDeleteModalOpen ? 'is-open' : ''}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeDeleteModal();
          }
        }}
      >
        <div className="modal-card">
          <h3>Delete Account</h3>
          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={closeDeleteModal}>
              Cancel
            </button>
            <button className="modal-btn danger" onClick={handleConfirmDelete}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileView;