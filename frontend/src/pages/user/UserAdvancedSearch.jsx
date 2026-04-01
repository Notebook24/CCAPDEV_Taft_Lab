import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import "../../style/user_css/UserAdvancedSearch.css";
import API_BASE_URL from '../../config/api';

function UserAdvancedSearch() {
  const navigate = useNavigate();
  
  // setting up the current date in a certain format
  const getTodayDate = () => {
    const today = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const year = today.getFullYear();
    const month = pad(today.getMonth() + 1);
    const day = pad(today.getDate());
    return `${year}-${month}-${day}`;
  };

  const [searchDate, setSearchDate] = useState(getTodayDate());
  const [timeSlot, setTimeSlot] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [buildingId, setBuildingId] = useState('ALL');
  const [labId, setLabId] = useState('ALL');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({
    searchDate: getTodayDate(),
    timeSlot: '',
    showOnlyAvailable: true,
    buildingId: 'ALL',
    labId: 'ALL'
  });
  const [selectedResult, setSelectedResult] = useState(null);
  const [reservationModalVisible, setReservationModalVisible] = useState(false);
  
  // State for dynamic buildings and labs
  const [buildings, setBuildings] = useState([]);
  const [labs, setLabs] = useState([]);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const [labsLoading, setLabsLoading] = useState(false);

  // ── FETCH BUILDINGS FROM DATABASE ──────────────────────────────────────────
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin`);
        if (!response.ok) throw new Error('Failed to fetch buildings');
        const data = await response.json();
        setBuildings(data);
        setBuildingsLoading(false);
      } catch (err) {
        console.error('Error fetching buildings:', err);
        setError('Failed to load buildings');
        setBuildingsLoading(false);
      }
    };
    fetchBuildings();
  }, []);

  // ── FETCH LABORATORIES BASED ON SELECTED BUILDING ──────────────────────────
  useEffect(() => {
    const fetchLabs = async () => {
      if (buildingId === 'ALL') {
        setLabs([]);
        setLabId('ALL');
        return;
      }

      setLabsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/${buildingId}/laboratories`);
        if (!response.ok) throw new Error('Failed to fetch laboratories');
        const data = await response.json();
        setLabs(data);
        setLabId('ALL');
      } catch (err) {
        console.error('Error fetching labs:', err);
        setLabs([]);
      } finally {
        setLabsLoading(false);
      }
    };
    fetchLabs();
  }, [buildingId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/advanced-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchDate,
          timeSlot,
          showOnlyAvailable,
          buildingID: buildingId === 'ALL' ? 'ALL' : buildings.find(b => b._id === buildingId)?.building_code || 'ALL',
          labID: labId === 'ALL' ? 'ALL' : labId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }

      const data = await response.json();
      setSearchResults(data);
      setAppliedFilters({
        searchDate,
        timeSlot,
        showOnlyAvailable,
        buildingId,
        labId
      });
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    setSearchDate(getTodayDate());
    setTimeSlot('');
    setShowOnlyAvailable(true);
    setBuildingId('ALL');
    setLabId('ALL');
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
  };

  useEffect(() => {
    // Set date min/max constraints
    const dateInput = document.getElementById('search_date');
    if (dateInput) {
      const today = new Date();
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 7);

      const pad = (value) => String(value).padStart(2, '0');
      const toDateString = (date) => {
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        return `${year}-${month}-${day}`;
      };

      dateInput.min = toDateString(today);
      dateInput.max = toDateString(maxDate);
    }
  }, []);

  const handleBuildingChange = (e) => {
    setBuildingId(e.target.value);
    setLabId('ALL');
  };

  const getBuildingNameById = (buildingId) => {
    const building = buildings.find(b => b._id === buildingId);
    return building ? building.building_name : 'Unknown Building';
  };

  const handleReserveClick = (result) => {
    setSelectedResult(result);
    setReservationModalVisible(true);
  };

  const closeReservationModal = () => {
    setReservationModalVisible(false);
    setSelectedResult(null);
  };

  const handleConfirmReservation = async () => {
    if (!selectedResult) return;

    try {
      // Get building ID from the result (it already has building code, we need the actual ID)
      const building = buildings.find(b => b.building_code === selectedResult.building);
      
      if (!building) {
        alert(`Error: Could not find building "${selectedResult.building}". Please try again or contact support.`);
        return;
      }

      // Parse time slot (format: "07:30:00-08:00:00")
      const [startTime, endTime] = selectedResult.time.split('-').map(t => t.trim());
      
      // Build reservation data matching UserReservationConfirmation expectations
      const reservationData = {
        lab_id: selectedResult.id,
        building_id: building._id,
        room: selectedResult.laboratory,
        reserve_date: selectedResult.date,
        reserve_startTime: startTime,
        reserve_endTime: endTime
      };

      closeReservationModal();
      navigate('/user/reservation-confirmation', { state: reservationData });
    } catch (err) {
      console.error('Error confirming reservation:', err);
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="user-advanced-search">
      <UserNavbar />

      <div className="title-bar">
        <h1>Advanced Quick Search</h1>
      </div>

      <div className="page-container">
        <form onSubmit={handleSearch}>
          <div className="report-content">
            <div className="filters-box no-card">
              <h3>Search Details</h3>

              <label htmlFor="search_date">Date:</label>
              <input
                type="date"
                id="search_date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                required
                className="full-width-control"
              />

              <label htmlFor="time_slot">Time Slot:</label>
              <select
                id="time_slot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="full-width-control"
              >
                <option value="">- Select Time Slot -</option>
                <option value="07:30:00-08:00:00">07:30AM - 08:00AM</option>
                <option value="08:00:00-08:30:00">08:00AM - 08:30AM</option>
                <option value="08:30:00-09:00:00">08:30AM - 09:00AM</option>
                <option value="09:00:00-09:30:00">09:00AM - 09:30AM</option>
                <option value="09:30:00-10:00:00">09:30AM - 10:00AM</option>
                <option value="10:00:00-10:30:00">10:00AM - 10:30AM</option>
                <option value="10:30:00-11:00:00">10:30AM - 11:00AM</option>
                <option value="11:00:00-11:30:00">11:00AM - 11:30AM</option>
                <option value="11:30:00-12:00:00">11:30AM - 12:00PM</option>
                <option value="12:00:00-12:30:00">12:00PM - 12:30PM</option>
                <option value="12:30:00-13:00:00">12:30PM - 01:00PM</option>
                <option value="13:00:00-13:30:00">01:00PM - 01:30PM</option>
                <option value="13:30:00-14:00:00">01:30PM - 02:00PM</option>
                <option value="14:00:00-14:30:00">02:00PM - 02:30PM</option>
                <option value="14:30:00-15:00:00">02:30PM - 03:00PM</option>
                <option value="15:00:00-15:30:00">03:00PM - 03:30PM</option>
                <option value="15:30:00-16:00:00">03:30PM - 04:00PM</option>
                <option value="16:00:00-16:30:00">04:00PM - 04:30PM</option>
                <option value="16:30:00-17:00:00">04:30PM - 05:00PM</option>
                <option value="17:00:00-17:30:00">05:00PM - 05:30PM</option>
                <option value="17:30:00-18:00:00">05:30PM - 06:00PM</option>
                <option value="18:00:00-18:30:00">06:00PM - 06:30PM</option>
                <option value="18:30:00-19:00:00">06:30PM - 07:00PM</option>
                <option value="19:00:00-19:30:00">07:00PM - 07:30PM</option>
                <option value="19:30:00-20:00:00">07:30PM - 08:00PM</option>
                <option value="20:00:00-20:30:00">08:00PM - 08:30PM</option>
                <option value="20:30:00-21:00:00">08:30PM - 09:00PM</option>
                <option value="21:00:00-21:30:00">09:00PM - 09:30PM</option>
              </select>

              <label>
                <input
                  type="checkbox"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                />
                {' '}Show only available seats
              </label>
            </div>

            <div className="range-box no-card">
              <h3>Location Filters</h3>

              <label htmlFor="building_id">Building:</label>
              <select
                id="building_id"
                value={buildingId}
                onChange={handleBuildingChange}
                disabled={buildingsLoading}
              >
                <option value="ALL">- All Buildings -</option>
                {buildings.map((building) => (
                  <option key={building._id} value={building._id}>
                    {building.building_code} - {building.building_name}
                  </option>
                ))}
              </select>

              <label htmlFor="lab_id">Laboratory:</label>
              <select
                id="lab_id"
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                disabled={labsLoading || buildingId === 'ALL'}
              >
                <option value="ALL">- All Laboratories -</option>
                {labs.map((lab) => (
                  <option key={lab._id} value={lab.room_code}>
                    {lab.room_code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="buttons-row">
            <button type="submit" className="admin-btn">Search</button>
            <button type="reset" className="admin-btn" onClick={handleReset}>Reset</button>
            <button type="button" className="admin-btn" onClick={() => navigate('/user')}>Back</button>
          </div>
        </form>
      </div>

      {hasSearched && (
        <>
          <div className="summary-stats">
            <h2>Available Slots</h2>
            <h4>Results for: {appliedFilters.searchDate}, {appliedFilters.timeSlot || 'Any Time'}</h4>
            <h4>
              Filters: {
                appliedFilters.buildingId === 'ALL'
                  ? 'All Buildings'
                  : getBuildingNameById(appliedFilters.buildingId)
              }, {appliedFilters.labId === 'ALL' ? 'All Labs' : appliedFilters.labId}
            </h4>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading search results...</div>}
          
          {error && <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Error: {error}</div>}

          {!loading && (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Building</th>
                  <th>Laboratory</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Available Seats</th>
                  <th>Status</th>
                  <th className="action-col">Action</th>
                </tr>
                </thead>
              <tbody>
                {searchResults.map((result) => (
                  <tr key={result.id}>
                    <td>{result.building}</td>
                    <td>{result.laboratory}</td>
                    <td>{result.date}</td>
                    <td>{result.time}</td>
                    <td>{result.availableSeats}</td>
                    <td>{result.status}</td>
                    <td className="action-col">
                      <button className="admin-btn" onClick={() => handleReserveClick(result)} disabled={result.status === 'Full'}>
                        {result.status === 'Full' ? 'Full' : 'Reserve'}
                      </button>
                    </td>
                  </tr>
                ))}
                {searchResults.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>No matching laboratories found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* Reservation Confirmation Modal */}
      {reservationModalVisible && selectedResult && (
        <div className="modal-backdrop" style={{ display: 'flex' }} onClick={closeReservationModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reserve Laboratory</h3>
            <p>Confirm your reservation</p>

            <div className="form-row">
              <label>Building</label>
              <div className="readonly">{selectedResult.building}</div>
            </div>

            <div className="form-row">
              <label>Laboratory</label>
              <div className="readonly">{selectedResult.laboratory}</div>
            </div>

            <div className="form-row">
              <label>Date</label>
              <div className="readonly">{selectedResult.date}</div>
            </div>

            <div className="form-row">
              <label>Time</label>
              <div className="readonly">{selectedResult.time}</div>
            </div>

            <div className="form-row">
              <label>Available Seats</label>
              <div className="readonly">{selectedResult.availableSeats} seats available</div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn" onClick={closeReservationModal}>Cancel</button>
              <button type="button" className="btn primary" onClick={handleConfirmReservation}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserAdvancedSearch;