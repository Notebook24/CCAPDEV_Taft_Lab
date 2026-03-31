import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import SeatGrid from '../../components/SeatGrid';
import "../../style/user_css/UserReservationConfirmation.css";
import API_BASE_URL from '../../config/api';

// ── FULL 48-SLOT TIME TABLE ───────────────────────────────────────────────────
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

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getManilaTimeStr() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  return (
    now.getHours().toString().padStart(2, '0') + ':' +
    now.getMinutes().toString().padStart(2, '0') + ':' +
    now.getSeconds().toString().padStart(2, '0')
  );
}

function getManilaToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

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

function generateSeatLayout(seatDataObj) {
  if (!seatDataObj || Object.keys(seatDataObj).length === 0) return [];
  const seatNumbers = Object.keys(seatDataObj);

  seatNumbers.sort((a, b) => {
    const aRow = a.match(/[A-Za-z]+/);
    const aNum = a.match(/\d+/);
    const bRow = b.match(/[A-Za-z]+/);
    const bNum = b.match(/\d+/);
    if (!aRow || !aNum || !bRow || !bNum) return a.localeCompare(b);
    if (aRow[0] === bRow[0]) return parseInt(aNum[0]) - parseInt(bNum[0]);
    return aRow[0].localeCompare(bRow[0]);
  });

  if (seatNumbers.length === 16) return [
    [seatNumbers[0],  seatNumbers[1],  null, seatNumbers[2],  seatNumbers[3]],
    [seatNumbers[4],  seatNumbers[5],  null, seatNumbers[6],  seatNumbers[7]],
    [null, null, null, null, null],
    [seatNumbers[8],  seatNumbers[9],  null, seatNumbers[10], seatNumbers[11]],
    [seatNumbers[12], seatNumbers[13], null, seatNumbers[14], seatNumbers[15]],
  ];
  if (seatNumbers.length === 24) return [
    [seatNumbers[0],  seatNumbers[1],  null, seatNumbers[2],  seatNumbers[3]],
    [seatNumbers[4],  seatNumbers[5],  null, seatNumbers[6],  seatNumbers[7]],
    [null, null, null, null, null],
    [seatNumbers[8],  seatNumbers[9],  null, seatNumbers[10], seatNumbers[11]],
    [seatNumbers[12], seatNumbers[13], null, seatNumbers[14], seatNumbers[15]],
    [null, null, null, null, null],
    [seatNumbers[16], seatNumbers[17], null, seatNumbers[18], seatNumbers[19]],
    [seatNumbers[20], seatNumbers[21], null, seatNumbers[22], seatNumbers[23]],
  ];

  const layout = [];
  for (let i = 0; i < seatNumbers.length; i += 6) {
    const row = [];
    for (let j = 0; j < 6 && i + j < seatNumbers.length; j++) {
      row.push(seatNumbers[i + j]);
      if (row.length === 3) row.push(null);
    }
    layout.push(row);
  }
  return layout;
}

