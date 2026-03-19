import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../../style/admin_css/AdminBuildingDashboard.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';

function AdminBuildingDashboard() {
    const navigate = useNavigate();
    const location = useLocation(); // via router state, selected bldg is passed form home page
    const selectedBuilding = location.state.selectedBuilding;
    
    // Fallback for missing selectedBuilding
    if (!selectedBuilding) {
      return (
        <div className="admin-building-dashboard">
          <header>
            <div className="logo">
              <a href="/admin">
                <img src={taftlabLogo} alt="TaftLab Logo" />
              </a>
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

    // list of laboratories for this building with reservation counts ofc
    const [laboratories, setLaboratories] = useState([]);

    // all reservations for this building as mother array
    const [reservations, setReservations] = useState([]);

    // 5 most recent students who reserved in this building
    const [recentStudents, setRecentStudents] = useState([]);

    // loading and error states for each fetch separately to ensure no breaks of entire page
    const [loadingLabs, setLoadingLabs] = useState(true);
    const [loadingReservations, setLoadingReservations] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedBuilding) {
          // Defensive: don't run fetches if missing
          setError("No building selected. Cannot load dashboard.");
          setLoadingLabs(false);
          setLoadingReservations(false);
          setLoadingStudents(false);
          console.warn("AdminBuildingDashboard: selectedBuilding missing in location.state");
          return;
        }

        const buildingId = selectedBuilding._id;

        // FETCH 1: all laboratories in this building (with reservation_count)
        async function fetchLaboratories() {
          try {
            const res = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratories");
            if (!res.ok) {
              throw new Error("Failed to fetch laboratories: " + res.status);
            }
            // set labs 
            const data = await res.json();
            setLaboratories(data);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoadingLabs(false);
          }
        }

        // FETCH 2: Get all reservations for this building 
        async function fetchReservations() {
          try {
            const res = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratories/reservations");
            if (!res.ok) {
              throw new Error("Failed to fetch reservations: " + res.status);
            }
            const data = await res.json();
            setReservations(data);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoadingReservations(false);
          }
        }

        // FETCH 3:  the five most recent students who reserved in this building 
        async function fetchRecentStudents() {
          try {
            const res = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratories/recent_students");
            if (!res.ok) {
              throw new Error("Failed to fetch recent students: " + res.status);
            }
            const data = await res.json();
            setRecentStudents(data);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoadingStudents(false);
          }
        }

        // call all fetches one at time 
        fetchLaboratories();
        fetchReservations();
        fetchRecentStudents();

      }, []);


  // get today's date as a plain date string (YYYY-MM-DD) for comparison purposes
  const today = new Date().toISOString().split("T")[0];

  // count reservations where the date matches today
  let reservationsToday = 0;
  for (let i = 0; i < reservations.length; i++) {
    const reservationDate = new Date(reservations[i].date_reserved).toISOString().split("T")[0];
    if (reservationDate === today) {
      reservationsToday = reservationsToday + 1;
    }
  }
  // count ongoing reservations 
  let ongoingReservations = 0;
  for (let i = 0; i < reservations.length; i++) {
    if (reservations[i].status === "Ongoing") {
      ongoingReservations = ongoingReservations + 1;
    }
  }
  // count past reservations
  let pastReservations = 0;
  for (let i = 0; i < reservations.length; i++) {
    if (reservations[i].status === "Completed") {
      pastReservations = pastReservations + 1;
    }
  }
  // count cancelled reservations
  let cancelledReservations = 0;
  for (let i = 0; i < reservations.length; i++) {
    if (reservations[i].status === "Cancelled") {
      cancelledReservations = cancelledReservations + 1;
    }
  }

  // goes to reservations page for this building and selected lab
  function handleReserve(laboratory) {
    navigate("/admin/manage-reservations", {
      state: {
        selectedBuilding: selectedBuilding,
        selectedLab: laboratory
      }
    });
  }

  function handleLogout() {
    navigate("/login");
  }

  // rendering stutffs
  return (
    <div className="admin-building-dashboard">

      {/*header part*/}
      <header>
        <div className="logo">
          <a href="/admin">
            <img src={taftlabLogo} alt="TaftLab Logo" />
          </a>
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

      {/*building name sub-header*/}
      <div className="sub-header">
          <h2>{selectedBuilding.building_name}</h2>
      </div>

      {/* fallback error message for any failed fetch */}
      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-container">

        {/* statisticsof the day */}
        <div className="stats-row">
          <div className="stat-card green">
            <div className="stat-number">
              {loadingReservations ? "..." : reservationsToday}
            </div>
            <div className="stat-label">RESERVATIONS TODAY</div>
          </div>

          <div className="stat-card gray">
            <div className="stat-number">
              {loadingReservations ? "..." : ongoingReservations}
            </div>
            <div className="stat-label">ONGOING RESERVATIONS</div>
          </div>

          <div className="stat-card green">
            <div className="stat-number">
              {loadingReservations ? "..." : pastReservations}
            </div>
            <div className="stat-label">PAST RESERVATIONS</div>
          </div>

          <div className="stat-card gray">
            <div className="stat-number">
              {loadingReservations ? "..." : cancelledReservations}
            </div>
            <div className="stat-label">CANCELLED RESERVATIONS</div>
          </div>

        </div>

        {/* labs on the left, recent students on the right container */}
        <div className="lower-section">

          {/* ── left part: the comp labs */}
          <div className="labs-container">
            <div className="section-title">Computer Laboratories</div>

            {loadingLabs && <p>Loading laboratories...</p>}

            {!loadingLabs && laboratories.map(function(lab) {

              // how many seats available vs total capacity
              const availableSeats = lab.reservation_count;
              const totalSeats = lab.capacity;

              // all seats are taken (red), if not (green) 
              const capacityClass = availableSeats >= totalSeats ? "red-cap" : "green-cap";

              // nested render for lab rows
              return (
                <div className="lab-row" key={lab._id}>
                  <div className="lab-name">{lab.room_code}</div>
                  <div className={"capacity " + capacityClass}>
                     {availableSeats} / {totalSeats}
                  </div>
                  <a className="reserve-btn" onClick={function() { handleReserve(lab); }}>Reserve</a>
                </div>
              );
            })}

          </div>

          {/* right part is most recent students who reserved */}
          <div className="students-container">
            <div className="section-title">Recent Students</div>

            {loadingStudents && <p>Loading recent students...</p>}

            {!loadingStudents && recentStudents.map(function(student) {
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
