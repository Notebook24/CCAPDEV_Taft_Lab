import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import "../../style/user_css/UserReservationHistory.css";
import ls229Indoor from '../../assets/images/LS_229_indoor_1.jpg';
import v103Indoor from '../../assets/images/V_103_indoor_3.jpg';
import ag1904Indoor from '../../assets/images/AG_1904_indoor_1.jpg';
import gk304bIndoor from '../../assets/images/GK_304B_indoor_1.jpg';
import j212Indoor from '../../assets/images/J_212_indoor_1.jpg';
import y602Indoor from '../../assets/images/Y_602_indoor_1.jpg';
import API_BASE_URL from '../../config/api';

const buildingImageMap = {
  'Gokongwei Hall': gk304bIndoor,
  'St. La Salle Hall': ls229Indoor,
  'Velasco Hall': v103Indoor,
  'Br. Andrew Gonzales Hall': ag1904Indoor,
  'Jimenez Hall': j212Indoor,
  'Yuchengco Hall': y602Indoor
};

// ── HELPER: parse "HH:MM AM/PM" → "HH:MM:SS" (24h) ──────────────────────────
function parse12hTo24hStr(timeStr12) {
  if (!timeStr12) return null;
  const match = timeStr12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hh = parseInt(match[1], 10);
  const mm = match[2];
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hh !== 12) hh += 12;
  if (meridiem === 'AM' && hh === 12) hh = 0;
  return hh.toString().padStart(2, '0') + ':' + mm + ':00';
}

// ── HELPER: current Manila time HH:MM:SS ─────────────────────────────────────
function getManilaTimeStr() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  return (
    now.getHours().toString().padStart(2, '0') + ':' +
    now.getMinutes().toString().padStart(2, '0') + ':' +
    now.getSeconds().toString().padStart(2, '0')
  );
}

// ── HELPER: today in Manila YYYY-MM-DD ────────────────────────────────────────
function getManilaToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

// ── HELPER: is the slot already finished? ────────────────────────────────────
function isSlotFinished(reservation) {
  if (!reservation) return false;
  const timePart = reservation.reservationTime || '';
  const endMatch = timePart.match(/[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)$/i);
  if (!endMatch) return false;
  const endTime24 = parse12hTo24hStr(endMatch[1]);
  if (!endTime24) return false;
  const todayManila = getManilaToday();
  const currentTimeStr = getManilaTimeStr();
  const reservDateManila = new Date(reservation.reservationDate)
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  if (reservDateManila < todayManila) return true;
  if (reservDateManila === todayManila && currentTimeStr >= endTime24) return true;
  return false;
}

// ── HELPER: has the slot already started? ────────────────────────────────────
function isSlotStarted(reservation) {
  if (!reservation) return false;
  const timePart = reservation.reservationTime || '';
  const startMatch = timePart.match(/^(\d{1,2}:\d{2}\s*[AP]M)/i);
  if (!startMatch) return false;
  const startTime24 = parse12hTo24hStr(startMatch[1]);
  if (!startTime24) return false;
  const todayManila = getManilaToday();
  const currentTimeStr = getManilaTimeStr();
  const reservDateManila = new Date(reservation.reservationDate)
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  if (reservDateManila < todayManila) return true;
  if (reservDateManila === todayManila && currentTimeStr >= startTime24) return true;
  return false;
}

function UserReservationHistory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [currentResID, setCurrentResID] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState('07:30:00|09:00:00');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── FETCH ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchReservationHistory = async () => {
      try {
        setLoading(true);
        const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
        if (!userId) { navigate('/login'); return; }
        const response = await fetch(`${API_BASE_URL}/api/user/${userId}/reservation-history`);
        if (!response.ok) throw new Error('Failed to fetch reservation history');
        const data = await response.json();
        // Sort by most recently created (_id is chronological in MongoDB)
        setReservations(
          data
            .map(res => ({ ...res, image: buildingImageMap[res.buildingName] || null }))
            .sort((a, b) => (a.id > b.id ? -1 : 1))
        );
        setError(null);
      } catch (err) {
        setError(err.message);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReservationHistory();
  }, [navigate]);

  const refreshReservations = async () => {
    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
    if (!userId) return;
    const res = await fetch(`${API_BASE_URL}/api/user/${userId}/reservation-history`);
    if (res.ok) {
      const data = await res.json();
      // Sort by most recently created (_id is chronological in MongoDB)
      setReservations(
        data
          .map(r => ({ ...r, image: buildingImageMap[r.buildingName] || null }))
          .sort((a, b) => (a.id > b.id ? -1 : 1))
      );
    }
  };

  const applyFilter = () => {};

  const filteredReservations = filter === 'All'
    ? reservations
    : reservations.filter(res => res.status === filter);

  // ── MODALS ───────────────────────────────────────────────────────────────────
  const openReschedModal  = (id) => { setCurrentResID(id); document.getElementById('reschedModal').style.display  = 'flex'; };
  const closeReschedModal = ()    => { document.getElementById('reschedModal').style.display  = 'none'; };
  const closeConfirmModal = ()    => { document.getElementById('confirmModal').style.display  = 'none'; };
  const openCancelModal   = (id) => { setCurrentResID(id); document.getElementById('cancelModal').style.display   = 'flex'; };
  const closeCancelModal  = ()    => { document.getElementById('cancelModal').style.display   = 'none'; };

  const openConfirmModal = (id) => {
    const reservation = reservations.find(r => r.id === id);
    if (reservation && isSlotFinished(reservation)) {
      alert('This reservation\'s time slot has already ended.\n\nIt will be marked as Completed shortly. Check-in is no longer possible.');
      return;
    }
    setCurrentResID(id);
    document.getElementById('confirmModal').style.display = 'flex';
  };

  // ── EDIT: navigate to edit page with full reservation data ───────────────────
  const handleEditReservation = (reservation) => {
    navigate('/user/edit-reservation', { state: { reservation } });
  };

  // ── CHECK-IN ─────────────────────────────────────────────────────────────────
  const confirmReservation = async () => {
    try {
      const reservation = reservations.find(r => r.id === currentResID);
      if (reservation && isSlotFinished(reservation)) {
        alert('This time slot has already ended. Check-in is no longer possible.');
        closeConfirmModal();
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/user/reservation-history/${currentResID}/check-in`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to check-in');
      alert('Reservation confirmed successfully! Enjoy using the lab :>');
      closeConfirmModal();
      await refreshReservations();
    } catch (err) { alert('Failed to check-in: ' + err.message); }
  };

  // ── RESCHEDULE ───────────────────────────────────────────────────────────────
  const handleReschedConfirm = async () => {
    try {
      const [startTime, endTime] = selectedSlot.split('|');
      const currentReservation = reservations.find(r => r.id === currentResID);
      const response = await fetch(`${API_BASE_URL}/api/user/reservation-history/${currentResID}/reschedule`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reserve_startTime: startTime, reserve_endTime: endTime, date_reserved: currentReservation.reservationDate })
      });
      if (!response.ok) throw new Error('Failed to reschedule reservation');
      alert('Reservation rescheduled successfully!');
      closeReschedModal();
      await refreshReservations();
    } catch (err) { alert('Failed to reschedule: ' + err.message); }
  };

  // ── CANCEL ───────────────────────────────────────────────────────────────────
  const confirmCancellation = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/reservation-history/${currentResID}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to cancel reservation');
      alert('Reservation cancelled successfully!');
      closeCancelModal();
      await refreshReservations();
    } catch (err) { alert('Failed to cancel: ' + err.message); }
  };

  const currentReservation = reservations.find(r => r.id === currentResID);

  return (
    <div className="user-reservation-history">
      <UserNavbar />

      <div className="title-bar"><h1>My Reservations</h1></div>

      <div id="reservationListView">
        <div className="filter-row">
          <select id="filterSelect" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Checked">Checked</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onClick={applyFilter}>Filter</button>
        </div>

        <div id="cardContainer">
          {loading && <p style={{ textAlign: 'center', padding: '20px' }}>Loading your reservations...</p>}
          {error && <p style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Error: {error}</p>}
          {!loading && !error && filteredReservations.length === 0 && (
            <p style={{ textAlign: 'center', padding: '20px' }}>No reservations found</p>
          )}

          {!loading && !error && filteredReservations.map(reservation => {
            const slotFinished = isSlotFinished(reservation);
            const slotStarted  = isSlotStarted(reservation);
            const canEdit = reservation.status === 'Active' && !slotStarted;

            return (
              <div key={reservation.id} className="reservation-card">
                <div className="card-image">
                  <img src={reservation.image} alt={reservation.buildingName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                </div>
                <div className="card-info">
                  <h2>{reservation.buildingName}</h2>
                  <h3>{reservation.roomCode} | Seat: {reservation.seat}</h3>
                  <p>
                    <strong>Date:</strong> {reservation.reservationDate}<br />
                    <strong>Time:</strong> {reservation.reservationTime}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {reservation.status === 'Active' && (
                      <>
                        <button 
                          className="btn-green" 
                          onClick={() => openConfirmModal(reservation.id)}
                          disabled={slotFinished}
                          style={{ opacity: slotFinished ? 0.5 : 1, cursor: slotFinished ? 'not-allowed' : 'pointer' }}
                        >
                          Check In
                        </button>
                        {canEdit && (
                          <button 
                            className="btn-yellow" 
                            onClick={() => handleEditReservation(reservation)}
                          >
                            Edit Details
                          </button>
                        )}
                      </>
                    )}
                    {reservation.status === 'Checked' && (
                      <span className="status-checked">Checked In</span>
                    )}
                    {reservation.status === 'Completed' && (
                      <span className="status-completed">Completed</span>
                    )}
                    {reservation.status === 'Cancelled' && (
                      <span className="status-cancelled">Cancelled</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="back-btn" onClick={() => navigate('/user')}>Back</button>
      </div>

      {/* Reschedule Modal */}
      <div id="reschedModal">
        <div className="modal-content">
          <h2>Reschedule Reservation</h2>
          {currentReservation && (
            <div id="modalReservationDetails">
              <br />
              <div style={{ textAlign: 'center' }}><p><b>{currentReservation.buildingName}</b></p></div>
              <p>
                <b>Room:</b> {currentReservation.roomCode}<br />
                <b>Seat:</b> {currentReservation.seat}<br />
                <b>Requested:</b> {currentReservation.requestedDate} <b>|</b> {currentReservation.requestedTime}<br />
                <b>Reservation:</b> {currentReservation.reservationDate} <b>|</b> {currentReservation.reservationTime}
              </p><br />
            </div>
          )}
          <label>Choose New Timeslot</label>
          <select id="slotDropdown" value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)}>
            <option value="07:30:00|09:00:00">07:30 AM - 09:00 AM</option>
            <option value="11:00:00|12:30:00">11:00 AM - 12:30 PM</option>
            <option value="12:45:00|14:15:00">12:45 PM - 02:15 PM</option>
            <option value="14:30:00|16:00:00">02:30 PM - 04:00 PM</option>
            <option value="16:15:00|17:45:00">04:15 PM - 05:45 PM</option>
            <option value="18:00:00|19:30:00">06:00 PM - 07:30 PM</option>
          </select>
          <div className="modal-actions">
            <div className="modal-actions-inner">
              <button className="modal-btn secondary" onClick={closeReschedModal}>Back</button>
              <button className="modal-btn primary" onClick={handleReschedConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      <div id="confirmModal">
        <div className="modal-content">
          <h2>Confirm Reservation</h2>
          {currentReservation && (
            <div id="confirmReservationDetails">
              <br />
              <div style={{ textAlign: 'center' }}><p><b>{currentReservation.buildingName}</b></p></div>
              <p>
                <b>Room:</b> {currentReservation.roomCode}<br />
                <b>Seat:</b> {currentReservation.seat}<br />
                <b>Requested:</b> {currentReservation.requestedDate} <b>|</b> {currentReservation.requestedTime}<br />
                <b>Reservation:</b> {currentReservation.reservationDate} <b>|</b> {currentReservation.reservationTime}
              </p>
            </div>
          )}
          <p style={{ textAlign: 'center' }}><i><br />By confirming, you will be marked <b>present</b> in the computer laboratory with your assigned seat.</i></p>
          <div className="modal-actions">
            <div className="modal-actions-inner">
              <button className="modal-btn secondary" onClick={closeConfirmModal}>Back</button>
              <button className="modal-btn primary" onClick={confirmReservation}>Confirm</button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <div id="cancelModal">
        <div className="modal-content">
          <h2>Cancel Reservation</h2>
          {currentReservation && (
            <div id="cancelReservationDetails">
              <br />
              <div style={{ textAlign: 'center' }}><p><b>{currentReservation.buildingName}</b></p></div>
              <p>
                <b>Room:</b> {currentReservation.roomCode}<br />
                <b>Seat:</b> {currentReservation.seat}<br />
                <b>Requested:</b> {currentReservation.requestedDate} <b>|</b> {currentReservation.requestedTime}<br />
                <b>Reservation:</b> {currentReservation.reservationDate} <b>|</b> {currentReservation.reservationTime}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default UserReservationHistory;