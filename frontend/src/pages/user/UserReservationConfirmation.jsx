import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import SeatGrid from '../../components/SeatGrid';
import "../../style/user_css/UserReservationConfirmation.css";
import API_BASE_URL from '../../config/api';

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
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [seatData, setSeatData] = useState({});
  const [seatLayout, setSeatLayout] = useState([]);
  const [seatNumberToIdMap, setSeatNumberToIdMap] = useState({});
  const [buildingName, setBuildingName] = useState('');

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
        const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
        
        if (!userId) {
          console.warn('No user_id found in storage');
          setUserData(null);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/user/profile/${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          setUserData({
            name: data.full_name,
            department: data.department || 'N/A',
            email: data.email
          });
          setEmail(data.email);
        } else {
          console.error('Failed to fetch user profile');
          setUserData(null);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setUserData(null);
      }
    };

    fetchUserData();
  }, []);

  // Redirect if no reservation data
  useEffect(() => {
    if (!reservationData.lab_id) {
      console.warn('No reservation data found, redirecting...');
    }
  }, [reservationData, navigate]);

  // Fetch building name
  useEffect(() => {
    if (!reservationData.building_id) return;

    const fetchBuildingName = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/${reservationData.building_id}`);
        
        if (response.ok) {
          const data = await response.json();
          setBuildingName(data.building_name || 'Unknown Building');
        }
      } catch (err) {
        console.error('Error fetching building name:', err);
        setBuildingName('Unknown Building');
      }
    };

    fetchBuildingName();
  }, [reservationData.building_id]);

  // Generate seat layout based on actual seat data from database
  const generateSeatLayout = (seatDataObj) => {
    if (!seatDataObj || Object.keys(seatDataObj).length === 0) {
      console.warn('No seat data provided to generateSeatLayout');
      return [];
    }

    const seatNumbers = Object.keys(seatDataObj);
    console.log('All seat numbers from database:', seatNumbers);
    console.log('Total seats:', seatNumbers.length);

    try {
      seatNumbers.sort((a, b) => {
        const aRowMatch = a.match(/[A-Za-z]+/);
        const aNumMatch = a.match(/\d+/);
        const bRowMatch = b.match(/[A-Za-z]+/);
        const bNumMatch = b.match(/\d+/);

        if (!aRowMatch || !aNumMatch || !bRowMatch || !bNumMatch) {
          return a.localeCompare(b);
        }

        const aRow = aRowMatch[0];
        const aNum = parseInt(aNumMatch[0]);
        const bRow = bRowMatch[0];
        const bNum = parseInt(bNumMatch[0]);
        
        if (aRow === bRow) {
          return aNum - bNum;
        }
        return aRow.localeCompare(bRow);
      });
    } catch (err) {
      console.error('Error sorting seat numbers:', err);
    }

    if (seatNumbers.length === 16) {
      return [
        [seatNumbers[0], seatNumbers[1], null, seatNumbers[2], seatNumbers[3]],
        [seatNumbers[4], seatNumbers[5], null, seatNumbers[6], seatNumbers[7]],
        [null, null, null, null, null],
        [seatNumbers[8], seatNumbers[9], null, seatNumbers[10], seatNumbers[11]],
        [seatNumbers[12], seatNumbers[13], null, seatNumbers[14], seatNumbers[15]]
      ];
    }

    if (seatNumbers.length === 24) {
      return [
        [seatNumbers[0], seatNumbers[1], null, seatNumbers[2], seatNumbers[3]],
        [seatNumbers[4], seatNumbers[5], null, seatNumbers[6], seatNumbers[7]],
        [null, null, null, null, null],
        [seatNumbers[8], seatNumbers[9], null, seatNumbers[10], seatNumbers[11]],
        [seatNumbers[12], seatNumbers[13], null, seatNumbers[14], seatNumbers[15]],
        [null, null, null, null, null],
        [seatNumbers[16], seatNumbers[17], null, seatNumbers[18], seatNumbers[19]],
        [seatNumbers[20], seatNumbers[21], null, seatNumbers[22], seatNumbers[23]]
      ];
    }

    const seatsPerFullRow = 6; 
    const layout = [];
    
    for (let i = 0; i < seatNumbers.length; i += seatsPerFullRow) {
      const row = [];
      for (let j = 0; j < seatsPerFullRow && i + j < seatNumbers.length; j++) {
        row.push(seatNumbers[i + j]);
        if (row.length === 3) {
          row.push(null);
        }
      }
      layout.push(row);
    }

    return layout;
  };

  // Fetch seat data from backend
  useEffect(() => {
    if (!reservationData.lab_id || !reservationData.building_id) {
      console.warn('Missing lab_id or building_id in reservation data');
      return;
    }

    const fetchSeatData = async () => {
      setDataLoading(true);
      setError(null);

      try {
        const url = `${API_BASE_URL}/api/user/reservation/${reservationData.building_id}/${reservationData.lab_id}/seats?date=${reservationData.reserve_date}&startTime=${reservationData.reserve_startTime}&endTime=${reservationData.reserve_endTime}`;
        
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Seat data received:', data);

        setSeatData(data.seat_data);

        const mapFromSeatData = {};
        Object.keys(data.seat_data).forEach(seatNumber => {
          const seatInfo = data.seat_data[seatNumber];
          if (seatInfo.seat_id) {
            mapFromSeatData[seatNumber] = seatInfo.seat_id;
          } else {
            mapFromSeatData[seatNumber] = `seat_${seatNumber}_${Date.now()}`;
          }
        });

        setSeatNumberToIdMap(mapFromSeatData || data.seat_number_to_id_map || {});

        const layout = generateSeatLayout(data.seat_data);
        setSeatLayout(layout);

        setDataLoading(false);
      } catch (err) {
        console.error('Error fetching seat data:', err);
        setError(`Failed to load seat data: ${err.message}`);
        setDataLoading(false);
      }
    };

    fetchSeatData();
  }, [reservationData]);

  // Handle seat toggle — block closed seats
  const toggleSeat = (seatId) => {
    // Check if this seat is closed
    const seatInfo = seatData[seatId];
    if (seatInfo && seatInfo.status === 'Closed') {
      alert('This seat is closed for this time slot.');
      return;
    }

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

    if (selectedSeats.size === 0) {
      setNotice('Please select at least one seat.');
      return;
    }

    if (!email) {
      setError('Email is required. Please ensure you are logged in.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const selectedSeatIds = [];
      const unmappedSeats = [];
      
      Array.from(selectedSeats).forEach(seatNumber => {
        if (seatData[seatNumber] && seatData[seatNumber].seat_id) {
          selectedSeatIds.push(seatData[seatNumber].seat_id);
        } else {
          unmappedSeats.push(seatNumber);
        }
      });
      
      if (unmappedSeats.length > 0) {
        throw new Error(`Could not map seats to IDs: ${unmappedSeats.join(', ')}`);
      }

      const response = await fetch(`${API_BASE_URL}/api/user/reservation/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lab_id: reservationData.lab_id,
          reserve_date: reservationData.reserve_date,
          reserve_startTime: reservationData.reserve_startTime,
          reserve_endTime: reservationData.reserve_endTime,
          building_id: reservationData.building_id,
          seat_id: selectedSeatIds,
          is_anonymous: isAnonymous,
          email: email,
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Reservation failed');
      }

      const data = await response.json();
      console.log('Reservation confirmed:', data);
      
      setLoading(false);
      navigate('/user', { 
        state: { 
          message: 'Reservation confirmed successfully!',
          reservationId: data.reservation?._id || data._id
        } 
      });
      
    } catch (err) {
      console.error('Error confirming reservation:', err);
      setError(err.message || 'Failed to confirm reservation. Please try again.');
      setLoading(false);
    }
  };

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

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isAnonymousName = (name) => {
    return !name || name.trim().toLowerCase() === 'anonymous';
  };

  // ── Inline seat grid with closed-seat support ─────────────────────────────
  const renderSeatGrid = () => {
    if (!seatLayout.length) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', margin: '20px auto' }}>
        <div style={{
          display: 'inline-block',
          background: '#2e7d32',
          color: '#fff',
          padding: '4px 32px',
          borderRadius: '4px',
          fontWeight: 700,
          fontSize: '13px',
          marginBottom: '10px',
          letterSpacing: '2px'
        }}>
          FRONT
        </div>

        {seatLayout.map((row, rowIndex) => {
          // Aisle row — all nulls
          if (row.every(cell => cell === null)) {
            return <div key={`aisle-${rowIndex}`} style={{ height: '14px' }} />;
          }

          return (
            <div key={`row-${rowIndex}`} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {row.map((seatNumber, colIndex) => {
                // Spacer (aisle column)
                if (seatNumber === null) {
                  return <div key={`spacer-${colIndex}`} style={{ width: '24px' }} />;
                }

                const seatInfo = seatData[seatNumber] || {};
                const isClosed = seatInfo.status === 'Closed';
                const isOccupied = seatInfo.is_available === false && !isClosed;
                const isSelected = selectedSeats.has(seatNumber);

                let bgColor = '#4caf50';       // available — green
                let border = '2px solid #388e3c';
                let cursor = 'pointer';
                let labelColor = '#fff';

                if (isClosed) {
                  bgColor = '#9e9e9e';          // gray
                  border = '2px solid #757575';
                  cursor = 'not-allowed';
                } else if (isOccupied) {
                  bgColor = '#e53935';          // red — taken
                  border = '2px solid #b71c1c';
                  cursor = 'not-allowed';
                } else if (isSelected) {
                  bgColor = '#1565c0';          // blue — selected
                  border = '2px solid #0d47a1';
                }

                // Occupant label (non-anonymous name)
                const occupantName = seatInfo.reserved_by && !isAnonymousName(seatInfo.reserved_by)
                  ? seatInfo.reserved_by
                  : '';

                return (
                  <button
                    key={seatNumber}
                    type="button"
                    title={isClosed ? 'This seat is closed for this time slot' : seatNumber}
                    onClick={() => toggleSeat(seatNumber)}
                    style={{
                      width: '64px',
                      height: '56px',
                      background: bgColor,
                      border,
                      borderRadius: '6px',
                      color: labelColor,
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      transition: 'opacity 0.15s',
                      opacity: isClosed ? 0.65 : 1,
                    }}
                  >
                    <span>{seatNumber}</span>
                    {occupantName && (
                      <span style={{ fontSize: '9px', fontWeight: 400, maxWidth: '58px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {occupantName}
                      </span>
                    )}
                    {isClosed && (
                      <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px' }}>CLOSED</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '13px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { color: '#4caf50', border: '#388e3c', label: 'Available' },
            { color: '#1565c0', border: '#0d47a1', label: 'Selected' },
            { color: '#e53935', border: '#b71c1c', label: 'Taken' },
            { color: '#9e9e9e', border: '#757575', label: 'Closed' },
          ].map(({ color, border, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '16px', height: '16px', background: color, border: `2px solid ${border}`, borderRadius: '3px', display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <UserNavbar />

      <div className="sub-header">
        Confirmation of Reservation
      </div>

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
          Loading seat data...
        </div>
      ) : (
        <>
          {error && (
            <div style={{ textAlign: 'center', padding: '20px', fontSize: '16px', color: '#d9534f', background: '#fdeaea', borderRadius: '8px', margin: '20px' }}>
              Error: {error}
            </div>
          )}
          
          {/* Replaced SeatGrid with inline renderer that supports Closed status */}
          {renderSeatGrid()}

          <section className="seat-controls">
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
          </section>
        </>
      )}

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
                readOnly
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

              {notice && <div className="seat-notice" id="notice">{notice}</div>}

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
              <span>Building:</span> {buildingName || 'Loading...'}
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