import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../../style/admin_css/AdminManageSeatReservations.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';

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
// This page shows live seat status and check-in timers.
// 30 seconds keeps the seat grid and reservation table up to date
// without missing a check-in or cancellation for too long.
const POLL_INTERVAL_MS = 30 * 1000;

// ─── CHECK-IN COUNTDOWN COMPONENT ────────────────────────────────────────────
function CheckInCountdown({ reservation, selectedDate, activeSlot, onWindowStart }) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!reservation || !activeSlot || !selectedDate || reservation.status === 'Checked') return;

    const today = new Date().toISOString().split('T')[0];
    const resDate = new Date(reservation.date_reserved).toISOString().split('T')[0];
    if (resDate !== today) return;

    const [sh, sm, ss] = reservation.reserve_startTime.split(':').map(Number);
    const slotStart = new Date();
    slotStart.setHours(sh, sm, ss || 0, 0);

    const deadline = reservation.check_in_deadline
      ? new Date(reservation.check_in_deadline)
      : new Date(slotStart.getTime() + 10 * 60 * 1000);

    function tick() {
      const now = new Date();
      if (now < slotStart) { setSecondsLeft(null); return; }
      const remaining = Math.floor((deadline - now) / 1000);
      if (remaining > 0) {
        setSecondsLeft(remaining);
        if (!calledRef.current && !reservation.check_in_deadline) {
          calledRef.current = true;
          onWindowStart && onWindowStart(reservation._id, deadline.toISOString());
        }
      } else {
        setSecondsLeft(0);
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [reservation, activeSlot, selectedDate, reservation?.status]);

  if (secondsLeft === null || reservation?.status === 'Checked') return null;

  if (secondsLeft === 0) {
    return (
      <span style={{
        display: 'inline-block', marginLeft: 8, fontSize: 11,
        color: '#888', fontWeight: 600, background: '#f0f0f0',
        borderRadius: 4, padding: '1px 6px'
      }}>Cancellation period has ended</span>
    );
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = (secondsLeft % 60).toString().padStart(2, '0');
  const urgent = secondsLeft <= 60;

  return (
    <span style={{
      display: 'inline-block', marginLeft: 8, fontSize: 11, fontWeight: 700,
      color: '#fff', background: urgent ? '#c0392b' : '#e67e22',
      borderRadius: 4, padding: '2px 7px',
      animation: urgent ? 'pulse 1s infinite' : 'none'
    }}>
      ⏱ {mins}:{secs}
    </span>
  );
}

// ─── CANCELLATION GUARD ───────────────────────────────────────────────────────
function isCancellationAllowed(reservation) {
  if (!reservation) return false;
  if (reservation.status === 'Checked') return false;
  if (!reservation.check_in_deadline) return true;
  return new Date() <= new Date(reservation.check_in_deadline);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
function AdminManageSeatReservations() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state;
  const selectedBuilding = state && state.selectedBuilding;
  const selectedLab = state && state.selectedLab;

  const [seats, setSeats] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [error, setError] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(state && state.initialDate ? state.initialDate : todayStr);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(
    state && state.initialSlotIndex !== undefined ? String(state.initialSlotIndex) : ''
  );

  const isFilterReady = selectedDate !== '' && selectedSlotIndex !== '';

  const [popupSeatId, setPopupSeatId] = useState(null);
  const [activeSeat, setActiveSeat] = useState(null);
  const [reservationDetails, setReservationDetails] = useState(null);

  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const [reserveName, setReserveName] = useState('');
  const [reserveEmail, setReserveEmail] = useState('');
  const [reserveDate, setReserveDate] = useState('');
  const [reserveStartTime, setReserveStartTime] = useState('');
  const [reserveEndTime, setReserveEndTime] = useState('');

  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');

  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  const [modalMessage, setModalMessage] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Ref to always have the latest selectedSlotIndex and selectedDate
  // inside the polling interval without re-creating it every time they change
  const selectedSlotIndexRef = useRef(selectedSlotIndex);
  const selectedDateRef = useRef(selectedDate);
  useEffect(function () { selectedSlotIndexRef.current = selectedSlotIndex; }, [selectedSlotIndex]);
  useEffect(function () { selectedDateRef.current = selectedDate; }, [selectedDate]);

  // ─── CLOCK ─────────────────────────────────────────────────────────────────
  useEffect(function () {
    const timer = setInterval(function () { setCurrentDateTime(new Date()); }, 1000);
    return function () { clearInterval(timer); };
  }, []);

  function formatDateTime(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return dayName + ', ' + month + ' ' + day + ', ' + year + ' ' + hours + ':' + minutes + ':' + seconds + ' ' + ampm;
  }

  // ─── FETCH FUNCTIONS ────────────────────────────────────────────────────────
  // isInitialLoad = true → shows spinners; false → silent background refresh

  async function fetchSeats(slotIndex, date, isInitialLoad = false) {
    if (isInitialLoad) setLoadingSeats(true);
    const buildingId = selectedBuilding._id;
    const labId = selectedLab._id;
    const slot = TIME_SLOTS[slotIndex];
    if (!slot || !date) { setSeats([]); if (isInitialLoad) setLoadingSeats(false); return; }
    try {
      const url = 'http://localhost:3000/admin/' + buildingId +
        '/laboratory/' + labId +
        '/available_seats?date=' + date +
        '&start_time=' + slot.start + '&end_time=' + slot.end;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch seats: ' + res.status);
      setSeats(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      if (isInitialLoad) setLoadingSeats(false);
    }
  }

  async function fetchReservations(isInitialLoad = false) {
    if (isInitialLoad) setLoadingReservations(true);
    const buildingId = selectedBuilding._id;
    const labId = selectedLab._id;
    try {
      const res = await fetch('http://localhost:3000/admin/' + buildingId + '/laboratory/' + labId + '/reservations');
      if (!res.ok) throw new Error('Failed to fetch reservations: ' + res.status);
      setReservations(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      if (isInitialLoad) setLoadingReservations(false);
    }
  }

  // Refreshes both seats and reservations — used after any action (reserve, cancel, etc.)
  async function refreshSeatsAndReservations() {
    await fetchSeats(selectedSlotIndexRef.current, selectedDateRef.current, false);
    await fetchReservations(false);
  }

  // ─── INITIAL LOAD ───────────────────────────────────────────────────────────
  // Reservations: load immediately on mount
  useEffect(function () {
    if (!selectedBuilding || !selectedLab) return;
    fetchReservations(true);
  }, []);

  // Seats: load (or clear) whenever date or slot changes
  useEffect(function () {
    if (!selectedBuilding || !selectedLab) return;

    // If today is selected, clear slots whose end time has already passed
    if (selectedDate === todayStr && selectedSlotIndex !== '') {
      const now = new Date();
      const ct = now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0') + ':00';
      const slot = TIME_SLOTS[selectedSlotIndex];
      if (slot && slot.end <= ct) {
        setSelectedSlotIndex('');
        setSeats([]);
        return;
      }
    }

    if (isFilterReady) {
      fetchSeats(selectedSlotIndex, selectedDate, true);
    } else {
      setSeats([]);
    }
  }, [selectedDate, selectedSlotIndex]);

  // ─── POLLING SETUP ──────────────────────────────────────────────────────────
  // Polls every 30 seconds once the building/lab are known.
  // Uses refs so the interval always reads the latest date/slot without
  // needing to be re-created every time the user changes the filter.
  useEffect(function () {
    if (!selectedBuilding || !selectedLab) return;

    const intervalId = setInterval(async function () {
      const currentSlotIndex = selectedSlotIndexRef.current;
      const currentDate = selectedDateRef.current;

      // Only re-fetch seats if a filter is actually selected
      if (currentSlotIndex !== '' && currentDate !== '') {
        await fetchSeats(currentSlotIndex, currentDate, false);
      }
      await fetchReservations(false);
    }, POLL_INTERVAL_MS);

    return function () { clearInterval(intervalId); };
  }, []); // empty deps — interval is created once, refs handle the dynamic values

  // ─── GUARD — must come after all hooks ─────────────────────────────────────
  if (!state || !selectedBuilding || !selectedLab) {
    return (
      <div className="admin-manage-reservations">
        <header>
          <div className="logo"><a href="/admin"><img src={taftlabLogo} alt="TaftLab Logo" /></a></div>
          <div className="header-right">
            <nav><ul>
              <li><a href="/admin">Home</a></li>
              <li><a href="/admin/profile">Profile</a></li>
              <li><a href="#" onClick={function () { navigate('/login'); }}>Logout</a></li>
            </ul></nav>
            <div className="profile-icon"><img src={profileIcon} alt="Profile Icon" /></div>
          </div>
        </header>
        <div className="sub-header"><h2>Error: No building or laboratory selected</h2></div>
        <div style={{ padding: 32, color: 'red', fontWeight: 600 }}>
          Unable to load seat management. Please return to the Admin Building Dashboard and select a laboratory.
        </div>
      </div>
    );
  }

  const activeSlot = selectedSlotIndex !== '' ? TIME_SLOTS[selectedSlotIndex] : null;

  // ─── SEAT GRID HELPERS ──────────────────────────────────────────────────────
  const totalSeats = seats.length;
  let reservedSeats = 0, unreservedSeats = 0, unavailableSeats = 0;
  for (let i = 0; i < seats.length; i++) {
    const s = getSeatAvailabilityStatus(seats[i]);
    if (s === 'Occupied') reservedSeats++;
    else if (s === 'Available') unreservedSeats++;
    else if (s === 'Closed') unavailableSeats++;
  }

  function buildSeatGrid() {
    if (seats.length === 0) return [];
    const sorted = seats.slice().sort(function (a, b) {
      const aRow = a.seat_number.match(/[A-Za-z]+/);
      const aNum = a.seat_number.match(/\d+/);
      const bRow = b.seat_number.match(/[A-Za-z]+/);
      const bNum = b.seat_number.match(/\d+/);
      if (!aRow || !aNum || !bRow || !bNum) return a.seat_number.localeCompare(b.seat_number);
      if (aRow[0] === bRow[0]) return parseInt(aNum[0]) - parseInt(bNum[0]);
      return aRow[0].localeCompare(bRow[0]);
    });
    if (sorted.length === 16) return [
      [sorted[0],sorted[1],null,sorted[2],sorted[3]],[sorted[4],sorted[5],null,sorted[6],sorted[7]],
      [null,null,null,null,null],
      [sorted[8],sorted[9],null,sorted[10],sorted[11]],[sorted[12],sorted[13],null,sorted[14],sorted[15]]
    ];
    if (sorted.length === 24) return [
      [sorted[0],sorted[1],null,sorted[2],sorted[3]],[sorted[4],sorted[5],null,sorted[6],sorted[7]],
      [null,null,null,null,null],
      [sorted[8],sorted[9],null,sorted[10],sorted[11]],[sorted[12],sorted[13],null,sorted[14],sorted[15]],
      [null,null,null,null,null],
      [sorted[16],sorted[17],null,sorted[18],sorted[19]],[sorted[20],sorted[21],null,sorted[22],sorted[23]]
    ];
    const grid = [];
    for (let i = 0; i < sorted.length; i += 4) {
      const chunk = sorted.slice(i, i + 4);
      grid.push([chunk[0]||null,chunk[1]||null,null,chunk[2]||null,chunk[3]||null]);
    }
    return grid;
  }

  function getSeatAvailabilityStatus(seat) {
    if (seat.status === 'Closed') return 'Closed';
    if (seat.is_available === true) return 'Available';
    if (seat.is_available === false) return 'Occupied';
    return seat.status;
  }

  function getOccupantName(seat) {
    if (!activeSlot) return '';
    for (let i = 0; i < reservations.length; i++) {
      if (reservations[i].reserve_startTime >= activeSlot.end || reservations[i].reserve_endTime <= activeSlot.start) continue;
      for (let j = 0; j < reservations[i].seat_id.length; j++) {
        if (reservations[i].seat_id[j]._id.toString() === seat._id.toString())
          return reservations[i].user_id.full_name;
      }
    }
    return '';
  }

  function getReservationForSeat(seat) {
    if (!activeSlot) return null;
    for (let i = 0; i < reservations.length; i++) {
      if (reservations[i].reserve_startTime >= activeSlot.end || reservations[i].reserve_endTime <= activeSlot.start) continue;
      for (let j = 0; j < reservations[i].seat_id.length; j++) {
        if (reservations[i].seat_id[j]._id.toString() === seat._id.toString())
          return reservations[i];
      }
    }
    return null;
  }

  function handleSeatClick(seat) {
    if (popupSeatId === seat._id) { setPopupSeatId(null); return; }
    setActiveSeat(seat); setPopupSeatId(seat._id);
  }

  function handlePageClick() { setPopupSeatId(null); }

  // ─── MODAL HANDLERS ─────────────────────────────────────────────────────────
  async function fetchReservationDetails(seat) {
    try {
      const res = await fetch('http://localhost:3000/admin/' + selectedBuilding._id +
        '/laboratory/' + selectedLab._id + '/view_details/' + seat._id);
      if (!res.ok) throw new Error('Failed to fetch reservation details: ' + res.status);
      setReservationDetails(await res.json());
      return true;
    } catch (err) { setModalMessage(err.message); return false; }
  }

  function handleOpenReserveModal(seat) {
    setPopupSeatId(null); setActiveSeat(seat); setReserveName(''); setReserveEmail('');
    setReserveDate(selectedDate); setReserveStartTime(activeSlot ? activeSlot.start : '');
    setReserveEndTime(activeSlot ? activeSlot.end : ''); setModalMessage(''); setShowReserveModal(true);
  }

  function handleOpenBlockModal(seat) {
    setPopupSeatId(null); setActiveSeat(seat); setBlockDate(selectedDate);
    setBlockStartTime(activeSlot ? activeSlot.start : ''); setBlockEndTime(activeSlot ? activeSlot.end : '');
    setModalMessage(''); setShowBlockModal(true);
  }

  async function handleOpenViewModal(seat) {
    setPopupSeatId(null); setActiveSeat(seat); setModalMessage(''); setReservationDetails(null);
    if (await fetchReservationDetails(seat)) setShowViewModal(true);
  }

  async function handleOpenEditModal(seat) {
    setPopupSeatId(null); setActiveSeat(seat); setEditDate(''); setEditStartTime(''); setEditEndTime('');
    setModalMessage(''); setReservationDetails(null);
    if (await fetchReservationDetails(seat)) setShowEditModal(true);
  }

  function handleOpenRemoveModal(seat) {
    setPopupSeatId(null); setActiveSeat(seat); setModalMessage(''); setShowRemoveModal(true);
  }

  async function handleConfirmReserve() {
    setModalMessage('');
    try {
      const res = await fetch('http://localhost:3000/admin/' + selectedBuilding._id +
        '/laboratory/' + selectedLab._id + '/reserve_seat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_numbers: [activeSeat.seat_number], name: reserveName,
          email: reserveEmail, date_reserved: reserveDate,
          reserve_startTime: reserveStartTime, reserve_endTime: reserveEndTime })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reserve seat');
      setModalMessage('Reservation successful!');
      await refreshSeatsAndReservations(); setShowReserveModal(false);
    } catch (err) { setModalMessage(err.message); }
  }

  async function handleConfirmBlock() {
    setModalMessage('');
    try {
      const res = await fetch('http://localhost:3000/admin/' + selectedBuilding._id +
        '/laboratory/' + selectedLab._id + '/block_seat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_number: activeSeat.seat_number, restricted_date: blockDate,
          start_time: blockStartTime, end_time: blockEndTime })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to block seat');
      setModalMessage('Seat blocked successfully!');
      await refreshSeatsAndReservations(); setShowBlockModal(false);
    } catch (err) { setModalMessage(err.message); }
  }

  async function handleConfirmUnblock(seat) {
    try {
      const res = await fetch('http://localhost:3000/admin/' + selectedBuilding._id +
        '/laboratory/' + selectedLab._id + '/unblock_seat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_number: seat.seat_number })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unblock seat');
      await refreshSeatsAndReservations(); setPopupSeatId(null);
    } catch (err) { setError(err.message); }
  }

  async function handleConfirmEdit() {
    setModalMessage('');
    try {
      const res = await fetch('http://localhost:3000/admin/' + selectedBuilding._id +
        '/laboratory/' + selectedLab._id + '/edit_reservation/' + activeSeat._id, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date_reserved: editDate, start_time: editStartTime, end_time: editEndTime })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to edit reservation');
      setModalMessage('Reservation updated successfully!');
      await refreshSeatsAndReservations(); setShowEditModal(false);
    } catch (err) { setModalMessage(err.message); }
  }

  async function handleConfirmRemove() {
    setModalMessage('');
    try {
      const res = await fetch('http://localhost:3000/admin/' + selectedBuilding._id +
        '/laboratory/' + selectedLab._id + '/remove_reservation/' + activeSeat._id,
        { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove reservation');
      setModalMessage('Reservation removed successfully!');
      await refreshSeatsAndReservations(); setShowRemoveModal(false);
    } catch (err) { setModalMessage(err.message); }
  }

  async function handleWindowStart(reservationId, deadlineISO) {
    try {
      await fetch('http://localhost:3000/admin/reservation/' + reservationId + '/start-checkin-window', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline: deadlineISO })
      });
      await fetchReservations(false);
    } catch (err) { console.error('Failed to persist check-in deadline:', err); }
  }

  // ─── TIMER DISPLAY HELPER ───────────────────────────────────────────────────
  function getTimerDisplay(reservation) {
    if (!reservation || reservation.status === 'Checked') return null;

    const today = new Date().toISOString().split('T')[0];
    const resDate = new Date(reservation.date_reserved).toISOString().split('T')[0];
    if (resDate !== today) return null;

    const [sh, sm, ss] = reservation.reserve_startTime.split(':').map(Number);
    const slotStart = new Date();
    slotStart.setHours(sh, sm, ss || 0, 0);

    const now = new Date();
    if (now < slotStart) return null;

    const deadline = reservation.check_in_deadline
      ? new Date(reservation.check_in_deadline)
      : new Date(slotStart.getTime() + 10 * 60 * 1000);

    const remaining = Math.floor((deadline - now) / 1000);
    if (remaining <= 0) return { type: 'expired', display: 'Time elapsed' };

    const mins = Math.floor(remaining / 60);
    const secs = (remaining % 60).toString().padStart(2, '0');
    return { type: 'active', display: `${mins}:${secs}`, urgent: remaining <= 60 };
  }

  function handleLogout() { navigate('/login'); }

  const nowForSlots = new Date();
  const currentTimeStr = nowForSlots.getHours().toString().padStart(2, '0') + ':' +
    nowForSlots.getMinutes().toString().padStart(2, '0') + ':00';
  const allSlotsPastToday = selectedDate === todayStr &&
    TIME_SLOTS.every(function (slot) { return slot.end <= currentTimeStr; });
  const gridStyle = { gridTemplateColumns: 'repeat(5, minmax(70px, 1fr))' };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="admin-manage-reservations" onClick={handlePageClick}>
      <style>{`@keyframes pulse{0%{opacity:1;transform:scale(1)}50%{opacity:.75;transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}`}</style>

      <header onClick={function (e) { e.stopPropagation(); }}>
        <div className="logo"><a href="/admin"><img src={taftlabLogo} alt="TaftLab Logo" /></a></div>
        <div className="header-right">
          <nav><ul>
            <li><a href="/admin">Home</a></li>
            <li><a href="/admin/profile">Profile</a></li>
            <li><a href="#" onClick={handleLogout}>Logout</a></li>
          </ul></nav>
          <div className="profile-icon"><img src={profileIcon} alt="Profile Icon" /></div>
        </div>
      </header>

      <div className="sub-header">
        <h2>{selectedBuilding.building_name} - {selectedLab.room_code}</h2>
        <div className="sub-header-datetime">{formatDateTime(currentDateTime)}</div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-container"><div className="panel">

        {/* Stat cards */}
        <div className="stats-row">
          <div className="stat-card green"><div className="stat-number">{!isFilterReady?'-':loadingSeats?'...':totalSeats}</div><div className="stat-label">NUMBER OF SEATS</div></div>
          <div className="stat-card gray"><div className="stat-number">{!isFilterReady?'-':loadingSeats?'...':reservedSeats}</div><div className="stat-label">RESERVED SEATS</div></div>
          <div className="stat-card green"><div className="stat-number">{!isFilterReady?'-':loadingSeats?'...':unreservedSeats}</div><div className="stat-label">UNRESERVED SEATS</div></div>
          <div className="stat-card gray"><div className="stat-number">{!isFilterReady?'-':loadingSeats?'...':unavailableSeats}</div><div className="stat-label">UNAVAILABLE SEATS</div></div>
        </div>

        {/* Date + slot filter */}
        <div className="time-slot-selector" onClick={function (e) { e.stopPropagation(); }}>
          <div className="edit-group">
            <label>Date</label>
            <input type="date" value={selectedDate} min={todayStr} onChange={function (e) { setSelectedDate(e.target.value); }} />
          </div>
          <div className="edit-group">
            <label>Time Slot</label>
            <select value={selectedSlotIndex} onChange={function (e) { setSelectedSlotIndex(e.target.value); }}>
              <option value="">-- Select a time slot --</option>
              {TIME_SLOTS.map(function (slot, index) {
                if (selectedDate === todayStr && slot.end <= currentTimeStr) return null;
                return <option key={index} value={index}>{slot.display}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Seat grid */}
        <div className="seat-grid-container">
          <h3>MANAGE ROOM SEATS</h3>
          {allSlotsPastToday && <p style={{color:'#c14b4b',textAlign:'center',padding:'20px',fontWeight:600}}>No more time slots available for today. Please select a future date.</p>}
          {!isFilterReady && !allSlotsPastToday && <p style={{color:'#888',textAlign:'center',padding:'20px'}}>Please select a date and time slot to view seat availability.</p>}
          {isFilterReady && loadingSeats && <p>Loading seats...</p>}
          {isFilterReady && !loadingSeats && <div className="seat-front-label">FRONT</div>}

          {isFilterReady && !loadingSeats && (
            <div className="seat-grid" id="seatGrid" style={gridStyle} onClick={function (e) { e.stopPropagation(); }}>
              {buildSeatGrid().map(function (row, rowIndex) {
                if (row.every(function (c) { return c === null; }))
                  return <div key={'aisle-'+rowIndex} style={{gridColumn:'1 / -1',height:'16px'}} />;
                return (
                  <React.Fragment key={'row-'+rowIndex}>
                    {row.map(function (seat, colIndex) {
                      if (seat === null) return <div className="seat space" key={'s-'+rowIndex+'-'+colIndex} />;
                      const availStatus = getSeatAvailabilityStatus(seat);
                      let seatClass = availStatus==='Occupied'?'seat taken':availStatus==='Closed'?'seat closed':'seat available';
                      const occupantName = getOccupantName(seat);
                      const seatRes = availStatus==='Occupied'?getReservationForSeat(seat):null;
                      const isCheckedIn = seatRes && seatRes.status==='Checked';
                      return (
                        <div key={seat._id} style={{position:'relative'}}>
                          <button type="button" className={seatClass}
                            onClick={function (e) { e.stopPropagation(); handleSeatClick(seat); }}>
                            <div>{seat.seat_number}</div>
                            {occupantName !== '' && <span className="seat-name">{occupantName}</span>}
                            {isCheckedIn && <span style={{display:'block',fontSize:10,fontWeight:700,color:'#fff',background:'#2e7d32',borderRadius:3,padding:'1px 4px',marginTop:2}}>✓ Checked In</span>}
                            {seatRes && <CheckInCountdown reservation={seatRes} selectedDate={selectedDate} activeSlot={activeSlot} onWindowStart={handleWindowStart} />}
                          </button>

                          {popupSeatId===seat._id && (
                            <div style={{position:'absolute',background:'#e7f3ec',border:'3px solid #ddd',borderRadius:'6px',fontSize:'14px',zIndex:'1000',padding:'5px',textAlign:'center',top:'0px',left:'105%',minWidth:'160px'}}
                              onClick={function (e) { e.stopPropagation(); }}>

                              {availStatus==='Available' && (
                                <div>
                                  <h3 style={{color:'green'}}>AVAILABLE</h3>
                                  <button className="available_seat_manage_option_btn" onClick={function(){handleOpenReserveModal(seat);}}>Reserve Student</button>
                                  <button className="available_seat_manage_option_btn available_seat_manage_option_block_btn" onClick={function(){handleOpenBlockModal(seat);}}>Block Reservations</button>
                                </div>
                              )}

                              {availStatus==='Occupied' && (function(){
                                const sr = getReservationForSeat(seat);
                                const canCancel = isCancellationAllowed(sr);
                                const ci = sr && sr.status==='Checked';
                                return (
                                  <div>
                                    <h3 style={{color:ci?'#2e7d32':'#dd5c36'}}>{ci?'✓ CHECKED IN':'RESERVED'}</h3>
                                    {sr && sr.status !== 'Checked' && (
                                      <div style={{marginBottom:6}}>
                                        <CheckInCountdown reservation={sr} selectedDate={selectedDate} activeSlot={activeSlot} onWindowStart={handleWindowStart} />
                                      </div>
                                    )}
                                    <button className="unavailable_seat_manage_option_btn" onClick={function(){handleOpenViewModal(seat);}}>View Details</button>
                                    <button className="unavailable_seat_manage_option_btn" onClick={function(){handleOpenEditModal(seat);}}>Edit Reservation</button>
                                    <div style={{position:'relative'}}>
                                      <button
                                        className="unavailable_seat_manage_option_btn unavailable_seat_manage_option_delete_btn"
                                        disabled={!canCancel}
                                        title={sr?.status === 'Checked' ? 'Cannot cancel a checked-in reservation' : !canCancel ? 'Cancellation window has expired' : 'Cancel this reservation'}
                                        style={{ opacity: canCancel ? 1 : 0.45, cursor: canCancel ? 'pointer' : 'not-allowed', width: '100%' }}
                                        onClick={function(){if(canCancel) handleOpenRemoveModal(seat);}}>
                                        Cancel Reservation
                                      </button>
                                      {!canCancel && (
                                        <div style={{fontSize:16,color:'#888',marginTop:2,lineHeight:1.3}}>
                                          {sr?.status === 'Checked' ? 'Already checked in' : 'Check-in window expired'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                              {availStatus==='Closed' && (
                                <div>
                                  <h3 style={{color:'#888'}}>CLOSED</h3>
                                  <p style={{fontSize:'12px',color:'#555',marginBottom:'6px'}}>This seat is blocked.</p>
                                  <button className="available_seat_manage_option_btn available_seat_manage_option_block_btn" onClick={function(){handleConfirmUnblock(seat);}}>Unblock Seat</button>
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
            <span><span className="box taken"></span>Reserved / Checked In</span>
            <span><span className="box closed"></span>Closed</span>
          </div>
        </div>

        {/* Reservations table */}
        <div className="reserved-table-container">
          <h3>
            {isFilterReady ? (() => {
              const fd = new Date(selectedDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
              return 'Reservations for '+selectedLab.room_code+' on '+fd+' ('+(activeSlot?activeSlot.display:'')+')';
            })() : 'Reservations for '+selectedLab.room_code}
          </h3>
          {loadingReservations && <p>Loading reservations...</p>}
          {!loadingReservations && (
            <table className="reserved-table">
              <thead>
                <tr><th>Reserved Seats</th><th>Time Slot</th><th>Reserved Person</th><th>Status</th><th>Reservation Cancellation Timer</th></tr>
              </thead>
              <tbody>
                {reservations.filter(function(r){
                  if (!isFilterReady||!activeSlot) return true;
                  const sd = new Date(r.date_reserved).toISOString().split('T')[0]===selectedDate;
                  const ol = r.reserve_startTime<activeSlot.end && r.reserve_endTime>activeSlot.start;
                  return sd && ol;
                }).map(function(reservation){
                  const sn = reservation.seat_id.map(function(s){return s.seat_number;}).join(', ');
                  const ic = reservation.status==='Checked';
                  const timerDisplay = getTimerDisplay(reservation);
                  return (
                    <tr key={reservation._id}>
                      <td>{sn}</td>
                      <td>{reservation.reserve_startTime} - {reservation.reserve_endTime}</td>
                      <td>{reservation.user_id.full_name}</td>
                      <td><span style={{fontWeight:600,color:ic?'#2e7d32':'#e67e22'}}>{ic?'✓ Checked In':'Ongoing'}</span></td>
                      <td>
                        {timerDisplay ? (
                          timerDisplay.type === 'expired' ? (
                            <span style={{display:'inline-block',fontSize:16,color:'#888',borderRadius:4,padding:'2px 7px'}}>Time elapsed</span>
                          ) : (
                            <span style={{display:'inline-block',fontSize:11,fontWeight:700,color:'#fff',background:timerDisplay.urgent?'#c0392b':'#e67e22',borderRadius:4,padding:'2px 7px',animation:timerDisplay.urgent?'pulse 1s infinite':'none'}}>
                              ⏱ {timerDisplay.display}
                            </span>
                          )
                        ) : (
                          <span style={{fontSize:16,color:'#888'}}>
                            {reservation.status === 'Checked' ? 'Already checked in' : 'Timer not started'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div></div>

      {/* Reserve modal */}
      {showReserveModal && (
        <div className="reserve-student" style={{display:'flex'}}>
          <div className="modal-card-reserve-student">
            <h3>Reserve Walk-In Student</h3>
            <div className="reserve-content">
              <div className="edit-group"><label>Seat Number</label><input type="text" value={activeSeat?activeSeat.seat_number:''} disabled /></div>
              <div className="edit-group"><label>Name</label><input type="text" value={reserveName} onChange={function(e){setReserveName(e.target.value);}} /></div>
              <div className="edit-group"><label>Email</label><input type="email" value={reserveEmail} onChange={function(e){setReserveEmail(e.target.value);}} /></div>
              <div className="edit-group"><label>Date</label><input type="date" value={reserveDate} onChange={function(e){setReserveDate(e.target.value);}} /></div>
              <div className="edit-group"><label>Start Time</label><input type="time" value={reserveStartTime} onChange={function(e){setReserveStartTime(e.target.value);}} /></div>
              <div className="edit-group"><label>End Time</label><input type="time" value={reserveEndTime} onChange={function(e){setReserveEndTime(e.target.value);}} /></div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleConfirmReserve}>Reserve</button>
              <button className="modal-btn cancel" onClick={function(){setShowReserveModal(false);}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Block modal */}
      {showBlockModal && (
        <div className="block-reservations" style={{display:'flex'}}>
          <div className="modal-card-block-reservations">
            <h3>Block Seat</h3>
            <div className="block-content">
              <div className="edit-group"><label>Seat Number</label><input type="text" value={activeSeat?activeSeat.seat_number:''} disabled /></div>
              <div className="edit-group"><label>Date</label><input type="date" value={blockDate} onChange={function(e){setBlockDate(e.target.value);}} /></div>
              <div className="edit-group"><label>Start Time</label><input type="time" value={blockStartTime} onChange={function(e){setBlockStartTime(e.target.value);}} /></div>
              <div className="edit-group"><label>End Time</label><input type="time" value={blockEndTime} onChange={function(e){setBlockEndTime(e.target.value);}} /></div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleConfirmBlock}>Block</button>
              <button className="modal-btn cancel" onClick={function(){setShowBlockModal(false);}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {showViewModal && reservationDetails && (
        <div className="view-details" style={{display:'flex'}}>
          <div className="modal-card-view-details">
            <h3>Reservation Details</h3>
            <div className="view-details-content">
              <div className="view-details-item"><span className="label">Name</span><span className="value">{reservationDetails.full_name}</span></div>
              <div className="view-details-item"><span className="label">Email</span><span className="value">{reservationDetails.email}</span></div>
              <div className="view-details-item"><span className="label">Seat Number</span><span className="value">{reservationDetails.seat_numbers.join(', ')}</span></div>
              <div className="view-details-item"><span className="label">Status</span><span className="value" style={{color:reservationDetails.reservation_status==='Checked'?'#2e7d32':'#e67e22',fontWeight:600}}>{reservationDetails.reservation_status==='Checked'?'✓ Checked In':'Ongoing'}</span></div>
              <div className="view-details-item"><span className="label">Date Reserved</span><span className="value">{new Date(reservationDetails.date_reserved).toLocaleDateString()}</span></div>
              <div className="view-details-item"><span className="label">Start Time</span><span className="value">{reservationDetails.start_time}</span></div>
              <div className="view-details-item"><span className="label">End Time</span><span className="value">{reservationDetails.end_time}</span></div>
              <div className="view-details-item"><span className="label">Laboratory</span><span className="value">{reservationDetails.room_code}</span></div>
              <div className="view-details-item"><span className="label">Building</span><span className="value">{reservationDetails.building}</span></div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions"><button className="modal-btn cancel" onClick={function(){setShowViewModal(false);}}>Close</button></div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && reservationDetails && (
        <div className="edit-reservation" style={{display:'flex'}}>
          <div className="modal-card-edit-reservation">
            <h3>Edit Reservation</h3>
            <div className="edit-content">
              <div className="edit-group"><label>Name</label><input type="text" value={reservationDetails.full_name} disabled /></div>
              <div className="edit-group"><label>Email</label><input type="email" value={reservationDetails.email} disabled /></div>
              <div className="edit-group"><label>Date Reserved</label><input type="date" value={editDate} onChange={function(e){setEditDate(e.target.value);}} /></div>
              <div className="edit-group"><label>Start Time</label><input type="time" value={editStartTime} onChange={function(e){setEditStartTime(e.target.value);}} /></div>
              <div className="edit-group"><label>End Time</label><input type="time" value={editEndTime} onChange={function(e){setEditEndTime(e.target.value);}} /></div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleConfirmEdit}>Confirm</button>
              <button className="modal-btn cancel" onClick={function(){setShowEditModal(false);}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove modal */}
      {showRemoveModal && (
        <div className="remove-reservation" style={{display:'flex'}}>
          <div className="modal-card-remove-reservation">
            <h3>Are you sure you want to cancel the reservation for Seat {activeSeat?activeSeat.seat_number:''}?</h3>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn danger" onClick={handleConfirmRemove}>Remove</button>
              <button className="modal-btn cancel" onClick={function(){setShowRemoveModal(false);}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminManageSeatReservations;