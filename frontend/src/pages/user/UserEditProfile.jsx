import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../style/Profile.css";
import "../../style/user_css/UserEditProfile.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';
import API_BASE_URL from '../../config/api';

function UserEditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [profilePicture, setProfilePicture] = useState(profileIcon);
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    student_type: '',
    department: '',
    bio: '',
    profile_picture: null
  });
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    studentType: '',
    collegeSchool: '',
    bio: ''
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user_id = localStorage.getItem('user_id');
        if (!user_id) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/user/profile/${user_id}`);
        const data = await response.json();

        if (!response.ok) {
          console.error('Error fetching profile:', data.error);
          setLoading(false);
          return;
        }

        setUserData(data);

        // Parse full_name into first, middle, last names
        const nameParts = data.full_name.split(' ');
        const firstName = nameParts[0] || '';
        const middleName = nameParts[1] || '';
        const lastName = nameParts.slice(2).join(' ') || '';

        setFormData({
          firstName,
          middleName,
          lastName,
          studentType: data.student_type || '',
          collegeSchool: data.department || '',
          bio: data.bio || ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const getProfilePictureUrl = () => {
    const user_id = localStorage.getItem('user_id');
    if (userData.profile_picture) {
      return `http://localhost:3000/user/profile-picture/${user_id}`;
    }
    return profileIcon;
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    const user_id = localStorage.getItem('user_id');
    const formData = new FormData();
    formData.append('profile_picture', selectedFile);

    try {
      const response = await fetch(`http://localhost:3000/user/upload-profile-picture/${user_id}`, {
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
      const profileResponse = await fetch(`http://localhost:3000/user/profile/${user_id}`);
      const profileData = await profileResponse.json();
      setUserData(profileData);
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Failed to upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        navigate('/login');
        return;
      }

      const full_name = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim();

      const response = await fetch(`http://localhost:3000/user/profile/${user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name,
          student_type: formData.studentType,
          department: formData.collegeSchool,
          bio: formData.bio
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to update profile');
        return;
      }

      console.log('Profile updated successfully:', data);
      navigate('/user/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMessage('An error occurred while updating your profile');
    }
  };

  const handleBack = () => {
    navigate('/user/profile');
  };

  if (loading) {
    return (
      <div className="user-edit-profile-page">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="user-edit-profile-page">
      <header>
        <div className="logo">
          <a href="/user">
            <img src={taftlabLogo} alt="TaftLab Logo" />
          </a>
        </div>

        <div className="header-right">
          <nav>
            <ul>
              <li><a href="/user">Home</a></li>
              <li><a href="/user/reservation-history">My Reservations</a></li>
              <li><a href="/user/advanced-search">Advanced Search</a></li>
              <li><a href="/user/profile" style={{ color: 'green' }}>Profile</a></li>
              <li><a href="/login">Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <a href="/user/profile">
              <img 
                src={getProfilePictureUrl()} 
                alt="Profile Icon" 
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              />
            </a>
          </div>
        </div>
      </header>

      <div className="subheader"></div>

      <main>
        <div className="profile-container">
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
                <p style={{color: 'white', margin: 0, fontSize: '18px', fontWeight: 'bold'}}>+</p>
              </button>
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{formData.firstName} {formData.middleName} {formData.lastName}</h1>
              <p className="profile-role">Student</p>
            </div>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
            {errorMessage && (
              <div style={{
                color: 'red',
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#ffe6e6',
                borderRadius: '5px'
              }}>
                {errorMessage}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder=""
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="studentType">Student Type</label>
                <select
                  id="studentType"
                  name="studentType"
                  value={formData.studentType}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select here</option>
                  <option value="SHS">SHS</option>
                  <option value="UG">UG</option>
                  <option value="GD">GD</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="middleName">Middle Name</label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  placeholder=""
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="collegeSchool">College/School</label>
                <select
                  id="collegeSchool"
                  name="collegeSchool"
                  value={formData.collegeSchool}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select here</option>
                  <option value="CCS">CCS</option>
                  <option value="COS">COS</option>
                  <option value="CLA">CLA</option>
                  <option value="BAGCED">BAGCED</option>
                  <option value="COL">COL</option>
                  <option value="GCOE">GCOE</option>
                  <option value="RVRCOB">RVRCOB</option>
                  <option value="SOE">SOE</option>
                  <option value="Integrated School">Integrated School</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder=""
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  placeholder=""
                  value={formData.bio}
                  onChange={handleChange}
                  maxLength="300"
                  rows="4"
                />
              </div>
            </div>

            <div className="button-group">
              <button type="submit" className="btn btn-save">Save Changes</button>
              <button type="button" className="btn btn-back" onClick={handleBack}>Back</button>
            </div>
          </form>
        </div>
      </main>

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
            style={{ marginTop: '15px', width: '100%', border: '1px solid #333', padding: '5px', borderRadius: '10px'}}
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

        .modal-btn.primary {
          background: #006937;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}

export default UserEditProfile;