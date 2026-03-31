import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../style/admin_css/AdminHomePage.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';
import LS_img from "../../assets/images/LS_229_indoor_1.jpg";
import GK_img from "../../assets/images/GK_304B_indoor_1.jpg";
import AG_img from "../../assets/images/AG_1904_indoor_1.jpg";
import Y_img from "../../assets/images/Y_602_indoor_1.jpg";
import V_img from "../../assets/images/V_103_indoor_3.jpg";
import studentIcon from "../../assets/images/student-icon.png";
import checkIcon from "../../assets/images/check-icon.png";
import API_BASE_URL from '../../config/api';

function AdminHomePage() {
  const navigate = useNavigate();
  const [dbBuildings, setDbBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalUsers, setTotalUsers] = useState(null);
  const [totalReservations, setTotalReservations] = useState(null);
  const [buildingStats, setBuildingStats] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [profilePicture, setProfilePicture] = useState(profileIcon);
  const [adminName, setAdminName] = useState('');
  const [imageKey, setImageKey] = useState(Date.now());

  useEffect(() => {
    const checkAdminRole = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/user/profile/${userId}`);
        if (!response.ok) {
          localStorage.removeItem('user_id');
          navigate('/login');
          return;
        }

        const data = await response.json();
        if (data.user_type !== 'admin') {
          navigate('/user');
        } else {
          setAdminName(data.full_name.split(' ')[0]);
          if (data.profile_picture) {
            setProfilePicture(`${API_BASE_URL}/user/profile-picture/${userId}`);
          } else {
            setProfilePicture(profileIcon);
          }
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
      }
    };
    
    checkAdminRole();
  }, [navigate]);

  const buildings = [
    { title: 'St. La Salle Hall', image: LS_img, description: "Monitor and manage student computer lab reservations in St. La Salle Hall."},
    { title: 'Gokongwei Hall', image: GK_img, description: "Monitor and manage student computer lab reservations in Gokongwei Hall."},
    { title: 'Br. Andrew Gonzales Hall', image: AG_img, description: "Monitor and manage student computer lab reservations in Br. Andrew Gonzales Hall."},
    { title: 'Don Enrique Yuchengco Hall', image: Y_img, description: "Monitor and manage student computer lab reservations in Don Enrique Yuchengco Hall."},
    { title: 'Velasco Hall', image: V_img, description: "Monitor and manage student computer lab reservations in Velasco Hall."},
  ];

  const PIE_COLORS = ['#006937', '#20b15a', '#5dbe7e', '#96d9a8', '#c3eccd'];

  useEffect(function() {
    const timer = setInterval(function() { setCurrentDateTime(new Date()); }, 1000);
    return function() { clearInterval(timer); };
  }, []);

  useEffect(function() {
    async function fetchAll() {
      try {
        const buildingsRes = await fetch(`${API_BASE_URL}/admin`);
        if (!buildingsRes.ok) throw new Error("Server error: " + buildingsRes.status);
        const buildingsData = await buildingsRes.json();
        setDbBuildings(buildingsData);

        const usersRes = await fetch(`${API_BASE_URL}/admin/stats/total_students`);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setTotalUsers(usersData.total_students);
        }

        const reservationsRes = await fetch(`${API_BASE_URL}/admin/stats/total_reservations`);
        if (reservationsRes.ok) {
          const reservationsData = await reservationsRes.json();
          setTotalReservations(reservationsData.total_reservations);
        }

        const stats = [];
        for (let i = 0; i < buildingsData.length; i++) {
          const b = buildingsData[i];
          const r = await fetch(`${API_BASE_URL}/admin/${b._id}/laboratories/reservations`);
          if (r.ok) {
            const rData = await r.json();
            stats.push({ name: b.building_name, count: rData.length, color: PIE_COLORS[i % PIE_COLORS.length] });
          }
        }
        setBuildingStats(stats);

      } catch (err) {
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  function getLocalInfo(dbBuilding) {
    for (let i = 0; i < buildings.length; i++) {
      if (buildings[i].title === dbBuilding.building_name) {
        return { image: buildings[i].image, description: buildings[i].description };
      }
    }
    return { image: null, description: "Manage reservations in " + dbBuilding.building_name + "." };
  }

  function handleManageRooms(building) {
    navigate("/admin/building-dashboard", { state: { selectedBuilding: building } });
  }

  function handleLogout() { navigate("/admin-login"); }

  function formatClock(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return { hours: hours.toString().padStart(2, "0"), minutes, ampm };
  }

  function formatDate(date) {
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return days[date.getDay()] + ", " + months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
  }

  function buildPieChart() {
    const total = buildingStats.reduce(function(sum, b) { return sum + b.count; }, 0);
    if (total === 0) return null;

    const cx = 80, cy = 80, r = 70;
    let currentAngle = -Math.PI / 2;
    const slices = [];

    for (let i = 0; i < buildingStats.length; i++) {
      const b = buildingStats[i];
      if (b.count === 0) continue;
      const sliceAngle = (b.count / total) * 2 * Math.PI;

      if (Math.abs(sliceAngle - 2 * Math.PI) < 0.001) {
        slices.push(<circle key={i} cx={cx} cy={cy} r={r} fill={b.color} />);
      } else {
        const x1 = cx + r * Math.cos(currentAngle);
        const y1 = cy + r * Math.sin(currentAngle);
        const x2 = cx + r * Math.cos(currentAngle + sliceAngle);
        const y2 = cy + r * Math.sin(currentAngle + sliceAngle);
        const largeArc = sliceAngle > Math.PI ? 1 : 0;
        slices.push(
          <path key={i} d={"M " + cx + " " + cy + " L " + x1 + " " + y1 + " A " + r + " " + r + " 0 " + largeArc + " 1 " + x2 + " " + y2 + " Z"} fill={b.color} stroke="white" strokeWidth="2" />
        );
      }
      currentAngle += sliceAngle;
    }

    return (
      <svg viewBox="0 0 160 160" className="pie-svg">
        {slices}
        <circle cx={cx} cy={cy} r={40} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#006937">TOTAL</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="14" fontWeight="800" fill="#006937">{total}</text>
      </svg>
    );
  }

  const clock = formatClock(currentDateTime);

  return (
    <div className="admin-homepage">

      <header>
        <div className="logo">
          <a href="/admin"><img src={taftlabLogo} alt="TaftLab Logo" /></a>
        </div>
        <div className="header-right">
          <nav>
            <ul>
              <li><a href="/admin" style={{ color: 'green' }}>Home</a></li>
              <li><a href="/admin/profile">Profile</a></li>
              <li><a href="/admin/add-lab-technician">Add Lab Technician</a></li>
              <li><a href="#" onClick={handleLogout}>Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <img 
              key={imageKey}
              src={profilePicture} 
              alt="Profile Icon" 
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => { e.target.onerror = null; e.target.src = profileIcon; }}
            />
          </div>
        </div>
      </header>

      <div className="admin-subheader">
        <h2>Welcome, {adminName || 'LabTech'}!</h2>
      </div>

      {loading && <p className="loading-msg">Loading...</p>}
      {!loading && error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <div className="homepage-layout">

          <div className="buildings-list">
            {dbBuildings.map(function(dbBuilding) {
              const localInfo = getLocalInfo(dbBuilding);
              return (
                <div className="building-card" key={dbBuilding._id}>
                  <div className="building-card-img-wrap">
                    {localInfo.image
                      ? <img src={localInfo.image} alt="Lab" className="building-card-img" />
                      : <div className="building-card-img-placeholder" />
                    }
                  </div>
                  <div className="building-card-body">
                    <h3>{dbBuilding.building_name}</h3>
                    <p>{localInfo.description}</p>
                    <button className="manage-btn" onClick={function() { handleManageRooms(dbBuilding); }}>
                      Manage Rooms
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="stats-panel">

            <div className="dash-card clock-card">
              <div className="clock-date">Today is {formatDate(currentDateTime)}</div>
              <div className="clock-display">
                <span className="clock-digits">{clock.hours}</span>
                <span className="clock-colon">:</span>
                <span className="clock-digits">{clock.minutes}</span>
                <div className="clock-ampm">
                  <span className={clock.ampm === "AM" ? "ampm-active" : "ampm-inactive"}>AM</span>
                  <span className={clock.ampm === "PM" ? "ampm-active" : "ampm-inactive"}>PM</span>
                </div>
              </div>
            </div>

            <div className="dash-card stat-card-item">
              <div className="stat-card-icon"><img src={studentIcon} alt="Users" /></div>
              <div className="stat-card-info">
                <div className="stat-card-label">TOTAL STUDENTS</div>
                <div className="stat-card-value">{totalUsers !== null ? totalUsers.toLocaleString() : "..."}</div>
              </div>
            </div>

            <div className="dash-card stat-card-item">
              <div className="stat-card-icon"><img src={checkIcon} alt="Users" /></div>
              <div className="stat-card-info">
                <div className="stat-card-label">TOTAL RESERVATIONS</div>
                <div className="stat-card-value">{totalReservations !== null ? totalReservations.toLocaleString() : "..."}</div>
              </div>
            </div>

            <div className="dash-card pie-card">
              <div className="pie-card-title">RESERVATIONS PER BUILDING</div>
              <div className="pie-chart-wrap">
                {buildingStats.length > 0 ? buildPieChart() : <p className="pie-empty">No reservation data yet.</p>}
              </div>
              <div className="pie-legend">
                {buildingStats.map(function(b, i) {
                  const total = buildingStats.reduce(function(s, x) { return s + x.count; }, 0);
                  const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
                  const shortName = b.name
                    .replace("Br. Andrew Gonzales Hall", "Andrew Hall")
                    .replace("Don Enrique Yuchengco Hall", "Yuchengco Hall")
                    .replace("St. La Salle Hall", "LS Hall");
                  return (
                    <div className="pie-legend-item" key={i}>
                      <span className="pie-legend-dot" style={{ background: b.color }}></span>
                      <span className="pie-legend-name">{shortName}</span>
                      <span className="pie-legend-pct">{b.count} - ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHomePage;