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

function AdminHomePage() {
  const navigate = useNavigate();

  // holds the list of buildings fetched from the database
  const [dbBuildings, setDbBuildings] = useState([]);

  // tracks whether we're still waiting for the data to arrive
  const [loading, setLoading] = useState(true);

  // stores any error message if something goes wrong with the fetch
  const [error, setError] = useState(null);

  // fix made here - kien
  // /GEN NOTE: THIS IS JUST FOR LOCAL MAPPING: images and descriptions cant come from the DB, so we have to do matching heree with defined image paths and descs
  const buildings = [
    {
      title: 'St. La Salle Hall',
      image: LS_img,
      description: "Monitor and manage student computer lab reservations in St. La Salle Hall.",
    },
    {
      title: 'Gokongwei Hall',
      image: GK_img,
      description: "Monitor and manage student computer lab reservations in Gokongwei Hall.",
    },
    {
      title: 'Br. Andrew Gonzales Hall',
      image: AG_img,
      description: "Monitor and manage student computer lab reservations in Br. Andrew Gonzales Hall.",
    },
    {
      title: 'Don Enrique Yuchengco Hall',
      image: Y_img,
      description: "Monitor and manage student computer lab reservations in Don Enrique Yuchengco Hall.",
    },
    {
      title: 'Velasco Hall',
      image: V_img,
      description: "Monitor and manage student computer lab reservations in Velasco Hall.",
    },
  ];

  // fetch the buildings from the backend on page load
  useEffect(function() {
    async function fetchBuildings() {
      try {
        // call the /admin API to get all buildings from the db
        const res = await fetch("http://localhost:3000/admin");

        if (!res.ok) {
          throw new Error("Server error: " + res.status);
        }

        const data = await res.json();
        setDbBuildings(data);

      } catch (err) {
        setError(err.message || "Failed to load buildings.");
      } finally {
        setLoading(false);
      }
    }

    fetchBuildings();
  }, []);

  // takes a building from the DB and finds the matching image and description
  // from the local buildings array above by comparing building_name to title
  // if no match found, returns null image and a generic description as fallback
  function getLocalInfo(dbBuilding) {
    for (let i = 0; i < buildings.length; i++) {
      if (buildings[i].title === dbBuilding.building_name) {
        return {
          image: buildings[i].image,
          description: buildings[i].description,
        };
      }
    }

    // fallback just in case a new building in the DB has no local entry yet
    return {
      image: null,
      description: "Manage reservations in " + dbBuilding.building_name + ".",
    };
  }

  // navigates to the building dashboard and passes the selected building via router state
  function handleManageRooms(building) {
    navigate("/admin/building-dashboard", { state: { selectedBuilding: building } });
  }

  function handleLogout() {
    navigate("/login");
  }

  return (
    <div className="admin-homepage">

      {/* header */}
      <header>
        <div className="logo">
          <a href="/admin">
            <img src={taftlabLogo} alt="TaftLab Logo" />
          </a>
        </div>

        <div className="header-right">
          <nav>
            <ul>
              <li><a href="/admin" style={{ color: 'green' }}>Home</a></li>
              <li><a href="/admin/profile">Profile</a></li>
              <li><a href="#" onClick={handleLogout}>Logout</a></li>
            </ul>
          </nav>
          <div className="profile-icon">
            <img src={profileIcon} alt="Profile Icon" />
          </div>
        </div>
      </header>

      {/* subheader */}
      <div className="admin-subheader">
        <h2>Welcome, LabTech!</h2>
      </div>

      {/* building cards, all from DB, images and descriptions matched locally */}
      <div className="boxes-container">

        {loading && <p>Loading buildings...</p>}

        {!loading && error && <p className="error-message">{error}</p>}

        {!loading && !error && dbBuildings.map(function(dbBuilding) {

          const localInfo = getLocalInfo(dbBuilding);

          return (
            <div className="box" key={dbBuilding._id}>

              {localInfo.image
                ? <img src={localInfo.image} alt="Lab Picture" className="box-img" />
                : <div className="box-img-placeholder" />
              }

              <div className="box-text">
                <h3>{dbBuilding.building_name}</h3>
                <p>{localInfo.description}</p>
                <button className="admin-btn" onClick={function() { handleManageRooms(dbBuilding); }}>
                  Manage Rooms
                </button>
              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
}

export default AdminHomePage;