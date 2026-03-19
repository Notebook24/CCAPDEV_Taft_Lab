import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../../style/admin_css/AdminManageSeatReservations.css";
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

function AdminManageSeatReservations() {
  const navigate = useNavigate();
  const location = useLocation();

  // passed from AdminBuildingDashboard when admin clicks Reserve on a lab
  const state = location.state;
  const selectedBuilding = state && state.selectedBuilding;
  const selectedLab = state && state.selectedLab;

  // seats returned from /available_seats, each has is_available based on the selected slot
  const [seats, setSeats] = useState([]);

  // all reservations for this lab, used for the table and occupant name lookups
  const [reservations, setReservations] = useState([]);

  const [loadingSeats, setLoadingSeats] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [error, setError] = useState(null);

  // if coming from the dashboard, use the slot and date that was already selected there
  // otherwise default to today with no slot picked
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(state && state.initialDate ? state.initialDate : todayStr);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(state && state.initialSlotIndex !== undefined ? String(state.initialSlotIndex) : "");

  // gate that controls whether the grid and stat cards show
  const isFilterReady = selectedDate !== "" && selectedSlotIndex !== "";

  // which seat popup is currently open, null means none
  const [popupSeatId, setPopupSeatId] = useState(null);

  // the seat the admin clicked on and is acting on
  const [activeSeat, setActiveSeat] = useState(null);

  // full reservation details fetched for the view and edit modals
  const [reservationDetails, setReservationDetails] = useState(null);

  // one flag per modal
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // form fields for reserve walk-in modal
  const [reserveName, setReserveName] = useState("");
  const [reserveEmail, setReserveEmail] = useState("");
  const [reserveDate, setReserveDate] = useState("");
  const [reserveStartTime, setReserveStartTime] = useState("");
  const [reserveEndTime, setReserveEndTime] = useState("");

  // form fields for block seat modal
  const [blockDate, setBlockDate] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");

  // form fields for edit reservation modal
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  // feedback message shown inside modals after an action
  const [modalMessage, setModalMessage] = useState("");

  // live clock shown in the subheader
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(function() {
    const timer = setInterval(function() {
      setCurrentDateTime(new Date());
    }, 1000);
    return function() { clearInterval(timer); };
  }, []);

  // formats the date and time for the live clock
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

  // fetch reservations on mount regardless of whether a slot is picked
  useEffect(function () {
    if (!selectedBuilding || !selectedLab) return;
    fetchReservations();
  }, []);

  // re-fetches seats whenever date or slot changes, clears grid if filter is incomplete
  useEffect(function () {
    if (!selectedBuilding || !selectedLab) return;
    if (isFilterReady) {
      fetchSeats(selectedSlotIndex);
    } else {
      setSeats([]);
    }
  }, [selectedDate, selectedSlotIndex]);

  // guard goes after all hooks, if no building or lab was passed just show an error page
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

  // the currently selected slot object, null if nothing is picked yet
  const activeSlot = selectedSlotIndex !== "" ? TIME_SLOTS[selectedSlotIndex] : null;

  // fetches seats using /available_seats for the selected date and slot
  // slotIndex is passed as a param so we never read stale state from a closure
  async function fetchSeats(slotIndex) {
    setLoadingSeats(true);
    const buildingId = selectedBuilding._id;
    const labId = selectedLab._id;
    const index = slotIndex !== undefined ? slotIndex : selectedSlotIndex;
    const slot = TIME_SLOTS[index];

    if (!slot || !selectedDate) {
      setSeats([]);
      setLoadingSeats(false);
      return;
    }

    try {
      const url = "http://localhost:3000/admin/" + buildingId +
        "/laboratory/" + labId +
        "/available_seats?date=" + selectedDate +
        "&start_time=" + slot.start +
        "&end_time=" + slot.end;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch seats: " + res.status);
      const data = await res.json();
      setSeats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSeats(false);
    }
  }

  async function fetchReservations() {
    setLoadingReservations(true);
    const buildingId = selectedBuilding._id;
    const labId = selectedLab._id;
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

  // re-fetches both after any action, passes slotIndex explicitly to avoid stale closure
  async function refreshSeatsAndReservations() {
    await fetchSeats(selectedSlotIndex);
    await fetchReservations();
  }

  // stat card counts use getSeatAvailabilityStatus to respect is_available from the API
  // checking seat.status directly misses the time-slot-specific availability
  const totalSeats = seats.length;

  let reservedSeats = 0;
  for (let i = 0; i < seats.length; i++) {
    if (getSeatAvailabilityStatus(seats[i]) === "Occupied") reservedSeats++;
  }

  let unreservedSeats = 0;
  for (let i = 0; i < seats.length; i++) {
    if (getSeatAvailabilityStatus(seats[i]) === "Available") unreservedSeats++;
  }

  let unavailableSeats = 0;
  for (let i = 0; i < seats.length; i++) {
    if (getSeatAvailabilityStatus(seats[i]) === "Closed") unavailableSeats++;
  }

  // builds a 2D seat grid that matches the user reservation page layout exactly
  // 16 seats: 2 rows, full aisle row, 2 rows
  // 24 seats: 2 rows, aisle, 2 rows, aisle, 2 rows
  // each row is seat seat null seat seat (null = middle column spacer)
  function buildSeatGrid() {
    if (seats.length === 0) return [];

    // sort by row letter then number so A1 A2 B1 B2 comes out in the right order
    const sorted = seats.slice().sort(function(a, b) {
      const aRow = a.seat_number.match(/[A-Za-z]+/);
      const aNum = a.seat_number.match(/\d+/);
      const bRow = b.seat_number.match(/[A-Za-z]+/);
      const bNum = b.seat_number.match(/\d+/);
      if (!aRow || !aNum || !bRow || !bNum) return a.seat_number.localeCompare(b.seat_number);
      if (aRow[0] === bRow[0]) return parseInt(aNum[0]) - parseInt(bNum[0]);
      return aRow[0].localeCompare(bRow[0]);
    });

    if (sorted.length === 16) {
      return [
        [sorted[0],  sorted[1],  null, sorted[2],  sorted[3]],
        [sorted[4],  sorted[5],  null, sorted[6],  sorted[7]],
        [null, null, null, null, null], // aisle row
        [sorted[8],  sorted[9],  null, sorted[10], sorted[11]],
        [sorted[12], sorted[13], null, sorted[14], sorted[15]]
      ];
    }

    if (sorted.length === 24) {
      return [
        [sorted[0],  sorted[1],  null, sorted[2],  sorted[3]],
        [sorted[4],  sorted[5],  null, sorted[6],  sorted[7]],
        [null, null, null, null, null], // aisle row
        [sorted[8],  sorted[9],  null, sorted[10], sorted[11]],
        [sorted[12], sorted[13], null, sorted[14], sorted[15]],
        [null, null, null, null, null], // aisle row
        [sorted[16], sorted[17], null, sorted[18], sorted[19]],
        [sorted[20], sorted[21], null, sorted[22], sorted[23]]
      ];
    }

    // fallback for any other seat count
    const grid = [];
    for (let i = 0; i < sorted.length; i += 4) {
      const chunk = sorted.slice(i, i + 4);
      grid.push([chunk[0] || null, chunk[1] || null, null, chunk[2] || null, chunk[3] || null]);
    }
    return grid;
  }

  // returns the occupant name for a seat but only if their reservation overlaps the active slot
  // without the time check, names from other time slots bleed into the wrong grid view
  function getOccupantName(seat) {
    if (!activeSlot) return "";
    for (let i = 0; i < reservations.length; i++) {
      const overlaps = reservations[i].reserve_startTime < activeSlot.end &&
                       reservations[i].reserve_endTime > activeSlot.start;
      if (!overlaps) continue;
      for (let j = 0; j < reservations[i].seat_id.length; j++) {
        if (reservations[i].seat_id[j]._id === seat._id) {
          return reservations[i].user_id.full_name;
        }
      }
    }
    return "";
  }

  // checks seat status for the selected time slot
  // Closed comes from seat.status in the DB, Available/Occupied come from is_available in the API response
  function getSeatAvailabilityStatus(seat) {
    if (seat.status === "Closed") return "Closed";
    if (seat.is_available === true) return "Available";
    if (seat.is_available === false) return "Occupied";
    return seat.status;
  }

  // clicking a seat opens its popup, clicking the same seat again closes it
  function handleSeatClick(seat) {
    if (popupSeatId === seat._id) {
      setPopupSeatId(null);
      return;
    }
    setActiveSeat(seat);
    setPopupSeatId(seat._id);
  }

  // clicking anywhere on the page closes any open popup
  function handlePageClick() {
    setPopupSeatId(null);
  }

  // fetches full reservation details for a seat, used by both view and edit modals
  async function fetchReservationDetails(seat) {
    try {
      const res = await fetch(
        "http://localhost:3000/admin/" + selectedBuilding._id +
        "/laboratory/" + selectedLab._id +
        "/view_details/" + seat._id
      );
      if (!res.ok) throw new Error("Failed to fetch reservation details: " + res.status);
      const data = await res.json();
      setReservationDetails(data);
      return true;
    } catch (err) {
      setModalMessage(err.message);
      return false;
    }
  }

  // pre-fills date and time from the selected slot when opening these modals
  function handleOpenReserveModal(seat) {
    setPopupSeatId(null);
    setActiveSeat(seat);
    setReserveName("");
    setReserveEmail("");
    setReserveDate(selectedDate);
    setReserveStartTime(activeSlot ? activeSlot.start : "");
    setReserveEndTime(activeSlot ? activeSlot.end : "");
    setModalMessage("");
    setShowReserveModal(true);
  }

  function handleOpenBlockModal(seat) {
    setPopupSeatId(null);
    setActiveSeat(seat);
    setBlockDate(selectedDate);
    setBlockStartTime(activeSlot ? activeSlot.start : "");
    setBlockEndTime(activeSlot ? activeSlot.end : "");
    setModalMessage("");
    setShowBlockModal(true);
  }

  // view and edit both need to fetch details first before opening
  async function handleOpenViewModal(seat) {
    setPopupSeatId(null);
    setActiveSeat(seat);
    setModalMessage("");
    setReservationDetails(null);
    const success = await fetchReservationDetails(seat);
    if (success) setShowViewModal(true);
  }

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

  function handleOpenRemoveModal(seat) {
    setPopupSeatId(null);
    setActiveSeat(seat);
    setModalMessage("");
    setShowRemoveModal(true);
  }

  // POST /reserve_seat
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
      if (!res.ok) throw new Error(data.error || "Failed to reserve seat");
      setModalMessage("Reservation successful!");
      await refreshSeatsAndReservations();
      setShowReserveModal(false);
    } catch (err) {
      setModalMessage(err.message);
    }
  }

  // POST /block_seat
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
      if (!res.ok) throw new Error(data.error || "Failed to block seat");
      setModalMessage("Seat blocked successfully!");
      await refreshSeatsAndReservations();
      setShowBlockModal(false);
    } catch (err) {
      setModalMessage(err.message);
    }
  }

  // POST /unblock_seat, instant action no confirmation modal needed
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

  // PUT /edit_reservation/:seat_id
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

  // DELETE /remove_reservation/:seat_id
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

  function handleLogout() {
    navigate("/login");
  }

  // 5 columns: seat seat spacer seat seat
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

      {/* building and room name with live clock below */}
      <div className="sub-header">
        <h2>{selectedBuilding.building_name} - {selectedLab.room_code}</h2>
        <div className="sub-header-datetime">{formatDateTime(currentDateTime)}</div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-container">
        <div className="panel">

          {/* stat cards show "-" until a date and slot are both selected */}
          <div className="stats-row">
            <div className="stat-card green">
              <div className="stat-number">{!isFilterReady ? "-" : loadingSeats ? "..." : totalSeats}</div>
              <div className="stat-label">NUMBER OF SEATS</div>
            </div>
            <div className="stat-card gray">
              <div className="stat-number">{!isFilterReady ? "-" : loadingSeats ? "..." : reservedSeats}</div>
              <div className="stat-label">RESERVED SEATS</div>
            </div>
            <div className="stat-card green">
              <div className="stat-number">{!isFilterReady ? "-" : loadingSeats ? "..." : unreservedSeats}</div>
              <div className="stat-label">UNRESERVED SEATS</div>
            </div>
            <div className="stat-card gray">
              <div className="stat-number">{!isFilterReady ? "-" : loadingSeats ? "..." : unavailableSeats}</div>
              <div className="stat-label">UNAVAILABLE SEATS</div>
            </div>
          </div>

          {/* date picker and time slot dropdown, changing either one auto re-fetches the grid */}
          <div className="time-slot-selector" onClick={function(e) { e.stopPropagation(); }}>
            <div className="edit-group">
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={function(e) { setSelectedDate(e.target.value); }}
              />
            </div>
            <div className="edit-group">
              <label>Time Slot</label>
              <select
                value={selectedSlotIndex}
                onChange={function(e) { setSelectedSlotIndex(e.target.value); }}
              >
                <option value="">-- Select a time slot --</option>
                {TIME_SLOTS.map(function(slot, index) {
                  return (
                    <option key={index} value={index}>
                      {slot.display}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="seat-grid-container">
            <h3>MANAGE ROOM SEATS</h3>

            {/* prompt shown until admin picks both date and time slot */}
            {!isFilterReady && (
              <p style={{ color: "#888", textAlign: "center", padding: "20px" }}>
                Please select a date and time slot to view seat availability.
              </p>
            )}

            {isFilterReady && loadingSeats && <p>Loading seats...</p>}

            {isFilterReady && !loadingSeats && (
              <div className="seat-front-label">FRONT</div>
            )}

            {isFilterReady && !loadingSeats && (
              <div
                className="seat-grid"
                id="seatGrid"
                style={gridStyle}
                onClick={function (e) { e.stopPropagation(); }}
              >
                {buildSeatGrid().map(function (row, rowIndex) {

                  // all-null row means its a horizontal aisle between seat groups
                  const isAisleRow = row.every(function(cell) { return cell === null; });
                  if (isAisleRow) {
                    return (
                      <div key={"aisle-" + rowIndex} style={{ gridColumn: "1 / -1", height: "16px" }} />
                    );
                  }

                  return (
                    <React.Fragment key={"row-" + rowIndex}>
                      {row.map(function (seat, colIndex) {

                        // null in the middle of a row = vertical aisle spacer
                        if (seat === null) {
                          return <div className="seat space" key={"spacer-" + rowIndex + "-" + colIndex} />;
                        }

                        const availStatus = getSeatAvailabilityStatus(seat);
                        let seatClass = "seat available";
                        if (availStatus === "Occupied") seatClass = "seat taken";
                        else if (availStatus === "Closed") seatClass = "seat closed";

                        const occupantName = getOccupantName(seat);

                        return (
                          <div key={seat._id} style={{ position: "relative" }}>

                            <button
                              type="button"
                              className={seatClass}
                              onClick={function (e) {
                                e.stopPropagation();
                                handleSeatClick(seat);
                              }}
                            >
                              <div>{seat.seat_number}</div>
                              {occupantName !== "" && (
                                <span className="seat-name">{occupantName}</span>
                              )}
                            </button>

                            {/* popup that appears beside the seat when clicked */}
                            {popupSeatId === seat._id && (
                              <div
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
                                {availStatus === "Available" && (
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

                                {availStatus === "Occupied" && (
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
                                      Cancel Reservation
                                    </button>
                                  </div>
                                )}

                                {availStatus === "Closed" && (
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
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            <div className="legend">
              <span><span className="box available"></span>Available</span>
              <span><span className="box taken"></span>Reserved</span>
              <span><span className="box closed"></span>Closed</span>
            </div>
          </div>

          {/* reservations table, filtered to only show rows matching the selected date and slot */}
          <div className="reserved-table-container">
            <h3>
              {isFilterReady
                ? "Reservations for " + selectedLab.room_code + " on " + selectedDate + " (" + (activeSlot ? activeSlot.display : "") + ")"
                : "Reservations for " + selectedLab.room_code
              }
            </h3>
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
                  {reservations.filter(function(reservation) {
                    if (!isFilterReady || !activeSlot) return true;
                    const sameDate = new Date(reservation.date_reserved).toISOString().split("T")[0] === selectedDate;
                    const overlaps = reservation.reserve_startTime < activeSlot.end &&
                                     reservation.reserve_endTime > activeSlot.start;
                    return sameDate && overlaps;
                  }).map(function (reservation) {
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

      {/* modal: reserve walk-in student */}
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

      {/* modal: block seat for a specific date and time window */}
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

      {/* modal: view reservation details, all fields are read only */}
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

      {/* modal: edit reservation, name and email are disabled since we only allow date/time changes */}
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

      {/* modal: confirm before cancelling a reservation */}
      {showRemoveModal && (
        <div className="remove-reservation" style={{ display: "flex" }}>
          <div className="modal-card-remove-reservation">
            <h3>
              Are you sure you want to cancel the reservation for Seat {activeSeat ? activeSeat.seat_number : ""}?
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