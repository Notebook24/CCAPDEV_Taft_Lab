import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../../style/admin_css/AdminBuildingDashboard.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';

// fixed time slots, same array used across all admin pages
const TIME_SLOTS = [
  { start: '07:30:00', end: '09:00:00', display: '07:30AM - 09:00AM' },
  { start: '09:15:00', end: '10:45:00', display: '09:15AM - 10:45AM' },
  { start: '11:00:00', end: '12:30:00', display: '11:00AM - 12:30PM' },
  { start: '12:45:00', end: '14:15:00', display: '12:45PM - 02:15PM' },
  { start: '14:30:00', end: '16:00:00', display: '02:30PM - 04:00PM' },
  { start: '16:15:00', end: '17:45:00', display: '04:15PM - 05:45PM' },
  { start: '18:00:00', end: '19:30:00', display: '06:00PM - 07:30PM' },
];

// picks the right starting slot based on current time
// returns the first slot that hasnt ended yet, or the last slot if past all of them
function getInitialSlotIndex() {
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, "0") + ":" +
                      now.getMinutes().toString().padStart(2, "0") + ":00";
  for (let i = 0; i < TIME_SLOTS.length; i++) {
    if (currentTime < TIME_SLOTS[i].end) return i;
  }
  return TIME_SLOTS.length - 1;
}

function AdminBuildingDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // passed from AdminHomePage when admin clicks a building card
  const selectedBuilding = location.state && location.state.selectedBuilding;

  const [laboratories, setLaboratories] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);

  const [loadingLabs, setLoadingLabs] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState(null);

  // live clock shown in the sub-header
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // which time slot the labs panel is currently showing
  const [slotIndex, setSlotIndex] = useState(getInitialSlotIndex());

  // ticks every second to keep the clock updated
  useEffect(function() {
    const timer = setInterval(function() {
      setCurrentDateTime(new Date());
    }, 1000);
    return function() { clearInterval(timer); };
  }, []);

  // all three fetches run on mount, each has its own loading flag so one failure doesnt block the others
  useEffect(function() {
    if (!selectedBuilding) return;

    const buildingId = selectedBuilding._id;

    async function fetchLaboratories() {
      try {
        const res = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratories");
        if (!res.ok) throw new Error("Failed to fetch laboratories: " + res.status);
        const data = await res.json();
        setLaboratories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingLabs(false);
      }
    }

    async function fetchReservations() {
      try {
        const res = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratories/reservations");
        if (!res.ok) throw new Error("Failed to fetch reservations: " + res.status);
        const data = await res.json();
        setReservations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingReservations(false);
      }
    }

    async function fetchRecentStudents() {
      try {
        const res = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratories/recent_students");
        if (!res.ok) throw new Error("Failed to fetch recent students: " + res.status);
        const data = await res.json();
        setRecentStudents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingStudents(false);
      }
    }

    fetchLaboratories();
    fetchReservations();
    fetchRecentStudents();
  }, []);

  // guard goes after all hooks, if no building was passed just show an error page
  if (!selectedBuilding) {
    return (
      <div className="admin-building-dashboard">
        <header>
          <div className="logo">
            <a href="/admin"><img src={taftlabLogo} alt="TaftLab Logo" /></a>
          </div>
          <div className="header-right">
            <nav>
              <ul>
                <li><a href="/admin">Home</a></li>
                <li><a href="/admin/profile">Profile</a></li>
                <li><a href="#" onClick={function() { navigate("/login"); }}>Logout</a></li>
              </ul>
            </nav>
            <div className="profile-icon">
              <img src={profileIcon} alt="Profile Icon" />
            </div>
          </div>
        </header>
        <div className="sub-header">
          <h2>Error: No building selected</h2>
        </div>
        <div style={{ padding: 32, color: 'red', fontWeight: 600 }}>
          Unable to load dashboard. Please return to the Admin Home Page and select a building.
        </div>
      </div>
    );
  }

  // formats the date and time for the live clock display
  function formatDateTime(date) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return dayName + ", " + month + " " + day + ", " + year + " " + hours + ":" + minutes + ":" + seconds + " " + ampm;
  }

  // today as YYYY-MM-DD, used for date comparisons in the stat counters and lab capacity
  const today = new Date().toISOString().split("T")[0];

  // stat card counts, each one just loops through the reservations array
  let reservationsToday = 0;
  for (let i = 0; i < reservations.length; i++) {
    const reservationDate = new Date(reservations[i].date_reserved).toISOString().split("T")[0];
    if (reservationDate === today) reservationsToday++;
  }

  let ongoingReservations = 0;
  for (let i = 0; i < reservations.length; i++) {
    if (reservations[i].status === "Ongoing") ongoingReservations++;
  }

  let pastReservations = 0;
  for (let i = 0; i < reservations.length; i++) {
    if (reservations[i].status === "Completed") pastReservations++;
  }

  let cancelledReservations = 0;
  for (let i = 0; i < reservations.length; i++) {
    if (reservations[i].status === "Cancelled") cancelledReservations++;
  }

  function handlePrevSlot() {
    if (slotIndex > 0) setSlotIndex(slotIndex - 1);
  }

  function handleNextSlot() {
    if (slotIndex < TIME_SLOTS.length - 1) setSlotIndex(slotIndex + 1);
  }

  // the currently active time slot object
  const activeSlot = TIME_SLOTS[slotIndex];

  // counts taken seats for a lab at the selected slot without extra API calls
  // only counts today's non-cancelled reservations that overlap with the active slot
  // r.lab_id can be a populated object from mongoose so we always pull out ._id before comparing
  function getTakenSeatsForLab(labId) {
    let count = 0;
    for (let i = 0; i < reservations.length; i++) {
      const r = reservations[i];
      if (r.status === "Cancelled") continue;
      const rLabId = r.lab_id && r.lab_id._id ? r.lab_id._id.toString() : (r.lab_id ? r.lab_id.toString() : "");
      const resDate = new Date(r.date_reserved).toISOString().split("T")[0];
      const isToday = resDate === today;
      const overlaps = r.reserve_startTime < activeSlot.end && r.reserve_endTime > activeSlot.start;
      if (isToday && overlaps && rLabId === labId.toString()) {
        count += r.seat_id ? r.seat_id.length : 1;
      }
    }
    return count;
  }

  // deduplicates recent students so the same person only appears once even if they reserved multiple times
  function getUniqueRecentStudents() {
    const seenUserIds = new Set();
    const unique = [];
    for (let i = 0; i < recentStudents.length; i++) {
      const userId = recentStudents[i].user_id
        ? recentStudents[i].user_id.toString()
        : recentStudents[i]._id.toString();
      if (!seenUserIds.has(userId)) {
        seenUserIds.add(userId);
        unique.push(recentStudents[i]);
      }
    }
    return unique;
  }

  // navigates to seat management, also passes the active slot index and today's date
  // so the manage page pre-selects the same slot the admin was already viewing
  function handleReserve(laboratory) {
    navigate("/admin/manage-reservations", {
      state: {
        selectedBuilding: selectedBuilding,
        selectedLab: laboratory,
        initialSlotIndex: slotIndex,
        initialDate: today
      }
    });
  }

  function handleLogout() {
    navigate("/login");
  }

  const uniqueRecentStudents = getUniqueRecentStudents();

  return (
    <div className="admin-building-dashboard">

      {/* header */}
      <header>
        <div className="logo">
          <a href="/admin"><img src={taftlabLogo} alt="TaftLab Logo" /></a>
        </div>
        <div className="header-right">
          <nav>
            <ul>
              <li><a href="/admin">Home</a></li>
              <li><a href="/admin/profile">Profile</a></li>
              <li><a href="#" onClick={handleLogout}>Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <img src={profileIcon} alt="Profile Icon" />
          </div>
        </div>
      </header>

      {/* building name with live running clock below it */}
      <div className="sub-header">
        <h2>{selectedBuilding.building_name}</h2>
        <div className="sub-header-datetime">{formatDateTime(currentDateTime)}</div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-container">

        {/* 4 stat cards */}
        <div className="stats-row">
          <div className="stat-card green">
            <div className="stat-number">{loadingReservations ? "..." : reservationsToday}</div>
            <div className="stat-label">RESERVATIONS TODAY</div>
          </div>
          <div className="stat-card gray">
            <div className="stat-number">{loadingReservations ? "..." : ongoingReservations}</div>
            <div className="stat-label">ONGOING RESERVATIONS</div>
          </div>
          <div className="stat-card green">
            <div className="stat-number">{loadingReservations ? "..." : pastReservations}</div>
            <div className="stat-label">PAST RESERVATIONS</div>
          </div>
          <div className="stat-card gray">
            <div className="stat-number">{loadingReservations ? "..." : cancelledReservations}</div>
            <div className="stat-label">CANCELLED RESERVATIONS</div>
          </div>
        </div>

        {/* labs on the left, recent students on the right */}
        <div className="lower-section">

          <div className="labs-container">

            {/* section title on the left, time slot prev/next nav on the right */}
            <div className="labs-header">
              <div className="section-title">Computer Laboratories</div>
              <span className="slot-nav">
                <button
                  type="button"
                  className="slot-btn"
                  onClick={handlePrevSlot}
                  disabled={slotIndex === 0}
                >
                  &lt;
                </button>
                <span className="slot-display">{activeSlot.display}</span>
                <button
                  type="button"
                  className="slot-btn"
                  onClick={handleNextSlot}
                  disabled={slotIndex === TIME_SLOTS.length - 1}
                >
                  &gt;
                </button>
              </span>
            </div>

            {loadingLabs && <p>Loading laboratories...</p>}

            {!loadingLabs && laboratories.map(function(lab) {
              const takenSeats = getTakenSeatsForLab(lab._id);
              const totalSeats = lab.capacity;
              // red if full, green if still has open seats
              const capacityClass = takenSeats >= totalSeats ? "red-cap" : "green-cap";

              return (
                <div className="lab-row" key={lab._id}>
                  <div className="lab-name">{lab.room_code}</div>
                  <div className={"capacity " + capacityClass}>
                    {takenSeats} / {totalSeats}
                  </div>
                  <a className="reserve-btn" onClick={function() { handleReserve(lab); }}>Reserve</a>
                </div>
              );
            })}

          </div>

          {/* recent students, deduped so each person only shows up once */}
          <div className="students-container">
            <div className="section-title">Recent Students</div>

            {loadingStudents && <p>Loading recent students...</p>}

            {!loadingStudents && uniqueRecentStudents.map(function(student) {
              return (
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
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminBuildingDashboard;
