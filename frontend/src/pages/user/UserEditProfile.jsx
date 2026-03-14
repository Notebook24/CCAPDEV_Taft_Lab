import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../style/user_css/UserEditProfile.css";

function UserEditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    studentType: '',
    collegeSchool: '',
    description: ''
  });

  useEffect(() => {
    const stylesheetUrls = [
      '/assets/style/profile.css',
      '/assets/style/user_css/user_edit_profile.css'
    ];
    const previousOverflow = document.body.style.overflow;

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add save profile logic here
    console.log('Profile update:', formData);
    // Navigate back to profile view after save
    navigate('/user/profile');
  };

  const handleBack = () => {
    navigate('/user/profile');
  };

  return (
    <div>
      <header>
        <div className="logo">
          <a href="/user">
            <img src="/assets/images/taftlab-logo.png" alt="TaftLab Logo" />
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
              <img src="/assets/images/profile-icon.png" alt="Profile Icon" />
            </a>
          </div>
        </div>
      </header>

      <div className="subheader"></div>

      <main>
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <img src="/assets/images/profile-icon.png" alt="Profile Avatar" />
            </div>
            <div className="profile-info">
              <h1 className="profile-name">Ivan Florendo</h1>
              <p className="profile-role">Student</p>
            </div>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
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
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  placeholder=""
                  value={formData.description}
                  onChange={handleChange}
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
