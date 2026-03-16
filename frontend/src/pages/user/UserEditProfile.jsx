import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../style/Profile.css";
import "../../style/user_css/UserEditProfile.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';

function UserEditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
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

        const response = await fetch(`http://localhost:3000/user/profile/${user_id}`);
        const data = await response.json();

        if (!response.ok) {
          console.error('Error fetching profile:', data.error);
          setLoading(false);
          return;
        }

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
              <img src={profileIcon} alt="Profile Icon" />
            </a>
          </div>
        </div>
      </header>

      <div className="subheader"></div>

      <main>
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <img src={profileIcon} alt="Profile Avatar" />
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
    </div>
  );
}

export default UserEditProfile;
