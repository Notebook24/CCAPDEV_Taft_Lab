import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../style/LoginSignup.css";
import taftLogo from '../../assets/images/taftlab-logo.png';
import API_BASE_URL from '../../config/api';

function AdminAddLabTechnician() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email_address: '',
    password: '',
    confirm_password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (formData.password !== formData.confirm_password) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/add-lab-technician`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          email: formData.email_address,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return setErrorMessage(data.message);
      }

      setSuccessMessage('Lab Technician added successfully!');
      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        email_address: '',
        password: '',
        confirm_password: ''
      });
      
    } catch (err) {
      console.error(err);
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = (e) => {
    e.preventDefault();
    navigate('/admin');
  };

  return (
    <div className="login-page-container">
      <div className="signup">
        <div className="signup-leftside">
          <img src={taftLogo} alt="TAFT LAB Logo" className="signup-logo" />
          <h2>Add Lab Technician</h2>

          {errorMessage && (
            <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '5px', width: '100%', textAlign: 'center' }}>
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div style={{ color: 'green', marginBottom: '15px', padding: '10px', backgroundColor: '#e6ffe6', borderRadius: '5px', width: '100%', textAlign: 'center' }}>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="first_name">First Name</label>
            <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="Enter first name" />

            <label htmlFor="middle_name">Middle Name</label>
            <input type="text" id="middle_name" name="middle_name" value={formData.middle_name} onChange={handleChange} placeholder="Enter middle name (optional)" />

            <label htmlFor="last_name">Last Name</label>
            <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="Enter last name" />

            <label htmlFor="email_address">Email Address</label>
            <input type="text" id="email_address" name="email_address" value={formData.email_address} onChange={handleChange} required placeholder="technician@taftlab.edu.ph" />

            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Enter password (min. 6 characters)" />

            <label htmlFor="confirm_password">Confirm Password</label>
            <input type="password" id="confirm_password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required placeholder="Confirm password" />

            <button type="submit" className="top-btn" disabled={loading}>
              {loading ? 'Adding...' : 'Add Lab Technician'}
            </button>
            <button type="button" className="bottom-btn" onClick={handleBackClick}>
              Cancel
            </button>
          </form>
        </div>

        <div className="signup-rightside">
          <img src={taftLogo} alt="TAFT LAB Logo" />
          <h2>Add New<br />Lab Technician</h2>
          <p>Create accounts for new lab technicians to help manage computer laboratory reservations.</p>
        </div>
      </div>
    </div>
  );
}

export default AdminAddLabTechnician;