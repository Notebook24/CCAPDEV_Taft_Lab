import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../../style/admin_css/AdminBuildingDashboard.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';
import API_BASE_URL from '../../config/api';

// ─── TIME SLOTS ───────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  { start: '07:30:00', end: '08:00:00', display: '07:30AM - 08:00AM' },
  { start: '08:00:00', end: '08:30:00', display: '08:00AM - 08:30AM' },
  { start: '08:30:00', end: '09:00:00', display: '08:30AM - 09:00AM' },
  { start: '09:00:00', end: '09:30:00', display: '09:00AM - 09:30AM' },
  { start: '09:30:00', end: '10:00:00', display: '09:30AM - 10:00AM' },
  { start: '10:00:00', end: '10:30:00', display: '10:00AM - 10:30AM' },
  { start: '10:30:00', end: '11:00:00', display: '10:30AM - 11:00AM' },
  { start: '11:00:00', end: '11:30:00', display: '11:00AM - 11:30AM' },
  { start: '11:30:00', end: '12:00:00', display: '11:30AM - 12:00PM' },
  { start: '12:00:00', end: '12:30:00', display: '12:00PM - 12:30PM' },
  { start: '12:30:00', end: '13:00:00', display: '12:30PM - 01:00PM' },
  { start: '13:00:00', end: '13:30:00', display: '01:00PM - 01:30PM' },
  { start: '13:30:00', end: '14:00:00', display: '01:30PM - 02:00PM' },
  { start: '14:00:00', end: '14:30:00', display: '02:00PM - 02:30PM' },
  { start: '14:30:00', end: '15:00:00', display: '02:30PM - 03:00PM' },
  { start: '15:00:00', end: '15:30:00', display: '03:00PM - 03:30PM' },
  { start: '15:30:00', end: '16:00:00', display: '03:30PM - 04:00PM' },
  { start: '16:00:00', end: '16:30:00', display: '04:00PM - 04:30PM' },
  { start: '16:30:00', end: '17:00:00', display: '04:30PM - 05:00PM' },
  { start: '17:00:00', end: '17:30:00', display: '05:00PM - 05:30PM' },
  { start: '17:30:00', end: '18:00:00', display: '05:30PM - 06:00PM' },
  { start: '18:00:00', end: '18:30:00', display: '06:00PM - 06:30PM' },
  { start: '18:30:00', end: '19:00:00', display: '06:30PM - 07:00PM' },
  { start: '19:00:00', end: '19:30:00', display: '07:00PM - 07:30PM' },
  { start: '19:30:00', end: '20:00:00', display: '07:30PM - 08:00PM' },
  { start: '20:00:00', end: '20:30:00', display: '08:00PM - 08:30PM' },
  { start: '20:30:00', end: '21:00:00', display: '08:30PM - 09:00PM' },
  { start: '21:00:00', end: '21:30:00', display: '09:00PM - 09:30PM' },
];

const POLL_INTERVAL_MS = 60 * 1000;

function getCurrentTimeStr() {
  const now = new Date();
  return (
    now.getHours().toString().padStart(2, '0') + ':' +
    now.getMinutes().toString().padStart(2, '0') + ':' +
    now.getSeconds().toString().padStart(2, '0')
  );
}

function toManilaDateStr(date) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

function getManilaToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

function getInitialSlotIndex() {
  const ct = getCurrentTimeStr();
  for (let i = 0; i < TIME_SLOTS.length; i++) {
    if (ct < TIME_SLOTS[i].end) return i;
  }
  return TIME_SLOTS.length - 1;
}

function AdminBuildingDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedBuilding = location.state && location.state.selectedBuilding;

  const [laboratories, setLaboratories] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [profilePicture, setProfilePicture] = useState(profileIcon);
  const [imageKey, setImageKey] = useState(Date.now());

  const [loadingLabs, setLoadingLabs] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState(null);

  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [slotIndex, setSlotIndex] = useState(getInitialSlotIndex());

  useEffect(() => {
    const fetchAdminProfile = async () => {
      // Check both storages
      const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
      if (!userId) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/profile/${userId}`);
        const data = await response.json();
        if (response.ok && data.profile_picture) {
          setProfilePicture(`${API_BASE_URL}/api/user/profile-picture/${userId}?t=${imageKey}`);
        } else {
          setProfilePicture(profileIcon);
        }
      } catch (err) {
        console.error('Error fetching admin profile:', err);
        setProfilePicture(profileIcon);
      }
    };
    
    fetchAdminProfile();
  }, [imageKey]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchLaboratories(buildingId, isInitialLoad = false) {
    if (isInitialLoad) setLoadingLabs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/${buildingId}/laboratories`);
      if (!res.ok) throw new Error('Failed to fetch laboratories: ' + res.status);
      setLaboratories(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      if (isInitialLoad) setLoadingLabs(false);
    }
  }

  async function fetchReservations(buildingId, isInitialLoad = false) {
    if (isInitialLoad) setLoadingReservations(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/${buildingId}/laboratories/reservations`);
      if (!res.ok) throw new Error('Failed to fetch reservations: ' + res.status);
      setReservations(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      if (isInitialLoad) setLoadingReservations(false);
    }
  }

  async function fetchRecentStudents(buildingId, isInitialLoad = false) {
    if (isInitialLoad) setLoadingStudents(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/${buildingId}/laboratories/recent_students`);
      if (!res.ok) throw new Error('Failed to fetch recent students: ' + res.status);
      setRecentStudents(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      if (isInitialLoad) setLoadingStudents(false);
    }
  }

  async function fetchAll(buildingId, isInitialLoad = false) {
    await Promise.all([
      fetchLaboratories(buildingId, isInitialLoad),
      fetchReservations(buildingId, isInitialLoad),
      fetchRecentStudents(buildingId, isInitialLoad),
    ]);
  }

  useEffect(() => {
    if (!selectedBuilding) return;
    const buildingId = selectedBuilding._id;
    fetchAll(buildingId, true);
    const intervalId = setInterval(() => fetchAll(buildingId, false), POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  if (!selectedBuilding) {
    return (
      <div className="admin-building-dashboard">
        <header>
          <div className="logo"><a href="/admin"><img src={taftlabLogo} alt="TaftLab Logo" /></a></div>
          <div className="header-right">
            <nav><ul>
              <li><a href="/admin">Home</a></li>
              <li><a href="/admin/profile">Profile</a></li>
              <li><a href="#" onClick={() => navigate('/login')}>Logout</a></li>
            </ul></nav>
            <div className="profile-icon"><img src={profileIcon} alt="Profile Icon" /></div>
          </div>
        </header>
        <div className="sub-header"><h2>Error: No building selected</h2></div>
        <div style={{ padding: 32, color: 'red', fontWeight: 600 }}>
          Unable to load dashboard. Please return to the Admin Home Page and select a building.
        </div>
      </div>
    );
  }

  function formatDateTime(date) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hours}:${minutes}:${seconds} ${ampm}`;
  }

  const today = getManilaToday();

  let ongoingReservations = 0;
  let checkedReservations = 0;
  let completedReservations = 0;
  let cancelledReservations = 0;
  let reservationsToday = 0;

  for (const reservation of reservations) {
    const reservationDate = toManilaDateStr(reservation.date_reserved);
    const isToday = reservationDate === today;

    if (reservation.status === 'Ongoing' || reservation.status === 'Checked') {
      ongoingReservations++;
      if (isToday) reservationsToday++;
    }
    if (reservation.status === 'Checked') {
      checkedReservations++;
    }
    if (reservation.status === 'Completed') {
      completedReservations++;
      if (isToday) reservationsToday++;
    }
    if (reservation.status === 'Cancelled') {
      cancelledReservations++;
      if (isToday) reservationsToday++;
    }
  }

  const firstAvailableSlotIndex = getInitialSlotIndex();
  const activeSlot = TIME_SLOTS[slotIndex];

  function handlePrevSlot() {
    if (slotIndex > firstAvailableSlotIndex) setSlotIndex(slotIndex - 1);
  }

  function handleNextSlot() {
    if (slotIndex < TIME_SLOTS.length - 1) setSlotIndex(slotIndex + 1);
  }

  function getTakenSeatsForLab(labId) {
    let count = 0;
    for (const r of reservations) {
      if (r.status === 'Cancelled' || r.status === 'Completed') continue;
      const rLabId = r.lab_id?._id ? r.lab_id._id.toString() : (r.lab_id ? r.lab_id.toString() : '');
      const resDate = toManilaDateStr(r.date_reserved);
      const isToday = resDate === today;
      const overlaps = r.reserve_startTime < activeSlot.end && r.reserve_endTime > activeSlot.start;
      if (isToday && overlaps && rLabId === labId.toString()) {
        count += r.seat_id ? r.seat_id.length : 1;
      }
    }
    return count;
  }

  function getUniqueRecentStudents() {
    const seen = new Set();
    return recentStudents.filter(s => {
      const uid = s.user_id ? s.user_id.toString() : s._id.toString();
      if (seen.has(uid)) return false;
      seen.add(uid);
      return true;
    });
  }

  function handleReserve(laboratory) {
    navigate('/admin/manage-reservations', {
      state: {
        selectedBuilding,
        selectedLab: laboratory,
        initialSlotIndex: slotIndex,
        initialDate: today
      }
    });
  }

  function handleLogout() { 
    fetch(`${API_BASE_URL}/api/admin-logout`, { 
      method: 'POST', 
      credentials: 'include' 
    }).finally(() => {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/admin-login');
    });
  }

  function handleBackToAdmin() { navigate('/admin'); }

  const uniqueRecentStudents = getUniqueRecentStudents();

  return (
    <div className="admin-building-dashboard">

      <header>
        <div className="logo"><a href="/admin"><img src={taftlabLogo} alt="TaftLab Logo" /></a></div>
        <div className="header-right">
          <nav><ul>
            <li><a href="/admin">Home</a></li>
            <li><a href="/admin/profile">Profile</a></li>
            <li><a href="/admin/add-lab-technician">Add Lab Technician</a></li>
            <li><a href="#" onClick={handleLogout}>Logout</a></li>
          </ul></nav>
          <div className="profile-icon">
            <img 
              src={profilePicture} 
              alt="Profile Icon" 
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => { e.target.onerror = null; e.target.src = profileIcon; }}
            />
          </div>
        </div>
      </header>

      <div className="sub-header">
        <h2>{selectedBuilding.building_name}</h2>
        <div className="sub-header-datetime">{formatDateTime(currentDateTime)}</div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-container">

        <div className="stats-row">
          <div className="stat-card green">
            <div className="stat-number">{loadingReservations ? '...' : reservationsToday}</div>
            <div className="stat-label">RESERVATIONS TODAY</div>
          </div>
          <div className="stat-card gray">
            <div className="stat-number">{loadingReservations ? '...' : ongoingReservations}</div>
            <div className="stat-label">ONGOING (CHECKED & UNCHECKED)</div>
          </div>
          <div className="stat-card green">
            <div className="stat-number">{loadingReservations ? '...' : checkedReservations}</div>
            <div className="stat-label">ONGOING AND CHECKED IN</div>
          </div>
          <div className="stat-card gray">
            <div className="stat-number">{loadingReservations ? '...' : completedReservations}</div>
            <div className="stat-label">PAST RESERVATIONS</div>
          </div>
          <div className="stat-card green">
            <div className="stat-number">{loadingReservations ? '...' : cancelledReservations}</div>
            <div className="stat-label">CANCELLED</div>
          </div>
        </div>

        <div className="lower-section">

          <div className="labs-container">
            <div className="labs-header">
              <div className="section-title">Computer Laboratories</div>
              <span className="slot-nav">
                <button type="button" className="slot-btn" onClick={handlePrevSlot} disabled={slotIndex <= firstAvailableSlotIndex}>&lt;</button>
                <span className="slot-display">{activeSlot.display}</span>
                <button type="button" className="slot-btn" onClick={handleNextSlot} disabled={slotIndex >= TIME_SLOTS.length - 1}>&gt;</button>
              </span>
            </div>

            {loadingLabs && <p>Loading laboratories...</p>}

            {!loadingLabs && laboratories.map(lab => {
              const takenSeats = getTakenSeatsForLab(lab._id);
              const totalSeats = lab.capacity;
              const capacityClass = takenSeats >= totalSeats ? 'red-cap' : 'green-cap';
              return (
                <div className="lab-row" key={lab._id}>
                  <div className="lab-name">{lab.room_code}</div>
                  <div className={'capacity ' + capacityClass}>{takenSeats} / {totalSeats}</div>
                  <a className="reserve-btn" onClick={() => handleReserve(lab)}>Reserve</a>
                </div>
              );
            })}
          </div>

          <div className="students-container">
            <div className="section-title">Recent Students</div>
            {loadingStudents && <p>Loading recent students...</p>}
            {!loadingStudents && uniqueRecentStudents.map(student => (
              <div className="student-row-link" key={student._id}>
                <div className="student-row">
                  <div className="student-avatar">
                    <img src={profileIcon} alt="Profile Avatar" />
                  </div>
                  <div className="student-info">
                    <div className="student-name">{student.full_name}</div>
                    <div className="student-course">{student.department}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <button 
            onClick={handleBackToAdmin}
            style={{ padding: '10px 30px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.3s ease' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            Back to Admin Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminBuildingDashboard;