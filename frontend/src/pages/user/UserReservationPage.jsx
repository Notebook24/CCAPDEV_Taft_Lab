import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import "../../style/user_css/UserReservationPage.css";
import API_BASE_URL from '../../config/api';

function UserReservationPage() {
  const navigate = useNavigate();

  const getTodayAtMidnight = () => {
    const now = new Date();
    const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    manilaTime.setHours(0, 0, 0, 0);
    return manilaTime;
  };

  const [currentDate, setCurrentDate] = useState(getTodayAtMidnight());
  const [userDayReservations, setUserDayReservations] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [buildingName, setBuildingName] = useState('');

  // ── Track the user's active reservation time slots ────────────────────────
  // Stores a Set of "startTime|date" strings for slots already reserved by this
  // user, so we can block reserving another lab in the same time slot.
  const [reservedSlotKeys, setReservedSlotKeys] = useState(new Set());

  // ── TIME SLOTS ──────────────────────────────────────────────────────────────
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

  // ── HELPERS ─────────────────────────────────────────────────────────────────
  const formatDateForSlot = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateSlotsFromReservations = (lab, dateStr) => {
    return TIME_SLOTS.map((slot) => {
      const reservedCount = (lab.reservations || []).filter(res => {
        const resStart = res.reserve_startTime;
        const resEnd = res.reserve_endTime;
        return (
          (res.status === 'Ongoing' || res.status === 'Completed' || res.status === 'Checked') &&
          resStart < slot.end && resEnd > slot.start
        );
      }).reduce((sum, res) => sum + (res.seat_id?.length || 1), 0);

      const availableSeats = lab.capacity - reservedCount;

      return {
        labid: lab.lab_id || 'unknown',
        room: lab.room,
        start: slot.start,
        end: slot.end,
        date: dateStr,
        count: String(reservedCount),
        cap: String(lab.capacity),
        status: availableSeats <= 0 ? 'full' : 'available',
        userreserved: 'false'
      };
    });
  };

  // ── FIX 1: isSlotPast now checks START time, not end time ──────────────────
  // A slot becomes "Past" (grey, unclickable) the moment its start time arrives,
  // because students — unlike walk-in admin reservations — cannot reserve a slot
  // that has already started.
  const isSlotPast = (slotDate, startTime) => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const todayManila = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    // Only apply past logic when viewing today; future dates are never past
    if (slotDate !== todayManila) return false;
    const currentTimeStr =
      now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0') + ':' +
      now.getSeconds().toString().padStart(2, '0');
    return currentTimeStr >= startTime;
  };

  // getSlotStatus and handleCellClick both receive slot.start (not slot.end)
  const getSlotStatus = (originalStatus, slotDate, startTime) => {
    if (isSlotPast(slotDate, startTime)) return 'past';
    return originalStatus;
  };

  const getCellDisplay = (status, count, cap) => {
    if (status === 'past') return 'Past';
    if (status === 'restricted') return 'N/A';
    return `${count}/${cap}`;
  };

  // ── FIX 2: Fetch the user's active reservations ────────────────────────────
  // Build a Set of "startTime|YYYY-MM-DD" keys for all active (Ongoing/Checked)
  // reservations. When a cell's key is in this set, the slot is already taken
  // by the user in another lab/building so it cannot be reserved again.
  useEffect(() => {
    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
    if (!userId) return;

    const fetchActiveReservations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/${userId}/reservation-history`);
        if (!res.ok) return;
        const data = await res.json();

        const keys = new Set();
        data.forEach(r => {
          if (r.status !== 'Active' && r.status !== 'Checked') return;

          // reservationTime format: "08:00 AM - 08:30 AM"
          // We need the raw 24h start time. The backend returns reservationTime
          // as a 12h string, but we also have the raw start time available via
          // the reservation history endpoint's reservationTime field.
          // We parse it back to 24h to build the key.
          const timePart = r.reservationTime || '';
          const startMatch = timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (!startMatch) return;

          let hh = parseInt(startMatch[1], 10);
          const mm = startMatch[2];
          const meridiem = startMatch[3].toUpperCase();
          if (meridiem === 'PM' && hh !== 12) hh += 12;
          if (meridiem === 'AM' && hh === 12) hh = 0;
          const startTime24 = hh.toString().padStart(2, '0') + ':' + mm + ':00';

          // reservationDate comes as "March 21, 2026" — convert to YYYY-MM-DD
          const reservDateManila = new Date(r.reservationDate)
            .toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

          keys.add(`${startTime24}|${reservDateManila}`);
        });

        setReservedSlotKeys(keys);
      } catch (err) {
        // Fail silently — don't block the page if this check fails
      }
    };

    fetchActiveReservations();
  }, [refresh]);

  // ── FETCH BUILDINGS ──────────────────────────────────────────────────────────
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setRefresh(prev => prev + 1);
    }, 60000);

    const fetchBuildings = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await fetch('http://localhost:3000/admin', { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setBuildings(data);
          setSelectedBuildingId(data[0]._id);
          setBuildingName(data[0].building_name);
        } else {
          throw new Error('No buildings found in database');
        }
        setBuildingsLoading(false);
      } catch (err) {
        setError(`Failed to load buildings: ${err.message}`);
        setBuildingsLoading(false);
      }
    };

    fetchBuildings();
    return () => clearInterval(refreshInterval);
  }, []);

  // ── FETCH SLOT DATA ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedBuildingId) return;

    const fetchSlotData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dateStr = formatDateForSlot(currentDate);
        const url = `http://localhost:3000/user/reservation/${selectedBuildingId}?date=${dateStr}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.result || !Array.isArray(data.result)) throw new Error('Invalid response format');

        const mockData = data.result.map((lab) => ({
          room: lab.room,
          labId: lab.lab_id || 'unknown',
          capacity: lab.capacity,
          slots: generateSlotsFromReservations(lab, dateStr)
        }));
        setTableData(mockData);
        setLoading(false);
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Server not responding. Make sure it is running on port 3000.');
        } else {
          setError(`Failed to load reservation slots: ${err.message}`);
        }
        setLoading(false);
      }
    };

    fetchSlotData();
  }, [currentDate, refresh, selectedBuildingId]);

  // ── CELL CLICK ───────────────────────────────────────────────────────────────
  const handleCellClick = (slot) => {
    // FIX 1: pass slot.start so started slots are treated as past
    const actualStatus = getSlotStatus(slot.status, slot.date, slot.start);

    if (slot.userreserved === 'true') { alert('You have already reserved this slot.'); return; }
    if (userDayReservations >= 3) { alert('You have reached the maximum of 3 reservations per day.'); return; }
    if (actualStatus !== 'available') { alert('This slot cannot be reserved.'); return; }

    // FIX 2: block if the user already has a reservation in this same time slot
    // (regardless of lab or building)
    const slotKey = `${slot.start}|${slot.date}`;
    if (reservedSlotKeys.has(slotKey)) {
      alert('You already have a reservation in this time slot in another lab or building. Please cancel that reservation first if you wish to reserve here instead.');
      return;
    }

    setSelectedSlot(slot);
    setModalVisible(true);
  };

  const hideModal = () => { setModalVisible(false); setSelectedSlot(null); };

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    navigate('/user/reservation-confirmation', {
      state: {
        lab_id: selectedSlot.labid,
        reserve_date: selectedSlot.date,
        reserve_startTime: selectedSlot.start,
        reserve_endTime: selectedSlot.end,
        building_id: selectedBuildingId,
        room: selectedSlot.room
      }
    });
  };

  const formatDate = (date) => date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handlePrevDay = () => {
    const today = getTodayAtMidnight();
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    if (newDate.getTime() < today.getTime()) return;
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const today = getTodayAtMidnight();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);
    if (currentDate.getTime() >= maxDate.getTime()) return;
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const today = getTodayAtMidnight();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);
  const isPrevDisabled = currentDate.getTime() <= today.getTime();
  const isNextDisabled = currentDate.getTime() >= maxDate.getTime();

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <>
      <UserNavbar />

      <main className="container">

        <section className="guidelines">
          <h2>Reservation Guidelines</h2>
          <ol>
            <li>DLSU students can only book reservation slots for the <strong>next 7 days</strong>.</li>
            <li>Reservation service hours adhere to DLSU ITS policies, where computer labs are operational from <strong>07:30AM to 07:30PM</strong>.</li>
            <li>The <strong>green-colored slots</strong> indicate a free, available slot. Take note of the capacity shown.</li>
            <li>Full and restricted slots <strong>cannot be reserved</strong> by students when prompted.</li>
            <li>After selecting a slot, you must enter your <strong>registered DLSU email and password</strong> to formally book it.</li>
            <li>You may <strong>reschedule your slot</strong> provided the new time slot has available seats.</li>
            <li><strong>Within 10 minutes</strong> of your scheduled time, your reservation can be <strong>cancelled if you are yet to Check-In your reservation</strong>.</li>
          </ol>
        </section>

        <div className="building-selector">
          <h2>Select Building</h2>
          {buildingsLoading ? (
            <p style={{ color: '#666' }}>Loading buildings...</p>
          ) : error && buildings.length === 0 ? (
            <p style={{ color: '#d9534f' }}>Error: {error}</p>
          ) : (
            <div className="building-tabs">
              {buildings.map((building) => (
                <button
                  key={building._id}
                  className={`building-tab ${selectedBuildingId === building._id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedBuildingId(building._id);
                    setBuildingName(building.building_name);
                  }}
                >
                  {building.building_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="timetable">
          <h2>
            {buildingName} —&nbsp;
            <span className="date-nav" aria-label="Reservation date selector">
              <button type="button" className="date-btn" onClick={handlePrevDay} disabled={isPrevDisabled} aria-label="Previous day">&lt;</button>
              <span>{formatDate(currentDate)}</span>
              <button type="button" className="date-btn" onClick={handleNextDay} disabled={isNextDisabled} aria-label="Next day">&gt;</button>
            </span>
          </h2>

          <p style={{ color: '#666', marginBottom: '8px', fontSize: '14px' }}>
            Reservations today: <strong>{userDayReservations}</strong>
          </p>

          {buildingsLoading && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading buildings...</div>}
          {!buildingsLoading && error && buildings.length === 0 && (
            <div style={{ padding: '16px', color: '#d9534f', background: '#fdeaea', borderRadius: '8px' }}>{error}</div>
          )}
          {!buildingsLoading && loading && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading reservation slots...</div>}
          {error && !buildingsLoading && buildings.length > 0 && (
            <div style={{ padding: '16px', color: '#d9534f', background: '#fdeaea', borderRadius: '8px', marginBottom: '12px' }}>{error}</div>
          )}

          {!loading && !error && (
            <div className="scroll-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
              Scroll to see all time slots
            </div>
          )}

          {!loading && !error && (
            <div className="table-wrap">
              <table className="rsv-table">
                <thead>
                  <tr>
                    <th className="room-header mint-header">ROOM</th>
                    {TIME_SLOTS.map((slot, idx) => (
                      <th key={idx} className="mint-header">
                        <span style={{ display: 'block', fontWeight: 700 }}>{slot.display}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.room}>
                      <td className="roomcol">{row.room}</td>
                      {row.slots.map((slot, idx) => {
                        // FIX 1: pass slot.start so started slots render as 'past'
                        const actualStatus = getSlotStatus(slot.status, slot.date, slot.start);
                        const displayText = getCellDisplay(actualStatus, slot.count, slot.cap);

                        return (
                          <td
                            key={idx}
                            className={`cell ${actualStatus}`}
                            onClick={() => handleCellClick(slot)}
                          >
                            <div className="cell-inner">{displayText}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="legend">
            <span><span className="legend-box available"></span>Available</span>
            <span><span className="legend-box full"></span>Full</span>
            <span><span className="legend-box restricted"></span>Restricted</span>
            <span><span className="legend-box past"></span>Past</span>
          </div>

          <div className="backwrap">
            <Link to="/user" className="btn back">Back</Link>
          </div>
        </section>
      </main>

      {modalVisible && selectedSlot && (
        <div className="modal-backdrop" style={{ display: 'flex' }} onClick={hideModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reserve Slot</h3>
            <p>Confirm your reservation details below.</p>
            <form onSubmit={handleConfirmReservation}>
              <div className="form-row">
                <label>Room</label>
                <div className="readonly">{selectedSlot.room}</div>
              </div>
              <div className="form-row">
                <label>Time</label>
                <div className="readonly">{selectedSlot.start} – {selectedSlot.end}</div>
              </div>
              <div className="form-row">
                <label>Available Seats</label>
                <div className="readonly">
                  {parseInt(selectedSlot.cap) - parseInt(selectedSlot.count)} of {selectedSlot.cap} seats free
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={hideModal}>Cancel</button>
                <button type="submit" className="btn primary">Confirm →</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default UserReservationPage;