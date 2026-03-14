import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import ReservationCard from '../../components/ReservationCard';
import "../../style/user_css/UserReservationHistory.css";

function UserReservationHistory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [currentResID, setCurrentResID] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState('07:30:00|09:00:00');

  useEffect(() => {
    const stylesheetUrls = ['/assets/style/user_css/user_reservation_history.css'];

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

    return () => {
      appendedLinks.forEach((link) => document.head.removeChild(link));
    };
  }, []);

  // Sample reservation data, Delete here when we start doing the backend thingy thing
  const [reservations] = useState([
    {
      id: 1,
      buildingName: 'St. La Salle Hall',
      roomCode: 'LS229',
      seat: 'A07',
      requestedDate: 'February 6, 2026',
      requestedTime: '01:05 PM',
      reservationDate: 'February 12, 2026',
      reservationTime: '11:00 AM - 12:30 PM',
      status: 'Active',
      isOngoing: true,
      image: '/assets/images/LS_229_indoor_1.jpg'
    },
    {
      id: 2,
      buildingName: 'St. La Salle Hall',
      roomCode: 'LS229',
      seat: 'B14',
      requestedDate: 'February 6, 2026',
      requestedTime: '01:30 PM',
      reservationDate: 'February 12, 2026',
      reservationTime: '12:45 PM - 2:15 PM',
      status: 'Active',
      isOngoing: false,
      image: '/assets/images/LS_229_indoor_1.jpg'
    },
    {
      id: 3,
      buildingName: 'Velasco Hall',
      roomCode: 'V103',
      seat: 'B14',
      requestedDate: 'February 1, 2026',
      requestedTime: '03:00 PM',
      reservationDate: 'February 5, 2026',
      reservationTime: '12:45 PM - 2:15 PM',
      status: 'Completed',
      isOngoing: false,
      image: '/assets/images/V_103_indoor_3.jpg'
    },
    {
      id: 4,
      buildingName: 'Br. Andrew Gonzales Hall',
      roomCode: 'AG1904',
      seat: 'B14',
      requestedDate: 'February 1, 2026',
      requestedTime: '03:00 PM',
      reservationDate: 'February 5, 2026',
      reservationTime: '12:45 PM - 2:15 PM',
      status: 'Cancelled',
      isOngoing: false,
      image: '/assets/images/AG_1904_indoor_1.jpg'
    }
  ]);

  //Deletion SHALL NOT PASS HERE -Aouien

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

  const openCancelModal = (id) => {
    setCurrentResID(id);
    document.getElementById('cancelModal').style.display = 'flex';
  };

  const closeCancelModal = () => {
    document.getElementById('cancelModal').style.display = 'none';
  };

  const confirmReservation = () => {
    alert('Reservation confirmed successfully! Enjoy using the lab :>');
    closeConfirmModal();
    // TODO: Update backend API to mark attendance
  };

  const confirmCancellation = () => {
    alert('Reservation cancelled successfully!');
    closeCancelModal();
    // TODO: Update backend API to cancel reservation
  };

  const handleReschedConfirm = () => {
    navigate('/user/reservation-confirmation');
    // TODO: Update backend API with new timeslot
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
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onClick={applyFilter}>Filter</button>
        </div>

        <div id="cardContainer">
          {filteredReservations.map(reservation => (
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
              <p>
                <b><center>{currentReservation.buildingName}</center></b><br />
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
              <p>
                <b><center>{currentReservation.buildingName}</center></b><br />
                <b>Room:</b> {currentReservation.roomCode}<br />
                <b>Seat:</b> {currentReservation.seat}<br />
                <b>Requested:</b> {currentReservation.requestedDate} <b>|</b> {currentReservation.requestedTime}<br />
                <b>Reservation:</b> {currentReservation.reservationDate} <b>|</b> {currentReservation.reservationTime}
              </p>
            </div>
          )}

          <p><i><center><br />By confirming, you will be marked <b>present</b> in the computer laboratory with your assigned seat.</center></i></p>

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
              <p>
                <b><center>{currentReservation.buildingName}</center></b><br />
                <b>Room:</b> {currentReservation.roomCode}<br />
                <b>Seat:</b> {currentReservation.seat}<br />
                <b>Requested:</b> {currentReservation.requestedDate} <b>|</b> {currentReservation.requestedTime}<br />
                <b>Reservation:</b> {currentReservation.reservationDate} <b>|</b> {currentReservation.reservationTime}
              </p>
            </div>
          )}

          <p><i><center><br />Are you sure you want to cancel this reservation?</center></i></p>

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