// Override own seats from "taken" → "available" so the user can toggle them
function applyOwnSeatOverride(rawSeatData, ownSeatNumbers) {
  if (!rawSeatData || ownSeatNumbers.length === 0) return rawSeatData;
  const patched = { ...rawSeatData };
  ownSeatNumbers.forEach(sn => {
    if (patched[sn] && patched[sn].status === 'taken') {
      patched[sn] = { ...patched[sn], status: 'available', name: null };
    }
  });
  return patched;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
function UserEditReservation() {
  const location = useLocation();
  const navigate = useNavigate();
  const reservation = location.state?.reservation;

  useEffect(() => {
    if (!reservation) navigate('/user/reservation-history');
  }, []);
  if (!reservation) return null;

  // Parse original start time
  const timePart        = reservation.reservationTime || '';
  const startMatch      = timePart.match(/^(\d{1,2}:\d{2}\s*[AP]M)/i);
  const originalStart24 = startMatch ? parse12hTo24hStr(startMatch[1]) : null;
  const originalSlotIndex = originalStart24
    ? TIME_SLOTS.findIndex(s => s.start === originalStart24)
    : -1;

  const originalSeatNumbers = reservation.seat
    ? reservation.seat.split(', ').map(s => s.trim())
    : [];

  const reservDateManila = new Date(reservation.reservationDate)
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

  // ── AVAILABLE SLOTS ───────────────────────────────────────────────────────
  // Hide slots whose START time has already passed today.
  // For future-dated reservations: all slots are available.
  // This matches the backend guard which also checks start time, not end time.
  const currentTimeStr = getManilaTimeStr();
  const todayManila    = getManilaToday();

  const availableSlots = TIME_SLOTS.map((slot, index) => {
    // For today: hide any slot whose start time has already passed
    if (reservDateManila === todayManila && currentTimeStr >= slot.start) return null;
    return { slot, index };
  }).filter(Boolean);

  // ── STATE ─────────────────────────────────────────────────────────────────
  const [buildingId,   setBuildingId]   = useState(null);
  const [labId,        setLabId]        = useState(null);
  const [rawSeatData,  setRawSeatData]  = useState({});
  const [seatLayout,   setSeatLayout]   = useState([]);
  const [dataLoading,  setDataLoading]  = useState(false);
  const [seatsError,   setSeatsError]   = useState(null);

  // Default to original slot; but only if it's still in the available list
  // (if it's already started, fall back to empty so the user must pick one)
  const originalStillAvailable =
    originalSlotIndex >= 0 &&
    !(reservDateManila === todayManila && currentTimeStr >= (originalStart24 || ''));

  const [selectedSlotIndex, setSelectedSlotIndex] = useState(
    originalStillAvailable ? String(originalSlotIndex) : ''
  );
  const [selectedSeats,  setSelectedSeats]  = useState(new Set());
  const [isAnonymous,    setIsAnonymous]    = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [notice,         setNotice]         = useState('');
  const [submitError,    setSubmitError]    = useState(null);
  const [successMsg,     setSuccessMsg]     = useState('');

  // ── STEP 1: resolve building/lab IDs ─────────────────────────────────────
  useEffect(() => {
    const resolve = async () => {
      try {
        const bRes = await fetch(`${API_BASE_URL}/admin`);
        if (!bRes.ok) throw new Error('Failed to fetch buildings');
        const buildings = await bRes.json();
        const building = buildings.find(b => b.building_name === reservation.buildingName);
        if (!building) throw new Error(`Building "${reservation.buildingName}" not found`);
        setBuildingId(building._id);

        const lRes = await fetch(`${API_BASE_URL}/admin/${building._id}/laboratories`);
        if (!lRes.ok) throw new Error('Failed to fetch labs');
        const labs = await lRes.json();
        const lab = labs.find(l => l.room_code === reservation.roomCode);
        if (!lab) throw new Error(`Lab "${reservation.roomCode}" not found`);
        setLabId(lab._id);
      } catch (err) {
        setSeatsError(err.message);
      }
    };
    resolve();
  }, []);

  // ── STEP 2: fetch seats ───────────────────────────────────────────────────
  const fetchSeats = async (slotIdx, bId, lId) => {
    if (!bId || !lId || slotIdx === '') return;
    setDataLoading(true);
    setSeatsError(null);
    setRawSeatData({});
    setSeatLayout([]);
    setSelectedSeats(new Set());

    try {
      const slot = TIME_SLOTS[Number(slotIdx)];
      const url =
        `${API_BASE_URL}/user/reservation/${bId}/${lId}/seats` +
        `?date=${reservDateManila}&startTime=${slot.start}&endTime=${slot.end}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch seat availability');
      const data = await res.json();

      const raw = data.seat_data || {};
      setRawSeatData(raw);
      setSeatLayout(generateSeatLayout(raw));

      // Pre-select own seats (they exist in the data for this slot)
      const preSelected = new Set(
        originalSeatNumbers.filter(sn => raw[sn] !== undefined)
      );
      setSelectedSeats(preSelected);
    } catch (err) {
      setSeatsError(err.message);
    } finally {
      setDataLoading(false);
    }
  };

  // Fire initial seat fetch once IDs are ready
  useEffect(() => {
    if (buildingId && labId && selectedSlotIndex !== '') {
      fetchSeats(selectedSlotIndex, buildingId, labId);
    }
  }, [buildingId, labId]);

  const handleSlotChange = (e) => {
    const val = e.target.value;
    setSelectedSlotIndex(val);
    setNotice('');
    setSubmitError(null);
    if (val !== '' && buildingId && labId) {
      fetchSeats(val, buildingId, labId);
    } else {
      setRawSeatData({});
      setSeatLayout([]);
      setSelectedSeats(new Set());
    }
  };

  // Patch own seats to available so SeatGrid allows toggling them
  const displaySeatData = applyOwnSeatOverride(rawSeatData, originalSeatNumbers);

  // ── SEAT TOGGLE ───────────────────────────────────────────────────────────
  const toggleSeat = (seatNumber) => {
    setNotice('');
    setSelectedSeats(prev => {
      const next = new Set(prev);
      next.has(seatNumber) ? next.delete(seatNumber) : next.add(seatNumber);
      return next;
    });
  };

  const clearSelection = () => { setSelectedSeats(new Set()); setNotice(''); };
  const isAnonymousName = (name) => !name || name.trim().toLowerCase() === 'anonymous';

  // ── CONFIRM ───────────────────────────────────────────────────────────────
  const handleConfirm = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setNotice('');

    // Guard: original slot must not have started
    const nowStr   = getManilaTimeStr();
    const todayStr = getManilaToday();
    const originalSlotStarted =
      reservDateManila < todayStr ||
      (reservDateManila === todayStr && originalStart24 && nowStr >= originalStart24);

    if (originalSlotStarted) {
      setSubmitError('Your reservation\'s time slot has already started. Editing is no longer allowed.');
      return;
    }

    if (selectedSeats.size === 0) { setNotice('Please select at least one seat.'); return; }
    if (selectedSlotIndex === '')  { setNotice('Please select a time slot.'); return; }

    const newSlot = TIME_SLOTS[Number(selectedSlotIndex)];

    // Guard: new slot's START time must not have passed
    if (reservDateManila === todayStr && getManilaTimeStr() >= newSlot.start) {
      setSubmitError('The selected time slot has already started. Please choose a slot that hasn\'t begun yet.');
      return;
    }

    // Resolve seat numbers → seat IDs
    const selectedSeatIds = [];
    const unmapped = [];
    Array.from(selectedSeats).forEach(sn => {
      if (displaySeatData[sn]?.seat_id) {
        selectedSeatIds.push(displaySeatData[sn].seat_id);
      } else {
        unmapped.push(sn);
      }
    });
    if (unmapped.length > 0) {
      setSubmitError(`Could not resolve seat IDs for: ${unmapped.join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/user/reservation-history/${reservation.id}/edit`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seat_ids: selectedSeatIds,
            reserve_startTime: newSlot.start,
            reserve_endTime: newSlot.end,
            is_anonymous: isAnonymous,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update reservation');
      setSuccessMsg('Reservation updated successfully! Redirecting…');
      setTimeout(() => navigate('/user/reservation-history'), 1800);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSlot = selectedSlotIndex !== '' ? TIME_SLOTS[Number(selectedSlotIndex)] : null;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <UserNavbar />

      <div className="sub-header">Edit Reservation</div>

      {dataLoading && (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
          Loading seat data…
        </div>
      )}

      {seatsError && (
        <div style={{
          textAlign: 'center', padding: '20px', fontSize: '16px',
          color: '#d9534f', background: '#fdeaea', borderRadius: '8px', margin: '20px'
        }}>
          Error: {seatsError}
        </div>
      )}

      {!dataLoading && seatLayout.length > 0 && (
        <>
          <SeatGrid
            layout={seatLayout}
            seatData={displaySeatData}
            selectedSeats={selectedSeats}
            onSeatToggle={toggleSeat}
            isAnonymousName={isAnonymousName}
          />
          <section className="seat-controls">
            <label className="checkline">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
              />
              Reserve anonymously
            </label>
            <div className="seat-actions">
              <button className="btn secondary" type="button" onClick={clearSelection}>
                Clear Selection
              </button>
            </div>
          </section>
        </>
      )}

      {!dataLoading && seatLayout.length === 0 && !seatsError && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: '#6a7a70', fontSize: '15px' }}>
          Select a time slot below to view available seats.
        </div>
      )}

      <main className="container">
        <div className="hstry-confirm-wrapper">

          <div className="hstry-left-box">
            <h3>Update your time slot &amp; seat.</h3>

            <form onSubmit={handleConfirm}>
              <label>Time Slot</label>
              <select
                value={selectedSlotIndex}
                onChange={handleSlotChange}
                className="hstry-input"
                style={{ cursor: 'pointer' }}
              >
                <option value="">-- Select a time slot --</option>
                {availableSlots.map(({ slot, index }) => (
                  <option key={index} value={String(index)}>
                    {slot.display}{index === originalSlotIndex ? ' (current)' : ''}
                  </option>
                ))}
              </select>

              {availableSlots.length === 0 && (
                <p style={{ fontSize: '13px', color: '#b91c1c', marginTop: '6px' }}>
                  No available time slots for this date.
                </p>
              )}

              <label className="checkline" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                />
                Reserve anonymously
              </label>

              {notice && <div className="seat-notice" style={{ marginTop: '10px' }}>{notice}</div>}
              {submitError && (
                <div style={{
                  color: '#d9534f', background: '#fdeaea', padding: '10px',
                  borderRadius: '4px', fontSize: '14px', marginTop: '10px'
                }}>
                  {submitError}
                </div>
              )}
              {successMsg && (
                <div style={{
                  color: '#0b6b37', background: '#e6f4ec', padding: '10px',
                  borderRadius: '4px', fontSize: '14px', fontWeight: 600, marginTop: '10px'
                }}>
                  {successMsg}
                </div>
              )}

              <div className="button-group">
                <button
                  type="submit"
                  className="hstry-btn-submit"
                  disabled={submitting || selectedSeats.size === 0 || selectedSlotIndex === ''}
                  style={{
                    opacity: (submitting || selectedSeats.size === 0 || selectedSlotIndex === '') ? 0.55 : 1,
                    cursor: (submitting || selectedSeats.size === 0 || selectedSlotIndex === '') ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Saving…' : 'Confirm Changes'}
                </button>
                <button
                  type="button"
                  className="hstry-btn-back"
                  onClick={() => navigate('/user/reservation-history')}
                >
                    Back to My Reservations
                </button>
              </div>
            </form>
          </div>

          <div className="hstry-divider" />

          <div className="hstry-right-box">
            <div className="hstry-details-header">RESERVATION DETAILS</div>
            <div className="hstry-details-row"><span>Building:</span> {reservation.buildingName}</div>
            <div className="hstry-details-row"><span>Room:</span> {reservation.roomCode}</div>
            <div className="hstry-details-row"><span>Date:</span> {reservation.reservationDate}</div>
            <div className="hstry-details-row"><span>Current Seat:</span> {reservation.seat}</div>
            <div className="hstry-details-row"><span>Current Time:</span> {reservation.reservationTime}</div>
            <div className="hstry-details-row">
              <span>New Time Slot:</span>{' '}
              {selectedSlot ? selectedSlot.display : <em style={{ color: '#aaa' }}>Not chosen yet</em>}
            </div>
            <div className="hstry-details-row">
              <span>New Seat(s):</span>{' '}
              {selectedSeats.size > 0
                ? Array.from(selectedSeats).join(', ')
                : <em style={{ color: '#aaa', fontWeight: 400 }}>None selected</em>}
            </div>
            <div className="hstry-details-row"><span>Anonymous:</span> {isAnonymous ? 'Yes' : 'No'}</div>
          </div>

        </div>
      </main>
    </>
  );
}

export default UserEditReservation;