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
    profile_picture: null   // will hold the Cloudinary URL string
  });
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // local preview before upload
  const navigate = useNavigate();

  const user_id = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');

  // ── Profile picture: use Cloudinary URL stored in userData directly ────────
  const getProfilePicture = () => userData.profile_picture || profileIcon;

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      if (!user_id) { navigate('/login'); return; }
      const response = await fetch(`${API_BASE_URL}/api/user/profile/${user_id}`);
      const data = await response.json();
      if (!response.ok) { console.error('Error fetching profile:', data.error); return; }
      setUserData(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [navigate]);

  // ── File selection — show local preview ───────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // ── Upload to Cloudinary via backend ──────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) { alert('Please select a file first'); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append('profile_picture', selectedFile);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/upload-profile-picture/${user_id}`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      // Update userData with the new Cloudinary URL returned by the API
      setUserData(prev => ({ ...prev, profile_picture: data.profile_picture }));
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Failed to upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('user_id');
      sessionStorage.removeItem('user_id');
      navigate('/login');
    }
  };

  // ── Delete account ─────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    try {
      if (!user_id) { alert('Error: User ID not found'); return; }
      const response = await fetch(
        `${API_BASE_URL}/api/user/view-profile/${user_id}/delete_user`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (!response.ok) { alert('Error deleting account: ' + data.error); return; }
      localStorage.clear();
      sessionStorage.clear();
      setIsDeleteModalOpen(false);
      navigate('/login');
    } catch (err) {
      alert('Error deleting account: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div>
        <UserNavbar />
        <div className="subheader" />
        <div className="user-profile"><p>Loading profile...</p></div>
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
                src={getProfilePicture()}
                alt="User-Picture"
                className="user-icon"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                onError={(e) => { e.target.onerror = null; e.target.src = profileIcon; }}
              />
              <button
                onClick={() => setIsUploadModalOpen(true)}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  background: '#006937', borderRadius: '50%',
                  width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', border: '2px solid white'
                }}
              >
                <p style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>+</p>
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
              <div className="option-box">Edit Profile<img src={editProfileIcon} alt="edit-profile" className="option-icon" /></div>
            </Link>
            <Link to="/user/reservation-history" style={{ textDecoration: 'none', color: 'white' }}>
              <div className="option-box">See Reservations<img src={reservationIcon} alt="reservation-icon" className="option-icon" /></div>
            </Link>
            <Link to="/user/change-password" style={{ textDecoration: 'none', color: 'white' }}>
              <div className="option-box">Change Password<img src={passwordIcon} alt="password-icon" className="option-icon" /></div>
            </Link>
            <a href="#" style={{ textDecoration: 'none', color: 'white' }} onClick={(e) => { e.preventDefault(); setIsDeleteModalOpen(true); }}>
              <div className="option-box">Delete Account<img src={trashIcon} alt="trash-icon" className="option-icon" /></div>
            </a>
          </div>
        </div>
      </div>

      {/* ── Upload Profile Picture Modal ────────────────────────────────────── */}
      <div
        className={`modal-backdrop ${isUploadModalOpen ? 'is-open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeUploadModal(); }}
      >
        <div className="modal-card">
          <h3>Upload Profile Picture</h3>

          {/* Live preview of the selected image */}
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', margin: '12px auto', display: 'block', border: '3px solid #006937' }}
            />
          )}

          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleFileSelect}
            style={{ marginTop: '10px', width: '100%', border: '1px solid #333', padding: '5px', borderRadius: '10px' }}
          />
          {selectedFile && (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '6px', marginBottom: '10px' }}>
              Selected: {selectedFile.name}
            </p>
          )}

          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={closeUploadModal}>Cancel</button>
            <button className="modal-btn primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete Account Modal ────────────────────────────────────────────── */}
      <div
        className={`modal-backdrop ${isDeleteModalOpen ? 'is-open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteModalOpen(false); }}
      >
        <div className="modal-card">
          <h3>Delete Account</h3>
          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="modal-btn danger" onClick={handleConfirmDelete}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileView;