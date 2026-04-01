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
        // Get user_id from localStorage
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
          console.warn('No user_id found in localStorage');
          setUserData(null);
          return;
        }

        // Fetch actual user profile from backend
        const response = await fetch(`${API_BASE_URL}/api/user/profile/${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          setUserData({
            name: data.full_name,
            department: data.department || 'N/A',
            email: data.email
          });
          // Pre-fill email field
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
      // Uncomment to redirect: navigate('/user/reservation');
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

    // Get all seat numbers from the database response
    const seatNumbers = Object.keys(seatDataObj);
    console.log('All seat numbers from database:', seatNumbers);
    console.log('Total seats:', seatNumbers.length);

    // Sort them properly
    try {
      seatNumbers.sort((a, b) => {
        // Try to extract row letter and number
        const aRowMatch = a.match(/[A-Za-z]+/);
        const aNumMatch = a.match(/\d+/);
        const bRowMatch = b.match(/[A-Za-z]+/);
        const bNumMatch = b.match(/\d+/);

        if (!aRowMatch || !aNumMatch || !bRowMatch || !bNumMatch) {
          console.warn(`Seat number format issue: ${a} or ${b}`);
          return a.localeCompare(b); // Fallback to string comparison
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
      console.log('Sorted seat numbers:', seatNumbers);
    } catch (err) {
      console.error('Error sorting seat numbers:', err);
    }

    // Special layout for capacity 16
    if (seatNumbers.length === 16) {
      console.log('Using special 16-seat theater layout');
      const layout = [
        [seatNumbers[0], seatNumbers[1], null, seatNumbers[2], seatNumbers[3]],
        [seatNumbers[4], seatNumbers[5], null, seatNumbers[6], seatNumbers[7]],
        [null, null, null, null, null],
        [seatNumbers[8], seatNumbers[9], null, seatNumbers[10], seatNumbers[11]],
        [seatNumbers[12], seatNumbers[13], null, seatNumbers[14], seatNumbers[15]]
      ];
      console.log('Generated layout:', layout);
      return layout;
    }

    // Special layout for capacity 24
    if (seatNumbers.length === 24) {
      console.log('Using special 24-seat theater layout');
      console.log('24-seat layout using seats:', seatNumbers);
      const layout = [
        [seatNumbers[0], seatNumbers[1], null, seatNumbers[2], seatNumbers[3]],
        [seatNumbers[4], seatNumbers[5], null, seatNumbers[6], seatNumbers[7]],
        [null, null, null, null, null],
        [seatNumbers[8], seatNumbers[9], null, seatNumbers[10], seatNumbers[11]],
        [seatNumbers[12], seatNumbers[13], null, seatNumbers[14], seatNumbers[15]],
        [null, null, null, null, null],
        [seatNumbers[16], seatNumbers[17], null, seatNumbers[18], seatNumbers[19]],
        [seatNumbers[20], seatNumbers[21], null, seatNumbers[22], seatNumbers[23]]
      ];
      console.log('Generated layout:', layout);
      return layout;
    }

    // Default layout: organize seats into rows with aisles (every 3 seats in each side)
    const seatsPerFullRow = 6; 
    const layout = [];
    
    for (let i = 0; i < seatNumbers.length; i += seatsPerFullRow) {
      const row = [];
      for (let j = 0; j < seatsPerFullRow && i + j < seatNumbers.length; j++) {
        row.push(seatNumbers[i + j]);
        // Add aisle after 3rd seat
        if (row.length === 3) {
          row.push(null);
        }
      }
      layout.push(row);
    }

    console.log('Generated layout:', layout);
    return layout;
  };

  // Fetch seat data from backend on mount and when reservation data changes
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
        
        console.log('Fetching seat data from:', url);
        
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Seat data received:', data);
        console.log('Seat number to ID map from backend:', data.seat_number_to_id_map);

        // Set the seat data
        setSeatData(data.seat_data);

        // Build the seat number to ID mapping from seat_data itself
        const mapFromSeatData = {};
        Object.keys(data.seat_data).forEach(seatNumber => {
          const seatInfo = data.seat_data[seatNumber];
          if (seatInfo.seat_id) {
            mapFromSeatData[seatNumber] = seatInfo.seat_id;
          } else {
            // Fallback: use seat number as ID if seat_id is missing
            // This allows seats to still be selectable even if they don't exist in DB yet
            console.warn(`Seat ${seatNumber} doesn't have a seat_id, using fallback`);
            mapFromSeatData[seatNumber] = `seat_${seatNumber}_${Date.now()}`;
          }
        });
        console.log('Seat mapping from seat_data:', mapFromSeatData);

        // Use the map from seat_data or fallback to backend's map
        setSeatNumberToIdMap(mapFromSeatData || data.seat_number_to_id_map || {});

        // Generate seat layout based on actual seat data from database
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
      // Convert selected seat numbers to seat IDs
      console.log('Selected seats:', selectedSeats);
      console.log('Seat data:', seatData);
      
      const selectedSeatIds = [];
      const unmappedSeats = [];
      
      Array.from(selectedSeats).forEach(seatNumber => {
        if (seatData[seatNumber] && seatData[seatNumber].seat_id) {
          selectedSeatIds.push(seatData[seatNumber].seat_id);
        } else {
          unmappedSeats.push(seatNumber);
        }
      });
      
      console.log('Selected seat IDs:', selectedSeatIds);
      console.log('Unmapped seats:', unmappedSeats);
      
      if (unmappedSeats.length > 0) {
        throw new Error(`Could not map seats to IDs: ${unmappedSeats.join(', ')}`);
      }

      // Call backend API to confirm reservation
      const response = await fetch(`${API_BASE_URL}/api/user/reservation/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lab_id: reservationData.lab_id,
          reserve_date: reservationData.reserve_date,
          reserve_startTime: reservationData.reserve_startTime,
          reserve_endTime: reservationData.reserve_endTime,
          building_id: reservationData.building_id,
          seat_id: selectedSeatIds, // Send seat IDs
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
      
      // Success - navigate to home or reservation history
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
          
          <SeatGrid
            layout={seatLayout}
            seatData={seatData}
            selectedSeats={selectedSeats}
            onSeatToggle={toggleSeat}
            isAnonymousName={isAnonymousName}
          />

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
