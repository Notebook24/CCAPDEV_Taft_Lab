import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../style/Profile.css";
import profileIcon from '../../assets/images/profile-icon.png';
import trashIcon from '../../assets/images/trash-icon.png';
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import API_BASE_URL from '../../config/api';

function AdminProfileView() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [adminData, setAdminData] = useState({
    full_name: '',
    email: '',
    user_type: '',
    profile_picture: null   // Cloudinary URL or null
  });
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const navigate = useNavigate();

  const user_id = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');

  // ── Use Cloudinary URL from adminData directly ─────────────────────────────
  const getProfilePicture = () => adminData.profile_picture || profileIcon;

  // ── Fetch admin profile ────────────────────────────────────────────────────
  const fetchAdminProfile = async () => {
    try {
      if (!user_id) { navigate('/login'); return; }
      const response = await fetch(`${API_BASE_URL}/api/admin/profile/${user_id}`);
      const data = await response.json();
      if (!response.ok) { console.error('Error fetching admin profile:', data.error); return; }
      setAdminData(data);
    } catch (err) {
      console.error('Error fetching admin profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdminProfile(); }, [navigate]);

  // ── File selection — local preview ────────────────────────────────────────
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

      // Update adminData with the fresh Cloudinary URL
      setAdminData(prev => ({ ...prev, profile_picture: data.profile_picture }));
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

  // ── Delete admin account ───────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    try {
      if (!user_id) { alert('Error: User ID not found'); return; }
      const response = await fetch(
        `${API_BASE_URL}/api/admin/delete/${user_id}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (!response.ok) { alert('Error deleting account: ' + data.error); return; }
      localStorage.clear();
      sessionStorage.clear();
      setIsDeleteModalOpen(false);
      alert('Admin account deleted successfully!');
      navigate('/admin-login');
    } catch (err) {
      alert('Error deleting account: ' + err.message);
    }
  };

  function handleLogout() {
    fetch(`${API_BASE_URL}/api/admin-logout`, { method: 'POST', credentials: 'include' })
      .finally(() => {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/admin-login');
      });
  }

  if (loading) {
    return (
      <div className="admin-profile">
        <header>
          <div className="logo"><a href="/admin"><img src={taftlabLogo} alt="TaftLab Logo" /></a></div>
          <div className="header-right">
            <nav><ul>
              <li><a href="/admin">Home</a></li>
              <li><a href="/admin/profile" style={{ color: 'green' }}>Profile</a></li>
              <li><a href="/admin/add-lab-technician">Add Lab Technician</a></li>
              <li><a href="#" onClick={handleLogout}>Logout</a></li>
            </ul></nav>
            <div className="profile-icon"><img src={profileIcon} alt="Profile Icon" /></div>
          </div>
        </header>
        <div className="subheader" />
        <div className="user-profile"><p>Loading profile...</p></div>
      </div>
    );
  }

  return (
    <div className="admin-profile">
      <header>
        <div className="logo"><a href="/admin"><img src={taftlabLogo} alt="TaftLab Logo" /></a></div>
        <div className="header-right">
          <nav><ul>
            <li><a href="/admin">Home</a></li>
            <li><a href="/admin/add-lab-technician">Add Lab Technician</a></li>
            <li><a href="/admin/profile" style={{ color: 'green' }}>Profile</a></li>
            <li><a href="#" onClick={handleLogout}>Logout</a></li>
          </ul></nav>
          <div className="profile-icon">
            <img
              src={getProfilePicture()}
              alt="Profile Icon"
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => { e.target.onerror = null; e.target.src = profileIcon; }}
            />
          </div>
        </div>
      </header>

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
            <div className="option-box" onClick={() => setIsDeleteModalOpen(true)} style={{ cursor: 'pointer' }}>
              Delete Account
              <img src={trashIcon} alt="trash-icon" className="option-icon" />
            </div>
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
        <div className="modal-card" role="dialog" aria-modal="true">
          <h3>Delete Account</h3>
          <p>Are you sure you want to delete your admin account? This action cannot be undone.</p>
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="modal-btn danger" onClick={handleConfirmDelete}>Delete</button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-backdrop { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,0.45); z-index: 1200; }
        .modal-backdrop.is-open { display: flex; }
        .modal-card { background: #ffffff; border-radius: 12px; padding: 20px 24px; width: 380px; max-width: calc(100% - 32px); box-shadow: 0 8px 24px rgba(0,0,0,0.18); text-align: center; }
        .modal-card h3 { margin: 0 0 10px; }
        .modal-card p  { margin: 0 0 16px; font-size: 14px; color: #2e2e2e; }
        .modal-actions { display: flex; justify-content: center; gap: 12px; }
        .modal-btn { border: none; padding: 8px 18px; border-radius: 18px; font-weight: 600; cursor: pointer; }
        .modal-btn.cancel  { background: #e6ece8; color: #264237; }
        .modal-btn.danger  { background: #b64343; color: #ffffff; }
        .modal-btn.primary { background: #006937; color: #ffffff; }
      `}</style>
    </div>
  );
}

export default AdminProfileView;