import React from 'react';
import { useNavigate } from 'react-router-dom';

function SeatGrid({
  layout,
  seatData,
  selectedSeats,
  onSeatToggle,
  isAnonymousName,
  isSeatClosed
}) {
  const navigate = useNavigate();

  const handleSeatClick = (seatId) => {
    const seat = seatData[seatId] || { status: 'Available' };

    // Check if seat is closed first (using isSeatClosed prop)
    if (isSeatClosed && isSeatClosed(seatId)) {
      alert('This seat is closed for this timeslot.');
      return;
    }

    // Check status case-insensitively
    const seatStatus = seat.status?.toLowerCase();
    
    if (seatStatus === 'available') {
      onSeatToggle(seatId);
    } else if (seatStatus === 'occupied' && !isAnonymousName(seat.name)) {
      navigate('/user/view-profile', { state: { userName: seat.name } });
    }
  };

  return (
    <section className="seat-section">
      <div className="seat-title">Seat Selection</div>
      <div className="seat-front-label">[Front]</div>
      
      <div className="seat-grid" style={{
        gridTemplateColumns: `repeat(${Math.max(...layout.map(row => row.length))}, minmax(70px, 1fr))`
      }}>
        {layout.flat().map((seatId, index) => {
          if (!seatId) {
            return <div key={`space-${index}`} className="seat space" aria-hidden="true"></div>;
          }

          const seat = seatData[seatId] || { status: 'Available' };
          const isSelected = selectedSeats.has(seatId);
          const isClosed = isSeatClosed && isSeatClosed(seatId);
          const seatStatus = seat.status?.toLowerCase();
          
          // Determine seat class - closed takes priority
          let seatClasses = 'seat';
          if (isClosed) {
            seatClasses += ' closed';
          } else if (seatStatus === 'occupied') {
            seatClasses += ' taken';
          } else if (isSelected) {
            seatClasses += ' selected';
          } else {
            seatClasses += ' available';
          }

          return (
            <button
              key={seatId}
              type="button"
              className={seatClasses}
              data-seat-id={seatId}
              onClick={() => handleSeatClick(seatId)}
              disabled={isClosed}
            >
              <div>{seatId}</div>
              {seatStatus === 'occupied' && !isClosed && (
                <span className="seat-name">{seat.name || 'Anonymous'}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="legend">
        <span><span className="box available"></span>Available</span>
        <span><span className="box selected"></span>Selected</span>
        <span><span className="box taken"></span>Taken</span>
        <span><span className="box closed"></span>Closed</span>
      </div>
    </section>
  );
}

export default SeatGrid;