import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../../style/admin_css/AdminManageSeatReservations.css";
import taftlabLogo from '../../assets/images/taftlab-logo.png';
import profileIcon from '../../assets/images/profile-icon.png';

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

const POLL_INTERVAL_MS = 30 * 1000;

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

function isSlotPastToday(slotIndex) {
  const slot = TIME_SLOTS[slotIndex];
  if (!slot) return false;
  return getCurrentTimeStr() >= slot.end;
}

function getSeatAvailabilityStatus(seat) {
  if (!seat) return 'Available';
  if (seat.status === 'Closed') return 'Closed';
  if (seat.is_available === false) return 'Occupied';
  if (seat.is_available === true) return 'Available';
  if (seat.status === 'Occupied') return 'Occupied';
  return 'Available';
}

// ─── CHECK-IN COUNTDOWN ───────────────────────────────────────────────────────
function CheckInCountdown({ reservation, selectedDate, activeSlot, onWindowStart }) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!reservation || !activeSlot || !selectedDate || reservation.status === 'Checked') return;
    const today = getManilaToday();
    const resDate = toManilaDateStr(reservation.date_reserved);
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
      } else { setSecondsLeft(0); }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [reservation, activeSlot, selectedDate, reservation?.status]);

  if (secondsLeft === null || reservation?.status === 'Checked') return null;
  if (secondsLeft === 0) {
    return (
      <span style={{ display: 'inline-block', marginLeft: 8, fontSize: 11, color: '#888', fontWeight: 600, background: '#f0f0f0', borderRadius: 4, padding: '1px 6px' }}>
        Cancellation period has ended
      </span>
    );
  }
  const mins = Math.floor(secondsLeft / 60);
  const secs = (secondsLeft % 60).toString().padStart(2, '0');
  const urgent = secondsLeft <= 60;
  return (
    <span style={{ display: 'inline-block', marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#fff', background: urgent ? '#c0392b' : '#e67e22', borderRadius: 4, padding: '2px 7px' }}>
      ⏱ {mins}:{secs}
    </span>
  );
}

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

  const todayStr = getManilaToday();

  const [selectedDate, setSelectedDate] = useState(
    state && state.initialDate ? state.initialDate : todayStr
  );
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(
    state && state.initialSlotIndex !== undefined ? String(state.initialSlotIndex) : ''
  );
  const isFilterReady = selectedDate !== '' && selectedSlotIndex !== '';

  const [popupSeatId, setPopupSeatId] = useState(null);
  const [activeSeat, setActiveSeat] = useState(null);
  const [reservationDetails, setReservationDetails] = useState(null);

  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showBlockModal,   setShowBlockModal]   = useState(false);
  const [showViewModal,    setShowViewModal]    = useState(false);
  const [showEditModal,    setShowEditModal]    = useState(false);
  const [showRemoveModal,  setShowRemoveModal]  = useState(false);

  // ── Reserve modal ─────────────────────────────────────────────────────────
  const [reserveEmail,     setReserveEmail]     = useState('');
  const [reserveDate,      setReserveDate]      = useState('');
  const [reserveSlotIndex, setReserveSlotIndex] = useState('');

  // ── Block modal — now uses slot dropdown ─────────────────────────────────
  const [blockDate,      setBlockDate]      = useState('');
  const [blockSlotIndex, setBlockSlotIndex] = useState('');

  // ── Edit modal — uses slot dropdown ──────────────────────────────────────
  const [editDate,      setEditDate]      = useState('');
  const [editSlotIndex, setEditSlotIndex] = useState('');

  const [modalMessage,    setModalMessage]    = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const selectedSlotIndexRef = useRef(selectedSlotIndex);
  const selectedDateRef      = useRef(selectedDate);
  useEffect(() => { selectedSlotIndexRef.current = selectedSlotIndex; }, [selectedSlotIndex]);
  useEffect(() => { selectedDateRef.current = selectedDate; }, [selectedDate]);

  // ─── CLOCK ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function formatDateTime(date) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hours}:${minutes}:${seconds} ${ampm}`;
  }

  // ─── FETCH ────────────────────────────────────────────────────────────────────
  async function fetchSeats(slotIndex, date, isInitialLoad = false) {
    if (isInitialLoad) setLoadingSeats(true);
    const slot = TIME_SLOTS[slotIndex];
    if (!slot || !date) { setSeats([]); if (isInitialLoad) setLoadingSeats(false); return; }
    try {
      const url = `http://localhost:3000/admin/${selectedBuilding._id}/laboratory/${selectedLab._id}/available_seats?date=${date}&start_time=${slot.start}&end_time=${slot.end}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch seats: ' + res.status);
      setSeats(await res.json());
    } catch (err) { setError(err.message); }
    finally { if (isInitialLoad) setLoadingSeats(false); }
  }

  async function fetchReservations(isInitialLoad = false) {
    if (isInitialLoad) setLoadingReservations(true);
    try {
      const res = await fetch(`http://localhost:3000/admin/${selectedBuilding._id}/laboratory/${selectedLab._id}/reservations`);
      if (!res.ok) throw new Error('Failed to fetch reservations: ' + res.status);
      setReservations(await res.json());
    } catch (err) { setError(err.message); }
    finally { if (isInitialLoad) setLoadingReservations(false); }
  }

  async function refreshSeatsAndReservations() {
    await fetchSeats(selectedSlotIndexRef.current, selectedDateRef.current, false);
    await fetchReservations(false);
  }

  useEffect(() => { if (!selectedBuilding || !selectedLab) return; fetchReservations(true); }, []);

  useEffect(() => {
    if (!selectedBuilding || !selectedLab) return;
    if (!isFilterReady) { setSeats([]); return; }
    const numericIndex = Number(selectedSlotIndex);
    if (selectedDate === todayStr && isSlotPastToday(numericIndex)) {
      setSelectedSlotIndex(''); setSeats([]); return;
    }
    fetchSeats(numericIndex, selectedDate, true);
  }, [selectedDate, selectedSlotIndex]);

  useEffect(() => {
    if (!selectedBuilding || !selectedLab) return;
    const intervalId = setInterval(async () => {
      const si = selectedSlotIndexRef.current;
      const sd = selectedDateRef.current;
      if (si !== '' && sd !== '') await fetchSeats(Number(si), sd, false);
      await fetchReservations(false);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  if (!state || !selectedBuilding || !selectedLab) {
    return (
      <div className="admin-manage-reservations">
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
        <div className="sub-header"><h2>Error: No building or laboratory selected</h2></div>
        <div style={{ padding: 32, color: 'red', fontWeight: 600 }}>
          Unable to load seat management. Please return to the Admin Building Dashboard and select a laboratory.
        </div>
      </div>
    );
  }

  const activeSlot = selectedSlotIndex !== '' ? TIME_SLOTS[Number(selectedSlotIndex)] : null;

  const totalSeats = seats.length;
  let reservedSeats = 0, unreservedSeats = 0, unavailableSeats = 0;
  for (const seat of seats) {
    const s = getSeatAvailabilityStatus(seat);
    if (s === 'Occupied') reservedSeats++;
    else if (s === 'Available') unreservedSeats++;
    else if (s === 'Closed') unavailableSeats++;
  }

  function buildSeatGrid() {
    if (seats.length === 0) return [];
    const sorted = seats.slice().sort((a, b) => {
      const aRow = a.seat_number.match(/[A-Za-z]+/), aNum = a.seat_number.match(/\d+/);
      const bRow = b.seat_number.match(/[A-Za-z]+/), bNum = b.seat_number.match(/\d+/);
      if (!aRow || !aNum || !bRow || !bNum) return a.seat_number.localeCompare(b.seat_number);
      if (aRow[0] === bRow[0]) return parseInt(aNum[0]) - parseInt(bNum[0]);
      return aRow[0].localeCompare(bRow[0]);
    });
    if (sorted.length === 16) return [
      [sorted[0],sorted[1],null,sorted[2],sorted[3]],
      [sorted[4],sorted[5],null,sorted[6],sorted[7]],
      [null,null,null,null,null],
      [sorted[8],sorted[9],null,sorted[10],sorted[11]],
      [sorted[12],sorted[13],null,sorted[14],sorted[15]]
    ];
    if (sorted.length === 24) return [
      [sorted[0],sorted[1],null,sorted[2],sorted[3]],
      [sorted[4],sorted[5],null,sorted[6],sorted[7]],
      [null,null,null,null,null],
      [sorted[8],sorted[9],null,sorted[10],sorted[11]],
      [sorted[12],sorted[13],null,sorted[14],sorted[15]],
      [null,null,null,null,null],
      [sorted[16],sorted[17],null,sorted[18],sorted[19]],
      [sorted[20],sorted[21],null,sorted[22],sorted[23]]
    ];
    const grid = [];
    for (let i = 0; i < sorted.length; i += 4) {
      const chunk = sorted.slice(i, i + 4);
      grid.push([chunk[0]||null, chunk[1]||null, null, chunk[2]||null, chunk[3]||null]);
    }
    return grid;
  }

  function getOccupantName(seat) {
    if (!activeSlot) return '';
    for (const r of reservations) {
      if (toManilaDateStr(r.date_reserved) !== selectedDate) continue;
      if (r.reserve_startTime >= activeSlot.end || r.reserve_endTime <= activeSlot.start) continue;
      for (const s of r.seat_id) {
        if (s._id.toString() === seat._id.toString()) return r.user_id.full_name;
      }
    }
    return '';
  }

  function getReservationForSeat(seat) {
    if (!activeSlot) return null;
    for (const r of reservations) {
      if (toManilaDateStr(r.date_reserved) !== selectedDate) continue;
      if (r.reserve_startTime >= activeSlot.end || r.reserve_endTime <= activeSlot.start) continue;
      for (const s of r.seat_id) {
        if (s._id.toString() === seat._id.toString()) return r;
      }
    }
    return null;
  }

  function handleSeatClick(seat) {
    if (popupSeatId === seat._id) { setPopupSeatId(null); return; }
    setActiveSeat(seat); setPopupSeatId(seat._id);
  }

  function handlePageClick() { setPopupSeatId(null); }

  // ─── MODAL HANDLERS ───────────────────────────────────────────────────────────
  async function fetchReservationDetails(seat) {
    try {
      const res = await fetch(`http://localhost:3000/admin/${selectedBuilding._id}/laboratory/${selectedLab._id}/view_details/${seat._id}`);
      if (!res.ok) throw new Error('Failed to fetch reservation details: ' + res.status);
      setReservationDetails(await res.json());
      return true;
    } catch (err) { setModalMessage(err.message); return false; }
  }

  function handleOpenReserveModal(seat) {
    setPopupSeatId(null); setActiveSeat(seat);
    setReserveEmail('');
    setReserveDate(selectedDate);
    setReserveSlotIndex(selectedSlotIndex !== '' ? selectedSlotIndex : '');
    setModalMessage(''); setShowReserveModal(true);
  }

  // ── Block modal — pre-fill date and slot from current filter ──────────────
  function handleOpenBlockModal(seat) {
    setPopupSeatId(null); setActiveSeat(seat);
    setBlockDate(selectedDate);
    setBlockSlotIndex(selectedSlotIndex !== '' ? selectedSlotIndex : '');
    setModalMessage(''); setShowBlockModal(true);
  }

  async function handleOpenViewModal(seat) {
    setPopupSeatId(null); setActiveSeat(seat);
    setModalMessage(''); setReservationDetails(null);
    if (await fetchReservationDetails(seat)) setShowViewModal(true);
  }

  async function handleOpenEditModal(seat) {
    setPopupSeatId(null); setActiveSeat(seat);
    setEditDate(''); setEditSlotIndex('');
    setModalMessage(''); setReservationDetails(null);
    if (await fetchReservationDetails(seat)) setShowEditModal(true);
  }

  function handleOpenRemoveModal(seat) {
    setPopupSeatId(null); setActiveSeat(seat);
    setModalMessage(''); setShowRemoveModal(true);
  }

  // ── Reserve confirm ───────────────────────────────────────────────────────────
  async function handleConfirmReserve() {
    setModalMessage('');
    if (reserveSlotIndex === '') { setModalMessage('Please select a time slot.'); return; }
    const chosenSlot = TIME_SLOTS[Number(reserveSlotIndex)];
    if (!chosenSlot) { setModalMessage('Invalid time slot selected.'); return; }
    try {
      const res = await fetch(`http://localhost:3000/admin/${selectedBuilding._id}/laboratory/${selectedLab._id}/reserve_seat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seat_numbers: [activeSeat.seat_number],
          email: reserveEmail,
          date_reserved: reserveDate,
          reserve_startTime: chosenSlot.start,
          reserve_endTime: chosenSlot.end
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reserve seat');
      setModalMessage('Reservation successful!');
      await refreshSeatsAndReservations();
      setShowReserveModal(false);
    } catch (err) { setModalMessage(err.message); }
  }

  // ── Block confirm — derives start/end from slot dropdown ─────────────────────
  async function handleConfirmBlock() {
    setModalMessage('');
    if (blockSlotIndex === '') { setModalMessage('Please select a time slot.'); return; }
    const chosenSlot = TIME_SLOTS[Number(blockSlotIndex)];
    if (!chosenSlot) { setModalMessage('Invalid time slot selected.'); return; }
    try {
      const res = await fetch(`http://localhost:3000/admin/${selectedBuilding._id}/laboratory/${selectedLab._id}/block_seat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seat_number: activeSeat.seat_number,
          restricted_date: blockDate,
          start_time: chosenSlot.start,   // ← derived from dropdown
          end_time: chosenSlot.end         // ← derived from dropdown
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to block seat');
      setModalMessage('Seat blocked successfully!');
      await refreshSeatsAndReservations();
      setShowBlockModal(false);
    } catch (err) { setModalMessage(err.message); }
  }

  async function handleConfirmUnblock(seat) {
    try {
      const res = await fetch(`http://localhost:3000/admin/${selectedBuilding._id}/laboratory/${selectedLab._id}/unblock_seat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_number: seat.seat_number })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unblock seat');
      await refreshSeatsAndReservations(); setPopupSeatId(null);
    } catch (err) { setError(err.message); }
  }

  // ── Edit confirm — derives start/end from slot dropdown ──────────────────────
  async function handleConfirmEdit() {
    setModalMessage('');
    if (editSlotIndex === '') { setModalMessage('Please select a time slot.'); return; }
    const chosenSlot = TIME_SLOTS[Number(editSlotIndex)];
    if (!chosenSlot) { setModalMessage('Invalid time slot selected.'); return; }
    try {
      const res = await fetch(`http://localhost:3000/admin/${selectedBuilding._id}/laboratory/${selectedLab._id}/edit_reservation/${activeSeat._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_reserved: editDate || undefined,
          start_time: chosenSlot.start,
          end_time: chosenSlot.end
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to edit reservation');
      setModalMessage('Reservation updated successfully!');
      await refreshSeatsAndReservations();
      setShowEditModal(false);
    } catch (err) { setModalMessage(err.message); }
  }

  async function handleConfirmRemove() {
    setModalMessage('');
    try {
      const res = await fetch(
        `http://localhost:3000/admin/${selectedBuilding._id}/laboratory/${selectedLab._id}/remove_reservation/${activeSeat._id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove reservation');
      setModalMessage('Reservation removed successfully!');
      await refreshSeatsAndReservations();
      setShowRemoveModal(false);
    } catch (err) { setModalMessage(err.message); }
  }

  async function handleWindowStart(reservationId, deadlineISO) {
    try {
      await fetch(`http://localhost:3000/admin/reservation/${reservationId}/start-checkin-window`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline: deadlineISO })
      });
      await fetchReservations(false);
    } catch (err) { console.error('Failed to persist check-in deadline:', err); }
  }

  function getTimerDisplay(reservation) {
    if (!reservation || reservation.status === 'Checked') return null;
    const today = getManilaToday();
    const resDate = toManilaDateStr(reservation.date_reserved);
    if (resDate !== today) return null;
    const [sh, sm, ss] = reservation.reserve_startTime.split(':').map(Number);
    const slotStart = new Date(); slotStart.setHours(sh, sm, ss || 0, 0);
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

  const currentTimeStr = getCurrentTimeStr();
  const allSlotsPastToday = selectedDate === todayStr &&
    TIME_SLOTS.every(slot => currentTimeStr >= slot.end);
  const gridStyle = { gridTemplateColumns: 'repeat(5, minmax(70px, 1fr))' };

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="admin-manage-reservations" onClick={handlePageClick}>
      <style>{`@keyframes pulse{0%{opacity:1;transform:scale(1)}50%{opacity:.75;transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}`}</style>

      <header onClick={e => e.stopPropagation()}>
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

        <div className="stats-row">
          <div className="stat-card green"><div className="stat-number">{!isFilterReady ? '-' : loadingSeats ? '...' : totalSeats}</div><div className="stat-label">NUMBER OF SEATS</div></div>
          <div className="stat-card gray"><div className="stat-number">{!isFilterReady ? '-' : loadingSeats ? '...' : reservedSeats}</div><div className="stat-label">RESERVED SEATS</div></div>
          <div className="stat-card green"><div className="stat-number">{!isFilterReady ? '-' : loadingSeats ? '...' : unreservedSeats}</div><div className="stat-label">UNRESERVED SEATS</div></div>
          <div className="stat-card gray"><div className="stat-number">{!isFilterReady ? '-' : loadingSeats ? '...' : unavailableSeats}</div><div className="stat-label">UNAVAILABLE SEATS</div></div>
        </div>

        <div className="time-slot-selector" onClick={e => e.stopPropagation()}>
          <div className="edit-group">
            <label>Date</label>
            <input type="date" value={selectedDate} min={todayStr} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <div className="edit-group">
            <label>Time Slot</label>
            <select value={selectedSlotIndex} onChange={e => setSelectedSlotIndex(e.target.value)}>
              <option value="">-- Select a time slot --</option>
              {TIME_SLOTS.map((slot, index) => {
                if (selectedDate === todayStr && currentTimeStr >= slot.end) return null;
                return <option key={index} value={String(index)}>{slot.display}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="seat-grid-container">
          <h3>MANAGE ROOM SEATS</h3>
          {allSlotsPastToday && <p style={{ color: '#c14b4b', textAlign: 'center', padding: '20px', fontWeight: 600 }}>No more time slots available for today. Please select a future date.</p>}
          {!isFilterReady && !allSlotsPastToday && <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Please select a date and time slot to view seat availability.</p>}
          {isFilterReady && loadingSeats && <p>Loading seats...</p>}
          {isFilterReady && !loadingSeats && <div className="seat-front-label">FRONT</div>}

          {isFilterReady && !loadingSeats && (
            <div className="seat-grid" id="seatGrid" style={gridStyle} onClick={e => e.stopPropagation()}>
              {buildSeatGrid().map((row, rowIndex) => {
                if (row.every(c => c === null)) return <div key={'aisle-' + rowIndex} style={{ gridColumn: '1 / -1', height: '16px' }} />;
                return (
                  <React.Fragment key={'row-' + rowIndex}>
                    {row.map((seat, colIndex) => {
                      if (seat === null) return <div className="seat space" key={'s-' + rowIndex + '-' + colIndex} />;
                      const availStatus = getSeatAvailabilityStatus(seat);
                      const seatClass = availStatus === 'Occupied' ? 'seat taken' : availStatus === 'Closed' ? 'seat closed' : 'seat available';
                      const occupantName = getOccupantName(seat);
                      const seatRes = availStatus === 'Occupied' ? getReservationForSeat(seat) : null;
                      const isCheckedIn = seatRes && seatRes.status === 'Checked';
                      return (
                        <div key={seat._id} style={{ position: 'relative' }}>
                          <button type="button" className={seatClass} onClick={e => { e.stopPropagation(); handleSeatClick(seat); }}>
                            <div>{seat.seat_number}</div>
                            {occupantName !== '' && <span className="seat-name">{occupantName}</span>}
                            {isCheckedIn && <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#fff', background: '#2e7d32', borderRadius: 3, padding: '1px 4px', marginTop: 2 }}>✓ Checked In</span>}
                            {seatRes && <CheckInCountdown reservation={seatRes} selectedDate={selectedDate} activeSlot={activeSlot} onWindowStart={handleWindowStart} />}
                          </button>

                          {popupSeatId === seat._id && (
                            <div style={{ position: 'absolute', background: '#e7f3ec', border: '3px solid #ddd', borderRadius: '6px', fontSize: '14px', zIndex: '1000', padding: '5px', textAlign: 'center', top: '0px', left: '105%', minWidth: '160px' }} onClick={e => e.stopPropagation()}>
                              {availStatus === 'Available' && (
                                <div>
                                  <h3 style={{ color: 'green' }}>AVAILABLE</h3>
                                  <button className="available_seat_manage_option_btn" onClick={() => handleOpenReserveModal(seat)}>Reserve Student</button>
                                  <button className="available_seat_manage_option_btn available_seat_manage_option_block_btn" onClick={() => handleOpenBlockModal(seat)}>Block Reservations</button>
                                </div>
                              )}
                              {availStatus === 'Occupied' && (() => {
                                const sr = getReservationForSeat(seat);
                                const canCancel = isCancellationAllowed(sr);
                                const ci = sr && sr.status === 'Checked';
                                return (
                                  <div>
                                    <h3 style={{ color: ci ? '#2e7d32' : '#dd5c36' }}>{ci ? '✓ CHECKED IN' : 'RESERVED'}</h3>
                                    {sr && sr.status !== 'Checked' && <div style={{ marginBottom: 6 }}><CheckInCountdown reservation={sr} selectedDate={selectedDate} activeSlot={activeSlot} onWindowStart={handleWindowStart} /></div>}
                                    <button className="unavailable_seat_manage_option_btn" onClick={() => handleOpenViewModal(seat)}>View Details</button>
                                    <button className="unavailable_seat_manage_option_btn" onClick={() => handleOpenEditModal(seat)}>Edit Reservation</button>
                                    <div style={{ position: 'relative' }}>
                                      <button
                                        className="unavailable_seat_manage_option_btn unavailable_seat_manage_option_delete_btn"
                                        disabled={!canCancel}
                                        title={sr?.status === 'Checked' ? 'Cannot cancel a checked-in reservation' : !canCancel ? 'Cancellation window has expired' : 'Cancel this reservation'}
                                        style={{ opacity: canCancel ? 1 : 0.45, cursor: canCancel ? 'pointer' : 'not-allowed', width: '100%' }}
                                        onClick={() => { if (canCancel) handleOpenRemoveModal(seat); }}
                                      >Cancel Reservation</button>
                                      {!canCancel && <div style={{ fontSize: 12, color: '#888', marginTop: 2, lineHeight: 1.3 }}>{sr?.status === 'Checked' ? 'Already checked in' : 'Check-in window expired'}</div>}
                                    </div>
                                  </div>
                                );
                              })()}
                              {availStatus === 'Closed' && (
                                <div>
                                  <h3 style={{ color: '#888' }}>CLOSED</h3>
                                  <p style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>This seat is blocked.</p>
                                  <button className="available_seat_manage_option_btn available_seat_manage_option_block_btn" onClick={() => handleConfirmUnblock(seat)}>Unblock Seat</button>
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

        <div className="reserved-table-container">
          <h3>
            {isFilterReady
              ? `Reservations for ${selectedLab.room_code} on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} (${activeSlot ? activeSlot.display : ''})`
              : `Reservations for ${selectedLab.room_code}`}
          </h3>
          {loadingReservations && <p>Loading reservations...</p>}
          {!loadingReservations && (
            <table className="reserved-table">
              <thead><tr><th>Reserved Seats</th><th>Time Slot</th><th>Reserved Person</th><th>Status</th><th>Reservation Cancellation Timer</th></tr></thead>
              <tbody>
                {reservations
                  .filter(r => {
                    if (!isFilterReady || !activeSlot) return true;
                    const sd = toManilaDateStr(r.date_reserved) === selectedDate;
                    const ol = r.reserve_startTime < activeSlot.end && r.reserve_endTime > activeSlot.start;
                    return sd && ol;
                  })
                  .map(reservation => {
                    const sn = reservation.seat_id.map(s => s.seat_number).join(', ');
                    const ic = reservation.status === 'Checked';
                    const timerDisplay = getTimerDisplay(reservation);
                    return (
                      <tr key={reservation._id}>
                        <td>{sn}</td>
                        <td>{reservation.reserve_startTime} - {reservation.reserve_endTime}</td>
                        <td>{reservation.user_id.full_name}</td>
                        <td><span style={{ fontWeight: 600, color: ic ? '#2e7d32' : '#e67e22' }}>{ic ? '✓ Checked In' : 'Ongoing'}</span></td>
                        <td>
                          {timerDisplay ? (
                            timerDisplay.type === 'expired'
                              ? <span style={{ fontSize: 13, color: '#888' }}>Time elapsed</span>
                              : <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#fff', background: timerDisplay.urgent ? '#c0392b' : '#e67e22', borderRadius: 4, padding: '2px 7px', animation: timerDisplay.urgent ? 'pulse 1s infinite' : 'none' }}>⏱ {timerDisplay.display}</span>
                          ) : (
                            <span style={{ fontSize: 13, color: '#888' }}>{reservation.status === 'Checked' ? 'Already checked in' : 'Timer not started'}</span>
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ── RESERVE WALK-IN STUDENT ─────────────────────────────────────────── */}
      {showReserveModal && (
        <div className="reserve-student" style={{ display: 'flex' }}>
          <div className="modal-card-reserve-student">
            <h3>Reserve Walk-In Student</h3>
            <div className="reserve-content">
              <div className="edit-group">
                <label>Seat Number</label>
                <input type="text" value={activeSeat ? activeSeat.seat_number : ''} disabled />
              </div>
              <div className="edit-group">
                <label>Student Email</label>
                <input type="email" value={reserveEmail} onChange={e => setReserveEmail(e.target.value)} placeholder="Enter student's registered email" />
              </div>
              <div className="edit-group">
                <label>Date</label>
                <input type="date" value={reserveDate} min={todayStr} onChange={e => { setReserveDate(e.target.value); setReserveSlotIndex(''); }} />
              </div>
              <div className="edit-group">
                <label>Time Slot</label>
                <select value={reserveSlotIndex} onChange={e => setReserveSlotIndex(e.target.value)}>
                  <option value="">-- Select a time slot --</option>
                  {TIME_SLOTS.map((slot, index) => {
                    if (reserveDate === todayStr && currentTimeStr >= slot.end) return null;
                    return <option key={index} value={String(index)}>{slot.display}</option>;
                  })}
                </select>
              </div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleConfirmReserve}>Reserve</button>
              <button className="modal-btn cancel" onClick={() => setShowReserveModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCK SEAT — now uses slot dropdown ──────────────────────────────── */}
      {showBlockModal && (
        <div className="block-reservations" style={{ display: 'flex' }}>
          <div className="modal-card-block-reservations">
            <h3>Block Seat</h3>
            <div className="block-content">
              <div className="edit-group">
                <label>Seat Number</label>
                <input type="text" value={activeSeat ? activeSeat.seat_number : ''} disabled />
              </div>
              <div className="edit-group">
                <label>Date</label>
                <input type="date" value={blockDate} onChange={e => { setBlockDate(e.target.value); setBlockSlotIndex(''); }} />
              </div>
              <div className="edit-group">
                <label>Time Slot</label>
                <select value={blockSlotIndex} onChange={e => setBlockSlotIndex(e.target.value)}>
                  <option value="">-- Select a time slot --</option>
                  {TIME_SLOTS.map((slot, index) => {
                    if (blockDate === todayStr && currentTimeStr >= slot.end) return null;
                    return <option key={index} value={String(index)}>{slot.display}</option>;
                  })}
                </select>
              </div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleConfirmBlock}>Block</button>
              <button className="modal-btn cancel" onClick={() => setShowBlockModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW DETAILS ─────────────────────────────────────────────────────── */}
      {showViewModal && reservationDetails && (
        <div className="view-details" style={{ display: 'flex' }}>
          <div className="modal-card-view-details">
            <h3>Reservation Details</h3>
            <div className="view-details-content">
              <div className="view-details-item"><span className="label">Name</span><span className="value">{reservationDetails.full_name}</span></div>
              <div className="view-details-item"><span className="label">Email</span><span className="value">{reservationDetails.email}</span></div>
              <div className="view-details-item"><span className="label">Seat Number</span><span className="value">{reservationDetails.seat_numbers.join(', ')}</span></div>
              <div className="view-details-item"><span className="label">Status</span><span className="value" style={{ color: reservationDetails.reservation_status === 'Checked' ? '#2e7d32' : '#e67e22', fontWeight: 600 }}>{reservationDetails.reservation_status === 'Checked' ? '✓ Checked In' : 'Ongoing'}</span></div>
              <div className="view-details-item"><span className="label">Date Reserved</span><span className="value">{new Date(reservationDetails.date_reserved).toLocaleDateString()}</span></div>
              <div className="view-details-item"><span className="label">Start Time</span><span className="value">{reservationDetails.start_time}</span></div>
              <div className="view-details-item"><span className="label">End Time</span><span className="value">{reservationDetails.end_time}</span></div>
              <div className="view-details-item"><span className="label">Laboratory</span><span className="value">{reservationDetails.room_code}</span></div>
              <div className="view-details-item"><span className="label">Building</span><span className="value">{reservationDetails.building}</span></div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT RESERVATION ─────────────────────────────────────────────────── */}
      {showEditModal && reservationDetails && (
        <div className="edit-reservation" style={{ display: 'flex' }}>
          <div className="modal-card-edit-reservation">
            <h3>Edit Reservation</h3>
            <div className="edit-content">
              <div className="edit-group"><label>Name</label><input type="text" value={reservationDetails.full_name} disabled /></div>
              <div className="edit-group"><label>Email</label><input type="email" value={reservationDetails.email} disabled /></div>
              <div className="edit-group">
                <label>Current Time Slot</label>
                <input type="text" value={`${reservationDetails.start_time} — ${reservationDetails.end_time}`} disabled style={{ color: '#888', fontStyle: 'italic' }} />
              </div>
              <div className="edit-group">
                <label>Date Reserved</label>
                <input type="date" value={editDate} min={todayStr} onChange={e => { setEditDate(e.target.value); setEditSlotIndex(''); }} />
              </div>
              <div className="edit-group">
                <label>New Time Slot</label>
                <select value={editSlotIndex} onChange={e => setEditSlotIndex(e.target.value)}>
                  <option value="">-- Select a time slot --</option>
                  {TIME_SLOTS.map((slot, index) => {
                    const dateToCheck = editDate || todayStr;
                    if (dateToCheck === todayStr && currentTimeStr >= slot.end) return null;
                    return <option key={index} value={String(index)}>{slot.display}</option>;
                  })}
                </select>
              </div>
            </div>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleConfirmEdit}>Confirm</button>
              <button className="modal-btn cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── REMOVE RESERVATION ───────────────────────────────────────────────── */}
      {showRemoveModal && (
        <div className="remove-reservation" style={{ display: 'flex' }}>
          <div className="modal-card-remove-reservation">
            <h3>Are you sure you want to cancel the reservation for Seat {activeSeat ? activeSeat.seat_number : ''}?</h3>
            {modalMessage && <p className="modal-message">{modalMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn danger" onClick={handleConfirmRemove}>Remove</button>
              <button className="modal-btn cancel" onClick={() => setShowRemoveModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/admin/building-dashboard', { state: { selectedBuilding } })}
          style={{ padding: '10px 30px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.3s ease' }}
          onMouseOver={e => e.target.style.backgroundColor = '#5a6268'}
          onMouseOut={e => e.target.style.backgroundColor = '#6c757d'}
        >
          Back to Building Dashboard
        </button>
      </div>

    </div>
  );
}

export default AdminManageSeatReservations;