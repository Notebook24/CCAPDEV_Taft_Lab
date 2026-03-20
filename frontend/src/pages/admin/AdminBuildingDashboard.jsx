import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../../style/admin_css/AdminBuildingDashboard.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';

// Fixed time slots — same array used across all admin pages
const TIME_SLOTS = [
  { start: '07:30:00', end: '09:00:00', display: '07:30AM - 09:00AM' },
  { start: '09:15:00', end: '10:45:00', display: '09:15AM - 10:45AM' },
  { start: '11:00:00', end: '12:30:00', display: '11:00AM - 12:30PM' },
  { start: '12:45:00', end: '14:15:00', display: '12:45PM - 02:15PM' },
  { start: '14:30:00', end: '16:00:00', display: '02:30PM - 04:00PM' },
  { start: '16:15:00', end: '17:45:00', display: '04:15PM - 05:45PM' },
  { start: '18:00:00', end: '19:30:00', display: '06:00PM - 07:30PM' },
  { start: '19:45:00', end: '21:15:00', display: '07:45PM - 09:15PM' },
];

// ─── POLLING CONFIG ───────────────────────────────────────────────────────────
// This dashboard shows live lab occupancy and recent students.
// 60 seconds keeps the counts reasonably fresh without hammering the server.
const POLL_INTERVAL_MS = 60 * 1000;

// Picks the first slot that hasn't ended yet, or the last slot if all are done
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

  const selectedBuilding = location.state && location.state.selectedBuilding;

  const [laboratories, setLaboratories] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);

  const [loadingLabs, setLoadingLabs] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState(null);

  // Live clock shown in the sub-header — ticks every second
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Which time slot the labs panel is currently showing
  const [slotIndex, setSlotIndex] = useState(getInitialSlotIndex());

  // ─── CLOCK ───────────────────────────────────────────────────────────────────
  useEffect(function () {
    const timer = setInterval(function () { setCurrentDateTime(new Date()); }, 1000);
    return function () { clearInterval(timer); };
  }, []);

  // ─── FETCH FUNCTIONS ─────────────────────────────────────────────────────────
  // Each fetch is extracted so the polling interval can call all three together.
  // isInitialLoad = true  → shows loading spinners
  // isInitialLoad = false → silent background refresh (polling)

  async function fetchLaboratories(buildingId, isInitialLoad = false) {
    if (isInitialLoad) setLoadingLabs(true);
    try {
      const res = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratories");
      if (!res.ok) throw new Error("Failed to fetch laboratories: " + res.status);
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
      const res = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratories/reservations");
      if (!res.ok) throw new Error("Failed to fetch reservations: " + res.status);
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
      const res = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratories/recent_students");
      if (!res.ok) throw new Error("Failed to fetch recent students: " + res.status);
      setRecentStudents(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      if (isInitialLoad) setLoadingStudents(false);
    }
  }

  // Runs all three fetches in parallel
  async function fetchAll(buildingId, isInitialLoad = false) {
    await Promise.all([
      fetchLaboratories(buildingId, isInitialLoad),
      fetchReservations(buildingId, isInitialLoad),
      fetchRecentStudents(buildingId, isInitialLoad),
    ]);
  }

  // ─── INITIAL LOAD + POLLING SETUP ────────────────────────────────────────────
  useEffect(function () {
    if (!selectedBuilding) return;

    const buildingId = selectedBuilding._id;

    fetchAll(buildingId, true); // initial load with spinners

    const intervalId = setInterval(function () {
      fetchAll(buildingId, false); // silent refresh every 60s
    }, POLL_INTERVAL_MS);

    return function () { clearInterval(intervalId); };
  }, []);

  // ─── GUARD — must come after all hooks ───────────────────────────────────────
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
                <li><a href="#" onClick={function () { navigate("/login"); }}>Logout</a></li>
              </ul>
            </nav>
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

  // ─── HELPERS ─────────────────────────────────────────────────────────────────
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

  const today = new Date().toISOString().split("T")[0];

  // Stat counters
  let ongoingReservations = 0;
  let checkedReservations = 0;
  let completedReservations = 0;
  let cancelledReservations = 0;
  let reservationsToday = 0;

  for (let i = 0; i < reservations.length; i++) {
    const reservation = reservations[i];
    const reservationDate = new Date(reservation.date_reserved).toISOString().split("T")[0];
    const isToday = reservationDate === today;

    if (reservation.status === "Ongoing" || reservation.status === "Checked") {
      ongoingReservations++;
      if (isToday) reservationsToday++;
    }
    if (reservation.status === "Checked") {
      checkedReservations++;
    }
    if (reservation.status === "Completed") {
      completedReservations++;
      if (isToday) reservationsToday++;
    }
    if (reservation.status === "Cancelled") {
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

  // Counts taken seats for a lab at the selected slot using already-fetched reservations
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

  // Deduplicates recent students so each person only shows once
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

  // Navigates to seat management, passing the active slot so the next page pre-selects it
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

  function handleLogout() { navigate("/login"); }

  const uniqueRecentStudents = getUniqueRecentStudents();

  // ─── RENDER ───────────────────────────────────────────────────────────────────
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
              <li><a href="#" onClick={handleLogout}>Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <img src={profileIcon} alt="Profile Icon" />
          </div>
        </div>
      </header>

      <div className="sub-header">
        <h2>{selectedBuilding.building_name}</h2>
        <div className="sub-header-datetime">{formatDateTime(currentDateTime)}</div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-container">

        {/* 5 stat cards */}
        <div className="stats-row">
          <div className="stat-card green">
            <div className="stat-number">{loadingReservations ? "..." : reservationsToday}</div>
            <div className="stat-label">RESERVATIONS TODAY</div>
          </div>
          <div className="stat-card gray">
            <div className="stat-number">{loadingReservations ? "..." : ongoingReservations}</div>
            <div className="stat-label">ONGOING <br />(CHECKED & UNCHECKED)</div>
          </div>
          <div className="stat-card green">
            <div className="stat-number">{loadingReservations ? "..." : checkedReservations}</div>
            <div className="stat-label">ONGOING AND CHECKED IN</div>
          </div>
          <div className="stat-card gray">
            <div className="stat-number">{loadingReservations ? "..." : completedReservations}</div>
            <div className="stat-label">PAST RESERVATIONS</div>
          </div>
          <div className="stat-card green">
            <div className="stat-number">{loadingReservations ? "..." : cancelledReservations}</div>
            <div className="stat-label">CANCELLED</div>
          </div>
        </div>

        <div className="lower-section">

          {/* Labs panel with time slot nav */}
          <div className="labs-container">
            <div className="labs-header">
              <div className="section-title">Computer Laboratories</div>
              <span className="slot-nav">
                <button
                  type="button"
                  className="slot-btn"
                  onClick={handlePrevSlot}
                  disabled={slotIndex <= firstAvailableSlotIndex}
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

            {!loadingLabs && laboratories.map(function (lab) {
              const takenSeats = getTakenSeatsForLab(lab._id);
              const totalSeats = lab.capacity;
              const capacityClass = takenSeats >= totalSeats ? "red-cap" : "green-cap";

              return (
                <div className="lab-row" key={lab._id}>
                  <div className="lab-name">{lab.room_code}</div>
                  <div className={"capacity " + capacityClass}>
                    {takenSeats} / {totalSeats}
                  </div>
                  <a className="reserve-btn" onClick={function () { handleReserve(lab); }}>Reserve</a>
                </div>
              );
            })}
          </div>

          {/* Recent students panel */}
          <div className="students-container">
            <div className="section-title">Recent Students</div>

            {loadingStudents && <p>Loading recent students...</p>}

            {!loadingStudents && uniqueRecentStudents.map(function (student) {
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