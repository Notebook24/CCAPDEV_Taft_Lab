import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import "../../style/user_css/UserReservationPage.css";
import API_BASE_URL from '../../config/api';

// reservation page where users can view available slots and make reservations
function UserReservationPage() {
  const navigate = useNavigate();

  /// midnight Manila time for date comparisons and restrictions
  const getTodayAtMidnight = () => {
    const now = new Date();
    const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    manilaTime.setHours(0, 0, 0, 0);
    return manilaTime;
  };

  // states
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
  const [reservedSlotKeys, setReservedSlotKeys] = useState(new Set());

  // time slots
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

  // helper functions
  const formatDateForSlot = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // MODIFIED: generateSlotsFromReservations to account for closed seats
  const generateSlotsFromReservations = (lab, dateStr) => {
    // Count closed seats
    const closedSeatsCount = (lab.seats || []).filter(seat => seat.status === 'Closed').length;
    const effectiveCapacity = lab.capacity - closedSeatsCount;
    
    return TIME_SLOTS.map((slot) => {
      const reservedCount = (lab.reservations || []).filter(res => {
        const resStart = res.reserve_startTime;
        const resEnd = res.reserve_endTime;
        return (
          (res.status === 'Ongoing' || res.status === 'Completed' || res.status === 'Checked') &&
          resStart < slot.end && resEnd > slot.start
        );
      }).reduce((sum, res) => sum + (res.seat_id?.length || 1), 0);

      const availableSeats = effectiveCapacity - reservedCount;
      return {
        labid: lab.lab_id || 'unknown',
        room: lab.room,
        start: slot.start,
        end: slot.end,
        date: dateStr,
        count: String(reservedCount),
        cap: String(effectiveCapacity),
        status: availableSeats <= 0 ? 'full' : 'available',
        userreserved: 'false'
      };
    });
  };

  // checks if a slot is in the past based on current Manila time
  const isSlotPast = (slotDate, startTime) => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const todayManila = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    if (slotDate !== todayManila) return false;
    const currentTimeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0') + ':' + now.getSeconds().toString().padStart(2,'0');
    return currentTimeStr >= startTime;
  };

  // determines the display status of a slot, marking it as 'past' if it's in the past, otherwise showing its original status
  const getSlotStatus = (originalStatus, slotDate, startTime) => {
    if (isSlotPast(slotDate, startTime)) return 'past';
    return originalStatus;
  };

  // determines the text to display in a slot cell based on its status and reservation count
  const getCellDisplay = (status, count, cap) => {
    if (status === 'past') 
      return 'Past';
    if (status === 'restricted') 
      return 'N/A';
    return `${count}/${cap}`;
  };

  useEffect(() => {
    // Already correct - checks sessionStorage first then localStorage
    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
    if (!userId) 
      return;

    // Fetch user's active reservations to determine which time slots should be blocked due to existing reservations
    const fetchActiveReservations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/${userId}/reservation-history`); // Adjusted endpoint to fetch all reservations for the user
        if (!res.ok) 
          return;
        // We only care about active and checked-in reservations for blocking time slots
        const data = await res.json();
        const keys = new Set();

        // Process each reservation to extract the time slots that should be blocked
        data.forEach(r => {
          if (r.status !== 'Active' && r.status !== 'Checked') 
            return;

          const timePart = r.reservationTime || '';
          const startMatch = timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);

          // If the reservation time format is unexpected, skip this reservation
          if (!startMatch) 
            return;

          let hh = parseInt(startMatch[1], 10);
          const mm = startMatch[2];
          const meridiem = startMatch[3].toUpperCase();

          // Convert to 24-hour format
          if (meridiem === 'PM' && hh !== 12) 
            hh += 12;
          if (meridiem === 'AM' && hh === 12) 
            hh = 0;

          const startTime24 = hh.toString().padStart(2, '0') + ':' + mm + ':00';
          const reservDateManila = new Date(r.reservationDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
          keys.add(`${startTime24}|${reservDateManila}`);
        });

        setReservedSlotKeys(keys);

      } catch (err) {}
    };
    fetchActiveReservations();
  }, [refresh]);

  // fetches buildings on component mount and sets up an interval to refresh the building list every minute
  useEffect(() => {
    const refreshInterval = setInterval(() => setRefresh(prev => prev + 1), 60000);
    const fetchBuildings = async () => { // Fetch buildings from backend API
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin`);
        if (!response.ok) 
          throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        // validate response format and ensure we have an array of buildings
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

  // fetches reservation slots whenever the selected building, current date, or refresh state changes
  useEffect(() => {
    if (!selectedBuildingId) 
      return;
    // fetch reservation slots for the selected building and date from backend API
    const fetchSlotData = async () => {
      setLoading(true);
      setError(null);

      try {
        const dateStr = formatDateForSlot(currentDate);
        const response = await fetch(`${API_BASE_URL}/api/user/reservation/${selectedBuildingId}?date=${dateStr}`);
        
        if (!response.ok) 
          throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (!data.result || !Array.isArray(data.result)) 
          throw new Error('Invalid response format');

        // transform backend data into format suitable for table display, to calculating available slots based on reservations and closed seats
        const mockData = data.result.map((lab) => ({
          room: lab.room,
          labId: lab.lab_id || 'unknown',
          capacity: lab.capacity,
          seats: lab.seats || [],
          reservations: lab.reservations || [],
          slots: generateSlotsFromReservations(lab, dateStr)

        }));
        // mock data generation for testing without backend
        setTableData(mockData);
        setLoading(false);
      } catch (err) {
        setError(`Failed to load reservation slots: ${err.message}`);
        setLoading(false);
      }
    };
    fetchSlotData();
  }, [currentDate, refresh, selectedBuildingId]);

  // handles cell click to select a slot for reservation, with checks for existing reservations, slot availability, and time conflicts
  const handleCellClick = (slot) => {
    const actualStatus = getSlotStatus(slot.status, slot.date, slot.start);

    // validation checks before allowing reservation
    if (slot.userreserved === 'true') { 
      alert('You have already reserved this slot.'); 
      return; 
    }

    // Check if user has reached daily reservation limit of 3
    if (userDayReservations >= 3) { 
      alert('You have reached the maximum of 3 reservations per day.'); 
      return; 
    }

    // Check if the slot is actually available (not just based on status, but also considering user's existing reservations that may block this slot)
    // other circumstances include if a user tries to click an available slot that overlaps with another reservation they have in a different building/lab, 
    // or if the slot is marked as available but is actually full due to other users' reservations that haven't been reflected in the status yet
    if (actualStatus !== 'available') { 
      alert('This slot cannot be reserved.'); 
      return; 
    }

    const slotKey = `${slot.start}|${slot.date}`;
    // Check if the user already has a reservation in this time slot in another lab or building
    if (reservedSlotKeys.has(slotKey)) {
      alert('You already have a reservation in this time slot in another lab or building.');
      return;
    }
    setSelectedSlot(slot);
    setModalVisible(true);
  };

  // hides the reservation confirmation modal and resets the selected slot
  const hideModal = () => { setModalVisible(false); setSelectedSlot(null); };

  // if all checks pass, navigate to the reservation confirmation page with the selected slot details passed as state
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

  const formatDate = (date) => date.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' });

  // presses previous day with restrictions to prevent navigating to past dates or more than 7 days in the future
  const handlePrevDay = () => {
    const today = getTodayAtMidnight();
    const newDate = new Date(currentDate);
  
    // go back one day
    newDate.setDate(newDate.getDate() - 1);
    
    if (newDate.getTime() < today.getTime()) 
      return;

    setCurrentDate(newDate);
  };

  // pressing next day button will not allow users to navigate beyond the 7-day reservation window set by DLSU ITS policies, based on Manila time
  const handleNextDay = () => {
    const today = getTodayAtMidnight();
    const maxDate = new Date(today);

    // only up to 7 days in the future for users
    maxDate.setDate(maxDate.getDate() + 7);
    
    if (currentDate.getTime() >= maxDate.getTime()) 
      return;

    const newDate = new Date(currentDate);
    // go forward one day
    newDate.setDate(newDate.getDate() + 1);

    setCurrentDate(newDate);
  };

  // updates and refreshes the reservation data 
  const today = getTodayAtMidnight();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);
  const isPrevDisabled = currentDate.getTime() <= today.getTime();
  const isNextDisabled = currentDate.getTime() >= maxDate.getTime();

  //renders
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
                <button key={building._id}
                  className={`building-tab ${selectedBuildingId === building._id ? 'active' : ''}`}
                  onClick={() => { setSelectedBuildingId(building._id); setBuildingName(building.building_name); }}>
                  {building.building_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="timetable">
          <h2>
            {buildingName} —&nbsp;
            <span className="date-nav">
              <button type="button" className="date-btn" onClick={handlePrevDay} disabled={isPrevDisabled}>&lt;</button>
              <span>{formatDate(currentDate)}</span>
              <button type="button" className="date-btn" onClick={handleNextDay} disabled={isNextDisabled}>&gt;</button>
            </span>
          </h2>
          <p style={{ color: '#666', marginBottom: '8px', fontSize: '14px' }}>Reservations today: <strong>{userDayReservations}</strong></p>

          {buildingsLoading && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading buildings...</div>}
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
                        const actualStatus = getSlotStatus(slot.status, slot.date, slot.start);
                        const displayText = getCellDisplay(actualStatus, slot.count, slot.cap);
                        return (
                          <td key={idx} className={`cell ${actualStatus}`} onClick={() => handleCellClick(slot)}>
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
          <div className="backwrap"><Link to="/user" className="btn back">Back</Link></div>
        </section>
      </main>

      {modalVisible && selectedSlot && (
        <div className="modal-backdrop" style={{ display: 'flex' }} onClick={hideModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reserve Slot</h3>
            <p>Confirm your reservation details below.</p>
            <form onSubmit={handleConfirmReservation}>
              <div className="form-row"><label>Room</label><div className="readonly">{selectedSlot.room}</div></div>
              <div className="form-row"><label>Time</label><div className="readonly">{selectedSlot.start} – {selectedSlot.end}</div></div>
              <div className="form-row">
                <label>Available Seats</label>
                <div className="readonly">{parseInt(selectedSlot.cap) - parseInt(selectedSlot.count)} of {selectedSlot.cap} seats free</div>
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