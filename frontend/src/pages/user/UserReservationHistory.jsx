import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import ReservationCard from '../../components/ReservationCard';
import "../../style/user_css/UserReservationHistory.css";
import ls229Indoor from '../../assets/images/LS_229_indoor_1.jpg';
import v103Indoor from '../../assets/images/V_103_indoor_3.jpg';
import ag1904Indoor from '../../assets/images/AG_1904_indoor_1.jpg';
import gk304bIndoor from '../../assets/images/GK_304B_indoor_1.jpg';
import j212Indoor from '../../assets/images/J_212_indoor_1.jpg';
import y602Indoor from '../../assets/images/Y_602_indoor_1.jpg';

// Image mapping for buildings - using imported images
const buildingImageMap = {
  'Gokongwei Hall': gk304bIndoor,
  'St. La Salle Hall': ls229Indoor,
  'Velasco Hall': v103Indoor,
  'Br. Andrew Gonzales Hall': ag1904Indoor,
  'Jimenez Hall': j212Indoor,
  'Yuchengco Hall': y602Indoor
};

function UserReservationHistory() {
  const navigate = useNavigate(); 
  const [filter, setFilter] = useState('All');
  const [currentResID, setCurrentResID] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState('07:30:00|09:00:00');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reservation history from backend
  useEffect(() => {
    const fetchReservationHistory = async () => {
      try {
        setLoading(true);
        // Get user_id from session or localStorage
        const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
        
        if (!userId) {
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:3000/user/${userId}/reservation-history`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch reservation history');
        }

        const data = await response.json();
        
        // Add image mapping to each reservation
        const reservationsWithImages = data.map(res => ({
          ...res,
          image: buildingImageMap[res.buildingName] || null
        }));

        setReservations(reservationsWithImages);
        setError(null);
      } catch (err) {
        console.error('Error fetching reservation history:', err);
        setError(err.message);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReservationHistory();
  }, [navigate]);

  const applyFilter = () => {
    // Filter logic is handled by the filteredReservations computed value
  };

  const filteredReservations = filter === 'All' 
    ? reservations 
    : reservations.filter(res => res.status === filter);

  const openReschedModal = (id) => {
    setCurrentResID(id);
    document.getElementById('reschedModal').style.display = 'flex';
  };

  const closeReschedModal = () => {
    document.getElementById('reschedModal').style.display = 'none';
  };

  const openConfirmModal = (id) => {
    setCurrentResID(id);
    document.getElementById('confirmModal').style.display = 'flex';
  };

  const closeConfirmModal = () => {
    document.getElementById('confirmModal').style.display = 'none';
  };



  const confirmReservation = async () => {
    try {
      const response = await fetch(`http://localhost:3000/user/reservation-history/${currentResID}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check-in');
      }

      alert('Reservation confirmed successfully! Enjoy using the lab :>');
      closeConfirmModal();
      
      // Refresh the reservation list
      const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
      const refreshResponse = await fetch(`http://localhost:3000/user/${userId}/reservation-history`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const reservationsWithImages = data.map(res => ({
          ...res,
          image: buildingImageMap[res.buildingName] || null
        }));
        setReservations(reservationsWithImages);
      }
    } catch (err) {
      console.error('Error checking in:', err);
      alert('Failed to check-in: ' + err.message);
    }
  };



  const handleReschedConfirm = async () => {
    try {
      const [startTime, endTime] = selectedSlot.split('|');
      const currentReservation = reservations.find(r => r.id === currentResID);
      
      const response = await fetch(`http://localhost:3000/user/reservation-history/${currentResID}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reserve_startTime: startTime,
          reserve_endTime: endTime,
          date_reserved: currentReservation.reservationDate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule reservation');
      }

      alert('Reservation rescheduled successfully!');
      closeReschedModal();
      
      // Refresh the reservation list
      const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
      const refreshResponse = await fetch(`http://localhost:3000/user/${userId}/reservation-history`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const reservationsWithImages = data.map(res => ({
          ...res,
          image: buildingImageMap[res.buildingName] || null
        }));
        setReservations(reservationsWithImages);
      }
    } catch (err) {
      console.error('Error rescheduling:', err);
      alert('Failed to reschedule: ' + err.message);
    }
  };

  const openCancelModal = (id) => {
    setCurrentResID(id);
    document.getElementById('cancelModal').style.display = 'flex';
  };

  const closeCancelModal = () => {
    document.getElementById('cancelModal').style.display = 'none';
  };

  const confirmCancellation = async () => {
    try {
      const response = await fetch(`http://localhost:3000/user/reservation-history/${currentResID}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel reservation');
      }

      alert('Reservation cancelled successfully!');
      closeCancelModal();
      
      // Refresh the reservation list
      const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
      const refreshResponse = await fetch(`http://localhost:3000/user/${userId}/reservation-history`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const reservationsWithImages = data.map(res => ({
          ...res,
          image: buildingImageMap[res.buildingName] || null
        }));
        setReservations(reservationsWithImages);
      }
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      alert('Failed to cancel: ' + err.message);
    }
  };

  const currentReservation = reservations.find(r => r.id === currentResID);

  return (
    <div className="user-reservation-history">
      <UserNavbar />

      <div className="title-bar">
        <h1>My Reservations</h1>
      </div>

      <div id="reservationListView">
        <div className="filter-row">
          <select 
            id="filterSelect" 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Checked">Checked</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onClick={applyFilter}>Filter</button>
        </div>

        <div id="cardContainer">
          {loading && <p style={{textAlign: 'center', padding: '20px'}}>Loading your reservations...</p>}
          {error && <p style={{textAlign: 'center', padding: '20px', color: 'red'}}>Error: {error}</p>}
          {!loading && !error && filteredReservations.length === 0 && (
            <p style={{textAlign: 'center', padding: '20px'}}>No reservations found</p>
          )}
          {!loading && !error && filteredReservations.map(reservation => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onCheckIn={openConfirmModal}
              onResched={openReschedModal}
              onCancel={openCancelModal}
            />
          ))}
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
              <div style={{textAlign: 'center'}}>
                <p><b>{currentReservation.buildingName}</b></p>
              </div>
              <p>
                <b>Room:</b> {currentReservation.roomCode}<br />
                <b>Seat:</b> {currentReservation.seat}<br />
                <b>Requested:</b> {currentReservation.requestedDate} <b>|</b> {currentReservation.requestedTime}<br />
                <b>Reservation:</b> {currentReservation.reservationDate} <b>|</b> {currentReservation.reservationTime}
              </p>
              <br />
            </div>
          )}

          <label>Choose New Timeslot</label>
          <select 
            id="slotDropdown"
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
          >
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

      {/* Check-in Confirmation Modal */}
      <div id="confirmModal">
        <div className="modal-content">
          <h2>Confirm Reservation</h2>
          {currentReservation && (
            <div id="confirmReservationDetails">
              <br />
              <div style={{textAlign: 'center'}}>
                <p><b>{currentReservation.buildingName}</b></p>
              </div>
              <p>
                <b>Room:</b> {currentReservation.roomCode}<br />
                <b>Seat:</b> {currentReservation.seat}<br />
                <b>Requested:</b> {currentReservation.requestedDate} <b>|</b> {currentReservation.requestedTime}<br />
                <b>Reservation:</b> {currentReservation.reservationDate} <b>|</b> {currentReservation.reservationTime}
              </p>
            </div>
          )}

          <p style={{textAlign: 'center'}}><i><br />By confirming, you will be marked <b>present</b> in the computer laboratory with your assigned seat.</i></p>

          <div className="modal-actions">
            <div className="modal-actions-inner">
              <button className="modal-btn secondary" onClick={closeConfirmModal}>Back</button>
              <button className="modal-btn primary" onClick={confirmReservation}>Confirm</button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      <div id="cancelModal">
        <div className="modal-content">
          <h2>Cancel Reservation</h2>
          {currentReservation && (
            <div id="cancelReservationDetails">
              <br />
              <div style={{textAlign: 'center'}}>
                <p><b>{currentReservation.buildingName}</b></p>
              </div>
              <p>
                <b>Room:</b> {currentReservation.roomCode}<br />
                <b>Seat:</b> {currentReservation.seat}<br />
                <b>Requested:</b> {currentReservation.requestedDate} <b>|</b> {currentReservation.requestedTime}<br />
                <b>Reservation:</b> {currentReservation.reservationDate} <b>|</b> {currentReservation.reservationTime}
              </p>
            </div>
          )}

          <p style={{textAlign: 'center'}}><i><br />Are you sure you want to cancel this reservation?</i></p>

          <div className="modal-actions">
            <div className="modal-actions-inner">
              <button className="modal-btn secondary" onClick={closeCancelModal}>Back</button>
              <button className="modal-btn primary" onClick={confirmCancellation}>Cancel</button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

export default UserReservationHistory;
