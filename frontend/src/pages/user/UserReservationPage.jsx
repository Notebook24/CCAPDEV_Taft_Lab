import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import "../../style/user_css/UserReservationPage.css";

function UserReservationPage() {
  const navigate = useNavigate();
  
  const getTodayAtMidnight = () => {
    const now = new Date();
    const laTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    laTime.setHours(0, 0, 0, 0);
    return laTime;
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

  // Define time slots
  const TIME_SLOTS = [
    { start: '07:30:00', end: '09:00:00', display: '07:30AM - 09:00AM' },
    { start: '09:15:00', end: '10:45:00', display: '09:15AM - 10:45AM' },
    { start: '11:00:00', end: '12:30:00', display: '11:00AM - 12:30PM' },
    { start: '12:45:00', end: '14:15:00', display: '12:45PM - 02:15PM' },
    { start: '14:30:00', end: '16:00:00', display: '02:30PM - 04:00PM' },
    { start: '16:15:00', end: '17:45:00', display: '04:15PM - 05:45PM' },
    { start: '18:00:00', end: '19:30:00', display: '06:00PM - 07:30PM' }
  ];

  // Helper function to format date for API calls (YYYY-MM-DD)
  const formatDateForSlot = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to generate slots from lab reservations
  const generateSlotsFromReservations = (lab, dateStr) => {
    return TIME_SLOTS.map((slot) => {
      // Count how many seats are reserved in this time slot
      const reservedCount = (lab.reservations || []).filter(res => {
        const resStart = res.reserve_startTime;
        const resEnd = res.reserve_endTime;
        // Check if times overlap
        return resStart < slot.end && resEnd > slot.start;
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

  // Helper function to check if a time slot has passed
  const isSlotPast = (slotDate, endTime) => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const slotDateTime = new Date(slotDate);
    const [hours, minutes] = endTime.split(':');
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return now > slotDateTime;
  };

  // Helper function to get the actual status of a slot
  const getSlotStatus = (originalStatus, slotDate, endTime) => {
    if (isSlotPast(slotDate, endTime)) {
      return 'past';
    }
    return originalStatus;
  };

  // Helper function to get cell display text
  const getCellDisplay = (status, count, cap) => {
    if (status === 'past') return 'Past';
    if (status === 'restricted') return 'Restricted';
    // Show occupied/total format for all cases (0/16, 1/16, 16/16, etc)
    return `${count}/${cap}`;
  };

  useEffect(() => {
    const stylesheetUrls = ['/assets/style/user_css/user_reservation_page.css'];

    const appendedLinks = [];
    stylesheetUrls.forEach((url) => {
      const existing = document.querySelector(`link[href="${url}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
        appendedLinks.push(link);
      }
    });

    // Auto-refresh every minute to update past slots 
    const refreshInterval = setInterval(() => {
      setRefresh(prev => prev + 1);
    }, 60000); // 60 seconds

    // Fetch buildings on mount
    const fetchBuildings = async () => {
      try {
        console.log('Fetching buildings from: http://localhost:3000/admin');
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch('http://localhost:3000/admin', { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Buildings fetched:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          setBuildings(data);
          setSelectedBuildingId(data[0]._id);
          setBuildingName(data[0].building_name);
        } else {
          throw new Error('No buildings found in database');
        }
        setBuildingsLoading(false);
      } catch (err) {
        console.error('Error fetching buildings:', err);
        setError(`Failed to load buildings: ${err.message}`);
        setBuildingsLoading(false);
      }
    };

    fetchBuildings();

    return () => {
      clearInterval(refreshInterval);
      appendedLinks.forEach((link) => document.head.removeChild(link));
    };
  }, []);

  // Fetch slot data when date or building changes
  useEffect(() => {
    // Don't fetch if no building selected yet
    if (!selectedBuildingId) {
      console.log('No building selected yet');
      return;
    }

    const fetchSlotData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const dateStr = formatDateForSlot(currentDate);
        const url = `http://localhost:3000/user/reservation/${selectedBuildingId}?date=${dateStr}`;
        
        console.log('Fetching rooms from:', url);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!data.result || !Array.isArray(data.result)) {
          throw new Error('Invalid response format: expected result array');
        }
        
        // Transform the result to match table format
        const mockData = data.result.map((lab) => ({
          room: lab.room,
          labId: lab.lab_id || 'unknown',
          capacity: lab.capacity,
          slots: generateSlotsFromReservations(lab, dateStr)
        }));

        console.log('Transformed data:', mockData);
        setTableData(mockData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching slot data:', err);
        
        if (err.name === 'AbortError') {
          setError('Backend server is not responding (timeout). Make sure the server is running on port 3000.');
        } else {
          setError(`Failed to load reservation slots: ${err.message}`);
        }
        setLoading(false);
      }
    };

    fetchSlotData();
  }, [currentDate, refresh, selectedBuildingId]);

  const handleCellClick = (slot) => {
    const actualStatus = getSlotStatus(slot.status, slot.date, slot.end);
    const isUserReserved = slot.userreserved === 'true';

    if (isUserReserved) {
      alert("You have already reserved this slot.");
      return;
    }

    if (userDayReservations >= 3) {
      alert("You have reached the maximum of 3 reservations per day.");
      return;
    }

    if (actualStatus !== 'available') {
      alert("This slot cannot be reserved.");
      return;
    }

    setSelectedSlot(slot);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setSelectedSlot(null);
  };

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    
    if (!selectedSlot) return;

    try {
      // Navigate to confirmation page with slot data
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
    } catch (err) {
      console.error('Error creating reservation:', err);
      alert('Failed to create reservation. Please try again.');
    }
  };

  const formatDate = (date) => date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handlePrevDay = () => {
    const today = getTodayAtMidnight();
    
    // Don't go back if already at today or before
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    
    if (newDate.getTime() < today.getTime()) {
      return;
    }
    
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const today = getTodayAtMidnight();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);

    if (currentDate.getTime() >= maxDate.getTime()) {
      return;
    }

    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const today = getTodayAtMidnight();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);

  const isPrevDisabled = currentDate.getTime() < today.getTime();
  const isNextDisabled = currentDate.getTime() >= maxDate.getTime();

  return (
    <>
      <UserNavbar />
      
      <main className="container">
        <section className="guidelines">
          <h2>Reservation Guidelines</h2>
          <ol>
            <li>DLSU students can only book reservation slots for the <strong>next 7 days</strong>.</li>
            <li>Reservation service hours adhere to DLSU ITS policies, where computer labs are operational from <strong> 07:30AM to 07:30PM </strong>.</li>
            <li>The <strong> green-colored slots </strong> indicate a free, available slot for DLSU student to use. However, take note of the capacity.</li>
            <li>The color-coded legends represent the status of a slot. <strong> Full and restricted slots cannot be reserved </strong> by students when prompted. </li>
            <li>After selecting slot/s, DLSU students must enter their <strong> registered DLSU email address and password </strong> to formally book the slot. </li>
            <li>DLSU students may <strong> reschedule their slot</strong>, provided that the new, future-dated time slot offers free availability as well.</li>
            <li>DLSU students may also <strong> cancel </strong> their reserved slot <strong> before the schedule of their reservation</strong>. This is strongly advised to avoid penalties.</li>
            <li> If you fail to arrive <strong> within 10 minutes </strong> after your scheduled reservation time, your reservation will be <strong> automatically cancelled</strong>. The entire reservation slot is forfeited and cannot be reinstated.</li>
          </ol>
        </section>

        {/* Building Selector */}
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
            {buildingName} —
            <span className="date-nav" aria-label="Reservation date selector">
              <button type="button" className="date-btn" id="prevDay" onClick={handlePrevDay} disabled={isPrevDisabled} aria-label="Previous day">&lt;</button>
              <span id="selectedDate">{formatDate(currentDate)}</span>
              <button type="button" className="date-btn" id="nextDay" onClick={handleNextDay} disabled={isNextDisabled} aria-label="Next day">&gt;</button>
            </span>
          </h2>
          <p style={{color: '#666', marginBottom: '10px'}}>Reservations today:   <strong>{userDayReservations}</strong></p>

          {buildingsLoading && (
            <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
              Loading buildings first...
            </div>
          )}

          {!buildingsLoading && error && buildings.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', fontSize: '16px', color: '#d9534f', background: '#fdeaea', borderRadius: '8px', margin: '20px 0' }}>
              {error}
            </div>
          )}

          {!buildingsLoading && loading && (
            <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
              Loading reservation slots...
            </div>
          )}

          {error && !buildingsLoading && buildings.length > 0 && (
            <div style={{ textAlign: 'center', padding: '20px', fontSize: '16px', color: '#d9534f', background: '#fdeaea', borderRadius: '8px', margin: '20px 0' }}>
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="table-wrap">
              <table className="rsv-table" id="rsvTable">
                <thead>
                  <tr>
                    <th className="mint-header">ROOM</th>
                    {TIME_SLOTS.map((slot, idx) => (
                      <th key={idx} className="mint-header">{slot.display}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.room}>
                      <td className="roomcol">{row.room}</td>
                      {row.slots.map((slot, idx) => {
                        const actualStatus = getSlotStatus(slot.status, slot.date, slot.end);
                        const displayText = getCellDisplay(actualStatus, slot.count, slot.cap);
                        
                        return (
                          <td 
                            key={idx}
                            className={`cell ${actualStatus}`} 
                            onClick={() => handleCellClick(slot)}
                            style={{ cursor: actualStatus === 'available' ? 'pointer' : 'default' }}
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
            <span className="legend-box available"></span> Available
            <span className="legend-box full"></span> Full
            <span className="legend-box restricted"></span> Restricted
            <span className="legend-box past"></span> Past
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
            <p>Confirm reservation</p>

            <form onSubmit={handleConfirmReservation}>
              <div className="form-row">
                <label>Room</label>
                <div className="readonly">{selectedSlot.room}</div>
              </div>

              <div className="form-row">
                <label>Time</label>
                <div className="readonly">{selectedSlot.start} - {selectedSlot.end}</div>
              </div>

              <div className="form-row">
                <label>Slots</label>
                <div className="readonly">
                  {parseInt(selectedSlot.cap) - parseInt(selectedSlot.count)} slots available
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn" onClick={hideModal}>Cancel</button>
                <button type="submit" className="btn primary">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default UserReservationPage;
