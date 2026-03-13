import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';

function UserReservationPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userDayReservations, setUserDayReservations] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState('gokongwei'); // Default building
  const [buildingName, setBuildingName] = useState('Gokongwei Hall');

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(new Date(today));

    // Auto-refresh every minute to update past slots
    const refreshInterval = setInterval(() => {
      setRefresh(prev => prev + 1);
    }, 60000); // 60 seconds

    return () => {
      clearInterval(refreshInterval);
      appendedLinks.forEach((link) => document.head.removeChild(link));
    };
  }, []);

  // Fetch slot data when date changes
  useEffect(() => {
    const fetchSlotData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/slots?date=${formatDateForSlot(currentDate)}&building_id=${selectedBuilding}`);
        // const data = await response.json();
        // setTableData(data.rooms);
        // setUserDayReservations(data.userReservationsCount || 0);
        // setBuildingName(data.buildingName);
        
        // Mock data for now - TODO: DELEETE THIS THING ONCE YALLL AREEE EALLLL DONEEEEE WITH BACKENNNNDDD TRUSTTTT
        const selectedDateString = formatDateForSlot(currentDate);
        
        // Generate random availability data for slots
        const generateSlots = (labId, room) => [
          { labid: labId, room, start: '07:30:00', end: '09:00:00', date: selectedDateString, count: String(Math.floor(Math.random() * 10)), cap: '30', status: Math.random() > 0.8 ? 'restricted' : 'available', userreserved: 'false' },
          { labid: labId, room, start: '09:15:00', end: '10:45:00', date: selectedDateString, count: String(Math.floor(Math.random() * 15)), cap: '30', status: 'available', userreserved: Math.random() > 0.9 ? 'true' : 'false' },
          { labid: labId, room, start: '11:00:00', end: '12:30:00', date: selectedDateString, count: String(Math.floor(Math.random() * 20)), cap: '30', status: 'available', userreserved: 'false' },
          { labid: labId, room, start: '12:45:00', end: '14:15:00', date: selectedDateString, count: String(Math.floor(Math.random() * 10)), cap: '30', status: 'available', userreserved: 'false' },
          { labid: labId, room, start: '14:30:00', end: '16:00:00', date: selectedDateString, count: String(Math.floor(Math.random() * 15)), cap: '30', status: Math.random() > 0.7 ? 'available' : 'full', userreserved: 'false' },
          { labid: labId, room, start: '16:15:00', end: '17:45:00', date: selectedDateString, count: String(Math.floor(Math.random() * 25)), cap: '30', status: Math.random() > 0.5 ? 'available' : 'full', userreserved: 'false' },
          { labid: labId, room, start: '18:00:00', end: '19:30:00', date: selectedDateString, count: String(Math.floor(Math.random() * 10)), cap: '30', status: 'available', userreserved: 'false' }
        ];

        // Building data structure
        const buildingData = {
          gokongwei: {
            name: 'Gokongwei Hall',
            rooms: ['GK210', 'GK211', 'GK302A', 'GK302B', 'GK304A', 'GK304B', 'GK306A', 'GK306B', 'GK404A', 'GK404B']
          },
          andrews: {
            name: 'Andrews Hall',
            rooms: ['AG1706', 'AG1904']
          },
          yuch: {
            name: 'Don Enrique Yuchengco Hall',
            rooms: ['Y602']
          },
          velasco: {
            name: 'Velasco Hall',
            rooms: ['V103', 'V205', 'V206', 'V208A', 'V208B', 'V301', 'V310']
          },
          lasalle: {
            name: 'St. La Salle Hall',
            rooms: ['L212', 'L229', 'L320', 'L335']
          }
        };

        const currentBuilding = buildingData[selectedBuilding] || buildingData.gokongwei;
        setBuildingName(currentBuilding.name);

        const mockData = currentBuilding.rooms.map((room, index) => ({
          room,
          slots: generateSlots(String(index + 1), room)
        }));

        setTableData(mockData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching slot data:', err);
        setError('Failed to load reservation slots. Please try again.');
        setLoading(false);
      }
    };

    fetchSlotData();
  }, [currentDate, refresh, selectedBuilding]);

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
      // TODO: Replace with actual API call
      // const response = await fetch('/api/reservations', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     lab_id: selectedSlot.labid,
      //     reserve_date: selectedSlot.date,
      //     reserve_startTime: selectedSlot.start,
      //     reserve_endTime: selectedSlot.end,
      //     building_id: 1
      //   })
      // });
      // 
      // if (!response.ok) throw new Error('Reservation failed');
      // const data = await response.json();
      
      // Navigate to confirmation page with slot data
      navigate('/user/reservation-confirmation', { 
        state: { 
          lab_id: selectedSlot.labid,
          reserve_date: selectedSlot.date,
          reserve_startTime: selectedSlot.start,
          reserve_endTime: selectedSlot.end,
          building_id: selectedBuilding,
          room: selectedSlot.room
        } 
      });
    } catch (err) {
      console.error('Error creating reservation:', err);
      alert('Failed to create reservation. Please try again.');
    }
  };

  const formatDate = (date) => date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handlePrevDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (currentDate.getTime() <= today.getTime()) {
      return;
    }
    
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);

    if (currentDate.getTime() >= maxDate.getTime()) {
      return;
    }

    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);

  const isPrevDisabled = currentDate.getTime() <= today.getTime();
  const isNextDisabled = currentDate.getTime() >= maxDate.getTime();

  // Format current date for slot data (YYYY-MM-DD)
  const formatDateForSlot = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateString = formatDateForSlot(currentDate);

  // Helper function to check if a time slot has passed
  const isSlotPast = (slotDate, endTime) => {
    const now = new Date();
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
    if (status === 'full') return `${count}/${cap}`;
    // For available slots, show available/total
    return `${parseInt(cap) - parseInt(count)}/${cap}`;
  };

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
          <div className="building-tabs">
            <button 
              className={`building-tab ${selectedBuilding === 'gokongwei' ? 'active' : ''}`}
              onClick={() => setSelectedBuilding('gokongwei')}
            >
              Gokongwei Hall
            </button>
            <button 
              className={`building-tab ${selectedBuilding === 'andrews' ? 'active' : ''}`}
              onClick={() => setSelectedBuilding('andrews')}
            >
              Andrews Hall
            </button>
            <button 
              className={`building-tab ${selectedBuilding === 'yuch' ? 'active' : ''}`}
              onClick={() => setSelectedBuilding('yuch')}
            >
              Yuchengco Hall
            </button>
            <button 
              className={`building-tab ${selectedBuilding === 'velasco' ? 'active' : ''}`}
              onClick={() => setSelectedBuilding('velasco')}
            >
              Velasco Hall
            </button>
            <button 
              className={`building-tab ${selectedBuilding === 'lasalle' ? 'active' : ''}`}
              onClick={() => setSelectedBuilding('lasalle')}
            >
              St. La Salle Hall
            </button>
          </div>
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

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
              Loading reservation slots...
            </div>
          )}

          {error && (
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
                    <th className="mint-header">07:30AM - 09:00AM</th>
                    <th className="mint-header">09:15AM - 10:45AM</th>
                    <th className="mint-header">11:00AM - 12:30PM</th>
                    <th className="mint-header">12:45PM - 02:15PM</th>
                    <th className="mint-header">02:30PM - 04:00PM</th>
                    <th className="mint-header">04:15PM - 05:45PM</th>
                    <th className="mint-header">06:00PM - 07:30PM</th>
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
