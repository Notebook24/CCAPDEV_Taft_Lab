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

  //hold the list of buildings we get from the database
  const [dbBuildings, setDbBuildings] = useState([]);
  //tracks whether we're still waiting for the data to arrive
  const [loading, setLoading] = useState(true);
  // stores any error message if something goes wrong with the fetch
  const [error, setError] = useState(null);
	// almost same code excerpt as user home page
  const buildings = [
    {
      id: 102,
      title: 'St. La Salle Hall',
      image: LS_img,
      description: "Monitor and manage student computer lab reservations in St. La Salle Hall.",
    },
    {
      id: 101,
      title: 'Gokongwei Hall',
      image: GK_img,
      description: "Monitor and manage student computer lab reservations in Gokongwei Hall.",
    },
    {
      id: 103,
      title: 'Br. Andrew Gonzales Hall',
      image: AG_img,
      description: "Monitor and manage student computer lab reservations in Br. Andrew Gonzales Hall.",
    },
    {
      id: 105,
      title: 'Don Enrique Yuchengco Hall',
      image: Y_img,
      description: "Monitor and manage student computer lab reservations in Don Enrique Yuchengco Hall.",
    },
    {
      id: 104,
      title: 'Velasco Hall',
      image: V_img,
      description: "Monitor and manage student computer lab reservations in Velasco Hall.",
    },
  ];

    // Wfetch the buildings from the backenD
    useEffect(() => {
      const fetchBuildings = async () => {
        try {
        // call the /admin API to get all buildings from the db
        const res = await fetch("http://localhost:3000/admin");

        // server returned an error status, throw an error
        if (!res.ok) 
          throw new Error("Server error: " + res.status);
          
        // successful
        const data = await res.json();

        setDbBuildings(data);

        } catch (err) {
            setError(err.message || "Failed to load buildings.");
        } finally {
              setLoading(false);
        }
      };

      fetchBuildings();
      }, 
    []);

  // now, we takke a building from the db and do matching
  function getLocalInfo(dbBuilding) {
    // loop through our local buildings to find one with the same name
    for (let i = 0; i < buildings.length; i++) {
      if (buildings[i].title === dbBuilding.building_name) {
        return {
          image: buildings[i].image,
          description: buildings[i].description,
        };
      }
    }

    // fallback if no match JUST IN CASE
    return {
      image: null,
      description: "Manage reservations in " + dbBuilding.building_name + ".",
    };
  }

  // handles clicking "Manage Rooms" on a building card, navigates to the building dashboard and passes the selected building itself
  function handleManageRooms(building) {
    navigate("/admin/building-dashboard", { state: { selectedBuilding: building } });
  }

  // brings the user back to the login page
  function handleLogout() {
    navigate("/login");
  }

  // rendering codes
  return (
    <div className="admin-homepage">

      {/* header part*/}
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
      {/* building cards/containers */}
      <div className="boxes-container">
        {/*while waiting for full fetch, just in case, show loading */}
        {loading && <p>Loading buildings...</p>}

        {/* error message if failed */}
        {!loading && error && <p className="error-message">{error}</p>}
        {/*  loaded successfully, render a card for each building */}
        {!loading && !error && dbBuildings.map(function(dbBuilding) {

          // Get the matching image and description from our local buildings array
          const localInfo = getLocalInfo(dbBuilding);
          return (
            <div className="box" key={dbBuilding._id}>
              {/* show the building image if we have one, if not, show a placeholder */}
              {localInfo.image
                ? <img src={localInfo.image} alt="Lab Picture" className="box-img" /> // lab pic
                : <div className="box-img-placeholder" /> // placeholder
              }

              <div className="box-text"> 
                <h3>{dbBuilding.building_name}</h3>
                <p>{localInfo.description}</p>
                {/* go to the specific or selected bldg dashboard */}
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
