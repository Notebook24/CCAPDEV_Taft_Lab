import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';

function UserReservationConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const reservationData = location.state || {};

  // State management
  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  // Load CSS dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/style/user_css/user_reservation_confirmation.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/user/profile');
        // const data = await response.json();
        // setUserData(data);

        // Mock user data for now
        setUserData({
          name: 'Chihaya Kisaragi',
          department: 'College of Computer Studies',
          email: 'chihaya.kisaragi@dlsu.edu.ph'
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, []);

  // Redirect if no reservation data
  useEffect(() => {
    if (!reservationData.lab_id) {
      console.warn('No reservation data found, redirecting...');
      // Uncomment to redirect: navigate('/user/reservation');
    }
  }, [reservationData, navigate]);

  // Seat layout configuration (5x5 grid with center aisle)
  const seatLayout = [
    ["A1", "A2", null, "A3", "A4"],
    ["B1", "B2", null, "B3", "B4"],
    [null, null, null, null, null], // Empty row for spacing
    ["C1", "C2", null, "C3", "C4"],
    ["D1", "D2", null, "D3", "D4"]
  ];

  // Mock seat data - in production, fetch from API based on lab_id, date, time
  const [seatData] = useState({
    A1: { status: "available" },
    A2: { status: "taken", name: "Anonymous" },
    A3: { status: "available" },
    A4: { status: "available" },
    B1: { status: "available" },
    B2: { status: "taken", name: "Kien Ong" },
    B3: { status: "available" },
    B4: { status: "available" },
    C1: { status: "available" },
    C2: { status: "available" },
    C3: { status: "taken", name: "Kien Ong" },
    C4: { status: "available" },
    D1: { status: "available" },
    D2: { status: "available" },
    D3: { status: "available" },
    D4: { status: "taken", name: "Anonymous" }
  });

  // Handle seat toggle
  const toggleSeat = (seatId) => {
    setNotice('');
    setSelectedSeats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seatId)) {
        newSet.delete(seatId);
      } else {
        newSet.add(seatId);
      }
      return newSet;
    });
  };

  // Clear all selected seats
  const clearSelection = () => {
    setSelectedSeats(new Set());
    setNotice('');
  };

  // Handle form submission
  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice('');

    // Validation
    if (selectedSeats.size === 0) {
      setNotice('Please select at least one seat.');
      return;
    }

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/reservations/confirm', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     lab_id: reservationData.lab_id,
      //     reserve_date: reservationData.reserve_date,
      //     reserve_startTime: reservationData.reserve_startTime,
      //     reserve_endTime: reservationData.reserve_endTime,
      //     building_id: reservationData.building_id,
      //     seats: Array.from(selectedSeats),
      //     is_anonymous: isAnonymous,
      //     email: email,
      //     password: password
      //   })
      // });
      //
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Reservation failed');
      // }
      //
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success - navigate to home or reservation history
      navigate('/user', { 
        state: { 
          message: 'Reservation confirmed successfully!',
          reservationId: 'RES12345' // Would come from API response
        } 
      });
      
    } catch (err) {
      console.error('Error confirming reservation:', err);
      setError(err.message || 'Failed to confirm reservation. Please try again.');
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Check if a name is anonymous
  const isAnonymousName = (name) => {
    return !name || name.trim().toLowerCase() === 'anonymous';
  };

  // Get building name from building_id
  const getBuildingName = (buildingId) => {
    const buildings = {
      'gokongwei': 'Gokongwei Hall',
      'andrews': 'Andrews Hall',
      'yuch': 'Don Enrique Yuchengco Hall',
      'velasco': 'Velasco Hall',
      'lasalle': 'St. La Salle Hall'
    };
    return buildings[buildingId] || buildingId || 'Unknown Building';
  };

  return (
    <>
      <UserNavbar />

      <div className="sub-header">
        Confirmation of Reservation
      </div>

      <section className="seat-section">
        <div className="seat-title">Seat Selection</div>
        <div className="seat-front-label">[Front]</div>
        
        <div className="seat-grid" style={{
          gridTemplateColumns: `repeat(${Math.max(...seatLayout.map(row => row.length))}, minmax(70px, 1fr))`
        }}>
          {seatLayout.flat().map((seatId, index) => {
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
                onClick={() => seat.status === 'available' ? toggleSeat(seatId) : 
                  (!isAnonymousName(seat.name) ? navigate('/user/view-profile', { state: { userName: seat.name } }) : null)}
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

        <div className="seat-controls">
          <label className="checkline">
            <input 
              type="checkbox" 
              id="anonymousToggle"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            Reserve anonymously
          </label>
          <div className="seat-actions">
            <button 
              className="btn secondary" 
              id="clearBtn" 
              type="button"
              onClick={clearSelection}
            >
              Clear Rooms
            </button>
          </div>
          {notice && <div className="seat-notice" id="notice">{notice}</div>}
        </div>
      </section>

      <main className="container">
        <div className="hstry-confirm-wrapper">
          <div className="hstry-left-box">
            <h3>To proceed, confirm your student account.</h3>

            <form onSubmit={handleConfirmReservation}>
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                className="hstry-input" 
                placeholder="Enter your DLSU email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                className="hstry-input" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <div style={{ 
                  color: '#d9534f', 
                  background: '#fdeaea', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  marginBottom: '10px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <div className="button-group">
                <button 
                  type="submit" 
                  className="hstry-btn-back"
                  disabled={loading}
                  style={{ 
                    display: 'inline-block', 
                    textAlign: 'center', 
                    lineHeight: '40px', 
                    textDecoration: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Confirming...' : 'Confirm'}
                </button>
                <Link 
                  to="/user/reservation" 
                  className="hstry-btn-back" 
                  style={{ 
                    display: 'inline-block', 
                    textAlign: 'center', 
                    lineHeight: '20px', 
                    textDecoration: 'none', 
                    backgroundColor: 'gray' 
                  }}
                >
                  Back
                </Link>
              </div>
            </form>
          </div>

          <div className="hstry-divider"></div>
          
          <div className="hstry-right-box">
            <div className="hstry-details-header">RESERVATION DETAILS</div>

            <div className="hstry-details-row">
              <span>Building:</span> {getBuildingName(reservationData.building_id)}
            </div>
            <div className="hstry-details-row">
              <span>Room:</span> {reservationData.room || 'N/A'}
            </div>
            <div className="hstry-details-row">
              <span>Date:</span> {formatDate(reservationData.reserve_date)}
            </div>
            <div className="hstry-details-row">
              <span>Start Time:</span> {formatTime(reservationData.reserve_startTime)}
            </div>
            <div className="hstry-details-row">
              <span>End Time:</span> {formatTime(reservationData.reserve_endTime)}
            </div>
            <div className="hstry-details-row">
              <span>Seats Selected:</span> <span id="selectedCount">{selectedSeats.size}</span>
            </div>

            {userData && (
              <>
                <div className="hstry-details-row">
                  <span>Student:</span> {userData.name}
                </div>
                <div className="hstry-details-row">
                  <span>Department:</span> {userData.department}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default UserReservationConfirmation;
