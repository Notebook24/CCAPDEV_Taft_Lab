import React from 'react';
import { useNavigate } from 'react-router-dom';

function ReservationCard({ reservation, onCheckIn, onResched, onCancel }) {
  const navigate = useNavigate();

  const {
    buildingName,
    roomCode,
    seat,
    requestedDate,
    requestedTime,
    reservationDate,
    reservationTime,
    status,
    image,
    id
  } = reservation;

  // Determine if the reservation is ongoing (within scheduled time)
  const isOngoing = status === 'Active' && reservation.isOngoing;
  // Determine if the reservation is future-dated
  const isFuture = status === 'Active' && !reservation.isOngoing;

  return (
    <div className="reservation-card" data-status={status}>
      <img src={image} alt={buildingName} className="card-image" />

      <div className="card-info">
        <h2>{buildingName}</h2>
        <h3>{roomCode}</h3>
        <p>
          <b>Seat: </b> {seat}<br />
          <b>Requested: </b><br />{requestedDate}, {requestedTime}<br />
          <b>Reservation:</b><br />{reservationDate}<br />{reservationTime}
        </p>

        {isOngoing && (
          <>
            <button className="btn-yellow" onClick={() => onCheckIn(id)}>Check-In</button>
            <button className="btn-red" onClick={() => onCancel(id)}>Cancel</button>
          </>
        )}

        {isFuture && (
          <>
            <button className="btn-green" onClick={() => onResched(id)}>Resched</button>
            <button className="btn-red" onClick={() => onCancel(id)}>Cancel</button>
          </>
        )}

        {status === 'Completed' && (
          <p className="status-completed">COMPLETED</p>
        )}

        {status === 'Cancelled' && (
          <p className="status-cancelled">CANCELLED</p>
        )}
      </div>
    </div>
  );
}

export default ReservationCard;
