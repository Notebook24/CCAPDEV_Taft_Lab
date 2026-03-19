import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../../style/admin_css/AdminManageSeatReservations.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';

function AdminManageSeatReservations() {
  const navigate = useNavigate();
  const location = useLocation();

  // whatever was passed from AdminBuildingDashboard
  const state = location.state;
  const selectedBuilding = state && state.selectedBuilding;
  const selectedLab = state && state.selectedLab;

  const [seats, setSeats] = useState([]);
  const [reservations, setReservations] = useState([]);

  // loads from avoiding crashing
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [error, setError] = useState(null);

  // tracks which seat popup is open right now, null means none
  const [popupSeatId, setPopupSeatId] = useState(null);

  // the seat the admin is currently doing something with
  const [activeSeat, setActiveSeat] = useState(null);

  // stores the full reservation info fetched from the API for view and edit modals
  const [reservationDetails, setReservationDetails] = useState(null);

  // one flag per modal, true means open false means closed
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // form fields for the reserve walk-in modal
  const [reserveName, setReserveName] = useState("");
  const [reserveEmail, setReserveEmail] = useState("");
  const [reserveDate, setReserveDate] = useState("");
  const [reserveStartTime, setReserveStartTime] = useState("");
  const [reserveEndTime, setReserveEndTime] = useState("");

  // form fields for the block seat modal
  const [blockDate, setBlockDate] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");

  // form fields for the edit reservation modal
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  // message shown inside any modal like success or error feedback
  const [modalMessage, setModalMessage] = useState("");

  // runs once on page load, fetches seats and reservations for this lab
  useEffect(function () {

    // early return if building or lab is missing so we dont crash the fetches
    if (!selectedBuilding || !selectedLab) 
        return;

    const buildingId = selectedBuilding._id;
    const labId = selectedLab._id;

    // debug logs
    console.log("buildingId:", buildingId);
    console.log("labId:", labId);

    // fetch all seats in this specific lab
    async function fetchSeats() {
      try {
        const res = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratory/" + labId + "/seats");
        if (!res.ok) 
          throw new Error("Failed to fetch seats: " + res.status);

        const data = await res.json();
        setSeats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingSeats(false);
      }
    }

    // fetch all ongoing reservations in this lab, used for the table at the bottom
    async function fetchReservations() {
      try {
        const res = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratory/" + labId + "/reservations");
        if (!res.ok) throw new Error("Failed to fetch reservations: " + res.status);
        const data = await res.json();
        setReservations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingReservations(false);
      }
    }

    fetchSeats();
    fetchReservations();
  }, []);

  // was for debugging but just in case, guard goes AFTER all hooks, if no building or lab was passed just show an error page
  if (!state || !selectedBuilding || !selectedLab) {
    return (
      <div className="admin-manage-reservations">
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
                <li><a href="#" onClick={function () { navigate("/login"); }}>Logout</a></li>
              </ul>
            </nav>
            <div className="profile-icon">
              <img src={profileIcon} alt="Profile Icon" />
            </div>
          </div>
        </header>
        <div className="sub-header">
          <h2>Error: No building or laboratory selected</h2>
        </div>
        <div style={{ padding: 32, color: 'red', fontWeight: 600 }}>
          Unable to load seat management. Please return to the Admin Building Dashboard and select a laboratory.
        </div>
      </div>
    );
  }

  // just counting seats by status for the 4 stat cards up top
  const totalSeats = seats.length;

  // count occupied seats
  let reservedSeats = 0;
  for (let i = 0; i < seats.length; i++) {
    if (seats[i].status === "Occupied") reservedSeats++;
  }
  // count available seats
  let unreservedSeats = 0;
  for (let i = 0; i < seats.length; i++) {
    if (seats[i].status === "Available") unreservedSeats++;
  }
  // count restricted seats
  let unavailableSeats = 0;
  for (let i = 0; i < seats.length; i++) {
    if (seats[i].status === "Closed") unavailableSeats++;
  }

  // every 4 seats = one row: seat seat NULL seat seat
  function buildFlatSeatItems() {
    const items = [];
    const seatsPerRow = 4;
    for (let i = 0; i < seats.length; i += seatsPerRow) {
      const chunk = seats.slice(i, i + seatsPerRow);
      items.push(chunk[0] || null);
      items.push(chunk[1] || null);
      items.push(null); // visual gap in the middle of each row
      items.push(chunk[2] || null);
      items.push(chunk[3] || null);
    }
    return items;
  }

  // looks through reservations to find who is sitting on a given seat
  // returns the full name or empty string if no one reserved it
  function getOccupantName(seat) {
    for (let i = 0; i < reservations.length; i++) {
      for (let j = 0; j < reservations[i].seat_id.length; j++) {
        if (reservations[i].seat_id[j]._id === seat._id) {
          return reservations[i].user_id.full_name;
        }
      }
    }
    return "";
  }

  // clicking a seat opens its popup, clicking it again closes it
  function handleSeatClick(seat) {
    if (popupSeatId === seat._id) {
      setPopupSeatId(null);
      return;
    }
    setActiveSeat(seat);
    setPopupSeatId(seat._id);
  }

  // clicking anywhere outside a seat closes the popup
  function handlePageClick() {
    setPopupSeatId(null);
  }

  // fetches the full reservation details for a seat from the backend
  // used by both view details and edit reservation since both need the same data
  async function fetchReservationDetails(seat) {
    try {
      const res = await fetch(
        "http://localhost:3000/admin/" + selectedBuilding._id +
        "/laboratory/" + selectedLab._id +
        "/view_details/" + seat._id
      );
      if (!res.ok) 
        throw new Error("Failed to fetch reservation details: " + res.status);
      
      const data = await res.json();
      setReservationDetails(data);
      return true;
    } catch (err) {
      setModalMessage(err.message);
      return false;
    }
  }

  // opens the reserve walk-in modal and resets all its form fields
  function handleOpenReserveModal(seat) {
    setPopupSeatId(null);
    setActiveSeat(seat);
    setReserveName("");
    setReserveEmail("");
    setReserveDate("");
    setReserveStartTime("");
    setReserveEndTime("");
    setModalMessage("");
    setShowReserveModal(true);
  }

  //opens the block seat modal and resets its fields
  function handleOpenBlockModal(seat) {
    setPopupSeatId(null);
    setActiveSeat(seat);
    setBlockDate("");
    setBlockStartTime("");
    setBlockEndTime("");
    setModalMessage("");
    setShowBlockModal(true);
  }

  // fetches details first then opens the view modal
  // cant open without details or the modal will be empty
  async function handleOpenViewModal(seat) {
    setPopupSeatId(null);
    setActiveSeat(seat);
    setModalMessage("");
    setReservationDetails(null);
    const success = await fetchReservationDetails(seat);
    if (success) setShowViewModal(true);
  }

  // same as view but opens the edit modal instead
  //needs details too because name and email fields are pre-filled from fetched data
  async function handleOpenEditModal(seat) {
    setPopupSeatId(null);
    setActiveSeat(seat);
    setEditDate("");
    setEditStartTime("");
    setEditEndTime("");
    setModalMessage("");
    setReservationDetails(null);
    const success = await fetchReservationDetails(seat);
    if (success) setShowEditModal(true);
  }

  // opens the remove confirmation modal
  function handleOpenRemoveModal(seat) {
    setPopupSeatId(null);
    setActiveSeat(seat);
    setModalMessage("");
    setShowRemoveModal(true);
  }

  //sends a POST request to reserve a seat for a walk-in student
  async function handleConfirmReserve() {
    setModalMessage("");
    try {
      const res = await fetch(
        "http://localhost:3000/admin/" + selectedBuilding._id +
        "/laboratory/" + selectedLab._id + "/reserve_seat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seat_numbers: [activeSeat.seat_number],
            name: reserveName,
            email: reserveEmail,
            date_reserved: reserveDate,
            reserve_startTime: reserveStartTime,
            reserve_endTime: reserveEndTime
          })
        }
      );
      const data = await res.json();
      if (!res.ok) 
        throw new Error(data.error || "Failed to reserve seat");

      setModalMessage("Reservation successful!");
      await refreshSeatsAndReservations();
      setShowReserveModal(false);
    } catch (err) {
      setModalMessage(err.message);
    }
  }

  // sends a POS T request to block a seat for a time window
  async function handleConfirmBlock() {
    setModalMessage("");
    try {
      const res = await fetch(
        "http://localhost:3000/admin/" + selectedBuilding._id +
        "/laboratory/" + selectedLab._id + "/block_seat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seat_number: activeSeat.seat_number,
            restricted_date: blockDate,
            start_time: blockStartTime,
            end_time: blockEndTime
          })
        }
      );
      const data = await res.json();
      if (!res.ok) 
        throw new Error(data.error || "Failed to block seat");
      setModalMessage("Seat blocked successfully!");
      await refreshSeatsAndReservations();
      setShowBlockModal(false);
    } catch (err) {
      setModalMessage(err.message);
    }
  }

  //sends a POST request to unblock a closed seat, no modal needed just instant action
  async function handleConfirmUnblock(seat) {
    try {
      const res = await fetch(
        "http://localhost:3000/admin/" + selectedBuilding._id +
        "/laboratory/" + selectedLab._id + "/unblock_seat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seat_number: seat.seat_number })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unblock seat");
      await refreshSeatsAndReservations();
      setPopupSeatId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  // sends a PUT request to update the date or time of an existing reservation
  async function handleConfirmEdit() {
    setModalMessage("");
    try {
      const res = await fetch(
        "http://localhost:3000/admin/" + selectedBuilding._id +
        "/laboratory/" + selectedLab._id +
        "/edit_reservation/" + activeSeat._id,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date_reserved: editDate,
            start_time: editStartTime,
            end_time: editEndTime
          })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to edit reservation");
      setModalMessage("Reservation updated successfully!");
      await refreshSeatsAndReservations();
      setShowEditModal(false);
    } catch (err) {
      setModalMessage(err.message);
    }
  }

  // sends a DELETE request to cancel a reservation and free the seat back to available
  async function handleConfirmRemove() {
    setModalMessage("");
    try {
      const res = await fetch(
        "http://localhost:3000/admin/" + selectedBuilding._id +
        "/laboratory/" + selectedLab._id +
        "/remove_reservation/" + activeSeat._id,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove reservation");
      setModalMessage("Reservation removed successfully!");
      await refreshSeatsAndReservations();
      setShowRemoveModal(false);
    } catch (err) {
      setModalMessage(err.message);
    }
  }

  // re-fetches seats and reservations after any action so the grid and table stay updated
  async function refreshSeatsAndReservations() {
    const buildingId = selectedBuilding._id;
    const labId = selectedLab._id;
    try {
      const seatsRes = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratory/" + labId + "/seats");
      const seatsData = await seatsRes.json();
      setSeats(seatsData);

      const resRes = await fetch("http://localhost:3000/admin/" + buildingId + "/laboratory/" + labId + "/reservations");
      const resData = await resRes.json();
      setReservations(resData);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    navigate("/login");
  }

  const flatSeatItems = buildFlatSeatItems();

  // 5 columns because each row is seat seat null seat seat
  const gridStyle = { gridTemplateColumns: "repeat(5, minmax(70px, 1fr))" };

  return (
    <div className="admin-manage-reservations" onClick={handlePageClick}>

      {/* header */}
      <header onClick={function (e) { e.stopPropagation(); }}>
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

      {/* shows the building and room name */}
      <div className="sub-header">
        <h2>{selectedBuilding.building_name} - {selectedLab.room_code}</h2>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-container">
        <div className="panel">

          {/* 4 stat cards showing seat counts */}
          <div className="stats-row">
            <div className="stat-card green">
              <div className="stat-number">{loadingSeats ? "..." : totalSeats}</div>
              <div className="stat-label">NUMBER OF SEATS</div>
            </div>
            <div className="stat-card gray">
              <div className="stat-number">{loadingSeats ? "..." : reservedSeats}</div>
              <div className="stat-label">RESERVED SEATS</div>
            </div>
            <div className="stat-card green">
              <div className="stat-number">{loadingSeats ? "..." : unreservedSeats}</div>
              <div className="stat-label">UNRESERVED SEATS</div>
            </div>
            <div className="stat-card gray">
              <div className="stat-number">{loadingSeats ? "..." : unavailableSeats}</div>
              <div className="stat-label">UNAVAILABLE SEATS</div>
            </div>
          </div>

          {/* the actual seat grid where admin can click seats */}
          <div className="seat-grid-container">
            <h3>MANAGE ROOM SEATS</h3>

            {loadingSeats && <p>Loading seats...</p>}

            {!loadingSeats && (
              <div
                className="seat-grid"
                id="seatGrid"
                style={gridStyle}
                onClick={function (e) { e.stopPropagation(); }}
              >
                {flatSeatItems.map(function (seat, index) {

                  // null means its a spacer slot, render a blank div for the middle gap
                  if (seat === null) {
                    return <div className="seat space" key={"spacer-" + index} />;
                  }

                  // pick the right css class based on seat status
                  let seatClass = "seat available";
                  if (seat.status === "Occupied") seatClass = "seat taken";
                  else if (seat.status === "Closed") seatClass = "seat closed";

                  const occupantName = getOccupantName(seat);

                  return (
                    <div key={seat._id} style={{ position: "relative" }}>

                      {/* the clickable seat button */}
                      <button
                        type="button"
                        className={seatClass}
                        onClick={function (e) {
                          e.stopPropagation();
                          handleSeatClick(seat);
                        }}
                      >
                        <div>{seat.seat_number}</div>
                        {/* show the occupant name if someone reserved this seat */}
                        {occupantName !== "" && (
                          <span className="seat-name">{occupantName}</span>
                        )}
                      </button>

                      {/* popup appears right beside the seat when clicked */}
                      {popupSeatId === seat._id && (
                        <div
                          id="seatPopup"
                          style={{
                            position: "absolute",
                            background: "#e7f3ec",
                            border: "3px solid #ddd",
                            borderRadius: "6px",
                            fontSize: "14px",
                            zIndex: "1000",
                            padding: "5px",
                            textAlign: "center",
                            top: "0px",
                            left: "105%",
                            minWidth: "160px"
                          }}
                          onClick={function (e) { e.stopPropagation(); }}
                        >

                          {/* available seats can be reserved or blocked */}
                          {seat.status === "Available" && (
                            <div>
                              <h3 style={{ color: "green" }}>AVAILABLE</h3>
                              <button
                                className="available_seat_manage_option_btn"
                                onClick={function () { handleOpenReserveModal(seat); }}
                              >
                                Reserve Student
                              </button>
                              <button
                                className="available_seat_manage_option_btn available_seat_manage_option_block_btn"
                                onClick={function () { handleOpenBlockModal(seat); }}
                              >
                                Block Reservations
                              </button>
                            </div>
                          )}

                          {/* occupied seats can be viewed, edited, or removed */}
                          {seat.status === "Occupied" && (
                            <div>
                              <h3 style={{ color: "#dd5c36" }}>RESERVED</h3>
                              <button
                                className="unavailable_seat_manage_option_btn"
                                onClick={function () { handleOpenViewModal(seat); }}
                              >
                                View Details
                              </button>
                              <button
                                className="unavailable_seat_manage_option_btn"
                                onClick={function () { handleOpenEditModal(seat); }}
                              >
                                Edit Reservation
                              </button>
                              <button
                                className="unavailable_seat_manage_option_btn unavailable_seat_manage_option_delete_btn"
                                onClick={function () { handleOpenRemoveModal(seat); }}
                              >
                                Remove Reservation
                              </button>
                            </div>
                          )}

                          {/* closed seats can only be unblocked */}
                          {seat.status === "Closed" && (
                            <div>
                              <h3 style={{ color: "#888" }}>CLOSED</h3>
                              <p style={{ fontSize: "12px", color: "#555", marginBottom: "6px" }}>
                                This seat is blocked.
                              </p>
                              <button
                                className="available_seat_manage_option_btn available_seat_manage_option_block_btn"
                                onClick={function () { handleConfirmUnblock(seat); }}
                              >
                                Unblock Seat
                              </button>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* color guide for the seat grid */}
            <div className="legend">
              <span><span className="box available"></span>Available</span>
              <span><span className="box taken"></span>Reserved</span>
              <span><span className="box closed"></span>Closed</span>
            </div>
          </div>

          {/*table showing all ongoing reservations for this lab */}
          <div className="reserved-table-container">
            <h3>Reserved Seats</h3>
            {loadingReservations && <p>Loading reservations...</p>}
            {!loadingReservations && (
              <table className="reserved-table">
                <thead>
                  <tr>
                    <th>Reserved Seats</th>
                    <th>Time Slot</th>
                    <th>Reserved Person</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(function (reservation) {
                    // one reservation can have multiple seats so join them all
                    const seatNumbers = reservation.seat_id.map(function (s) {
                      return s.seat_number;
                    }).join(", ");
                    return (
                      <tr key={reservation._id}>
                        <td>{seatNumbers}</td>
                        <td>{reservation.reserve_startTime} - {reservation.reserve_endTime}</td>
                        <td>{reservation.user_id.full_name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>

      {/* modal for reserving a walk-in student to a seat */}
      {showReserveModal && (
        <div className="reserve-student" style={{ display: "flex" }}>
          <div className="modal-card-reserve-student">
            <h3>Reserve Walk-In Student</h3>
            <div className="reserve-content">
              <div className="edit-group">
                <label>Seat Number</label>
                <input type="text" value={activeSeat ? activeSeat.seat_number : ""} disabled />
              </div>
              <div className="edit-group">
                <label>Name</label>
                <input type="text" value={reserveName} onChange={function (e) { setReserveName(e.target.value); }} />
              </div>
              <div className="edit-group">
                <label>Email</label>
                <input type="email" value={reserveEmail} onChange={function (e) { setReserveEmail(e.target.value); }} />
              </div>
              <div className="edit-group">
                <label>Date</label>
                <input type="date" value={reserveDate} onChange={function (e) { setReserveDate(e.target.value); }} />
              </div>
              <div className="edit-group">
                <label>Start Time</label>
                <input type="time" value={reserveStartTime} onChange={function (e) { setReserveStartTime(e.target.value); }} />
              </div>
              <div className="edit-group">
                <label>End Time</label>
                <input type="time" value={reserveEndTime} onChange={function (e) { setReserveEndTime(e.target.value); }} />
              </div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleConfirmReserve}>Reserve</button>
              <button className="modal-btn cancel" onClick={function () { setShowReserveModal(false); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* modal for blocking a seat for a specific date and time */}
      {showBlockModal && (
        <div className="block-reservations" style={{ display: "flex" }}>
          <div className="modal-card-block-reservations">
            <h3>Block Seat</h3>
            <div className="block-content">
              <div className="edit-group">
                <label>Seat Number</label>
                <input type="text" value={activeSeat ? activeSeat.seat_number : ""} disabled />
              </div>
              <div className="edit-group">
                <label>Date</label>
                <input type="date" value={blockDate} onChange={function (e) { setBlockDate(e.target.value); }} />
              </div>
              <div className="edit-group">
                <label>Start Time</label>
                <input type="time" value={blockStartTime} onChange={function (e) { setBlockStartTime(e.target.value); }} />
              </div>
              <div className="edit-group">
                <label>End Time</label>
                <input type="time" value={blockEndTime} onChange={function (e) { setBlockEndTime(e.target.value); }} />
              </div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleConfirmBlock}>Block</button>
              <button className="modal-btn cancel" onClick={function () { setShowBlockModal(false); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* modal to view full reservation info for a seat, read only */}
      {showViewModal && reservationDetails && (
        <div className="view-details" style={{ display: "flex" }}>
          <div className="modal-card-view-details">
            <h3>Reservation Details</h3>
            <div className="view-details-content">
              <div className="view-details-item">
                <span className="label">Name</span>
                <span className="value">{reservationDetails.full_name}</span>
              </div>
              <div className="view-details-item">
                <span className="label">Email</span>
                <span className="value">{reservationDetails.email}</span>
              </div>
              <div className="view-details-item">
                <span className="label">Seat Number</span>
                <span className="value">{reservationDetails.seat_numbers.join(", ")}</span>
              </div>
              <div className="view-details-item">
                <span className="label">Date Reserved</span>
                <span className="value">{new Date(reservationDetails.date_reserved).toLocaleDateString()}</span>
              </div>
              <div className="view-details-item">
                <span className="label">Start Time</span>
                <span className="value">{reservationDetails.start_time}</span>
              </div>
              <div className="view-details-item">
                <span className="label">End Time</span>
                <span className="value">{reservationDetails.end_time}</span>
              </div>
              <div className="view-details-item">
                <span className="label">Laboratory</span>
                <span className="value">{reservationDetails.room_code}</span>
              </div>
              <div className="view-details-item">
                <span className="label">Building</span>
                <span className="value">{reservationDetails.building}</span>
              </div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={function () { setShowViewModal(false); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* modal to edit the date and time of an existing reservation
          name and email are disabled because we dont want those changed here */}
      {showEditModal && reservationDetails && (
        <div className="edit-reservation" style={{ display: "flex" }}>
          <div className="modal-card-edit-reservation">
            <h3>Edit Reservation</h3>
            <div className="edit-content">
              <div className="edit-group">
                <label>Name</label>
                <input type="text" value={reservationDetails.full_name} disabled />
              </div>
              <div className="edit-group">
                <label>Email</label>
                <input type="email" value={reservationDetails.email} disabled />
              </div>
              <div className="edit-group">
                <label>Date Reserved</label>
                <input type="date" value={editDate} onChange={function (e) { setEditDate(e.target.value); }} />
              </div>
              <div className="edit-group">
                <label>Start Time</label>
                <input type="time" value={editStartTime} onChange={function (e) { setEditStartTime(e.target.value); }} />
              </div>
              <div className="edit-group">
                <label>End Time</label>
                <input type="time" value={editEndTime} onChange={function (e) { setEditEndTime(e.target.value); }} />
              </div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleConfirmEdit}>Confirm</button>
              <button className="modal-btn cancel" onClick={function () { setShowEditModal(false); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* confirmation modal before removing a reservation */}
      {showRemoveModal && (
        <div className="remove-reservation" style={{ display: "flex" }}>
          <div className="modal-card-remove-reservation">
            <h3>
              Are you sure you want to remove the reservation for Seat {activeSeat ? activeSeat.seat_number : ""}?
            </h3>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn danger" onClick={handleConfirmRemove}>Remove</button>
              <button className="modal-btn cancel" onClick={function () { setShowRemoveModal(false); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminManageSeatReservations;