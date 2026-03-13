import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email_address: '',
    password: '',
    student_type: '',
    department: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const navigate = useNavigate();

  // All department options
  const allDepartments = [
    { value: 'CCS', label: 'CCS' },
    { value: 'COS', label: 'COS' },
    { value: 'CLA', label: 'CLA' },
    { value: 'BAGCED', label: 'BAGCED' },
    { value: 'COL', label: 'COL' },
    { value: 'GCOE', label: 'GCOE' },
    { value: 'RVRCOB', label: 'RVRCOB' },
    { value: 'SOE', label: 'SOE' },
    { value: 'Integrated School', label: 'Integrated School' }
  ];

  useEffect(() => {
    // Add the CSS link for this page
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/style/login_signup.css';
    document.head.appendChild(link);

    return () => {
      // Cleanup: remove the link when component unmounts
      document.head.removeChild(link);
    };
  }, []);

  // Handle student type change to filter departments
  useEffect(() => {
    if (formData.student_type === 'SHS') {
      // Show only Integrated School for SHS
      setDepartmentOptions(allDepartments.filter(dept => dept.value === 'Integrated School'));
    } else if (formData.student_type === 'UG' || formData.student_type === 'GD') {
      // Show all except Integrated School for UG and GD
      setDepartmentOptions(allDepartments.filter(dept => dept.value !== 'Integrated School'));
    } else {
      // No student type selected, show all
      setDepartmentOptions(allDepartments);
    }
    // Reset department when student type changes
    setFormData(prev => ({ ...prev, department: '' }));
  }, [formData.student_type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add signup logic here
    console.log('Signup attempted with:', formData);
    // navigate('/login');
  };

  const handleBackClick = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="login-page-container">
      <div className="signup">
        <div className="signup-leftside">
          <h2>Sign Up to TaftLab</h2>

          {/* Error message placeholder */}
          <div id="error-message" style={{ 
            display: errorMessage ? 'block' : 'none', 
            color: 'red', 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: '#ffe6e6', 
            borderRadius: '5px' 
          }}>
            <p id="error-text">{errorMessage}</p>
          </div>

          <form method="GET" onSubmit={handleSubmit}>
            <label htmlFor="first_name">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />

            <label htmlFor="middle_name">Middle Name</label>
            <input
              type="text"
              id="middle_name"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
            />

            <label htmlFor="last_name">Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />

            <label htmlFor="email_address">Email Address</label>
            <input
              type="text"
              id="email_address"
              name="email_address"
              placeholder="user@dlsu.edu.ph"
              value={formData.email_address}
              onChange={handleChange}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <label htmlFor="student_type">Student Type</label>
            <select
              id="student_type"
              name="student_type"
              value={formData.student_type}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select here</option>
              <option value="SHS">SHS</option>
              <option value="UG">UG</option>
              <option value="GD">GD</option>
            </select>

            <label htmlFor="department">College/School</label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select here</option>
              {departmentOptions.map(dept => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>

            <button type="submit" className="top-btn">Create Account</button>
          </form>

          <form method="GET" onSubmit={handleBackClick}>
            <button type="submit" className="bottom-btn">Back</button>
          </form>
        </div>

        <div className="signup-rightside">
          <img src="/assets/images/taftlab-logo.png" alt="TAFT LAB Logo" />
          <h2>Every Lasallian's Gateway to<br />DLSU Computer Labs.</h2>
          <p>Book your workspace today — at DLSU.</p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
