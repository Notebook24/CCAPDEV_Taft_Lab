import React from 'react';
import { useNavigate } from 'react-router-dom';

function SeatGrid({
  layout,
  seatData,
  selectedSeats,
  onSeatToggle,
  isAnonymousName
}) {
  const navigate = useNavigate();

  const handleSeatClick = (seatId) => {
    const seat = seatData[seatId] || { status: 'available' };

    if (seat.status === 'available') {
      onSeatToggle(seatId);
    } else if (!isAnonymousName(seat.name)) {
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

          const seat = seatData[seatId] || { status: 'available' };
          const isSelected = selectedSeats.has(seatId);
          const seatClasses = `seat ${seat.status} ${isSelected ? 'selected' : ''}`;

          return (
            <button
              key={seatId}
              type="button"
              className={seatClasses}
              data-seat-id={seatId}
              onClick={() => handleSeatClick(seatId)}
              disabled={seat.status === 'available' ? false : isAnonymousName(seat.name)}
            >
              <div>{seatId}</div>
              {seat.status === 'taken' && (
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
      </div>
    </section>
  );
}

export default SeatGrid;
