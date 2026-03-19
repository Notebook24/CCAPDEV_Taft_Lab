import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import "../../style/user_css/UserAdvancedSearch.css";

const BUILDINGS = [
  { code: 'GK', name: 'Gokongwei Hall' },
  { code: 'AG', name: 'Andrews' },
  { code: 'Y', name: 'Don Enrique Yuchengco Hall' },
  { code: 'V', name: 'Velasco Hall' },
  { code: 'L', name: 'St. La Salle Hall' }
];

const LABS_BY_BUILDING = {
  GK: ['GK210', 'GK211', 'GK302A', 'GK302B', 'GK304A', 'GK304B', 'GK306A', 'GK306B', 'GK404A', 'GK404B'],
  AG: ['AG1706', 'AG1904'],
  Y: ['Y602'],
  V: ['V103', 'V205', 'V206', 'V208A', 'V208B', 'V301', 'V310'],
  L: ['L212', 'L229', 'L320', 'L335']
};

function UserAdvancedSearch() {
  const navigate = useNavigate();
  
  // setting up the cureent date in a certain format
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

  const availableLabs = buildingId === 'ALL'
    ? Object.values(LABS_BY_BUILDING).flat()
    : LABS_BY_BUILDING[buildingId] || [];

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/user/advanced-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchDate,
          timeSlot,
          showOnlyAvailable,
          buildingID: buildingId,
          labID: labId
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
    const selectedBuilding = e.target.value;
    setBuildingId(selectedBuilding);
    setLabId('ALL');
  };

  const getBuildingIdFromCode = async (buildingCode) => {
    try {
      const trimmedCode = buildingCode?.trim();
      console.log('Fetching building ID for code:', trimmedCode);
      
      const response = await fetch(`http://localhost:3000/getBuilding?code=${encodeURIComponent(trimmedCode)}`);
      console.log('Building response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Building found:', data);
        return data._id;
      } else {
        const error = await response.json();
        console.error('Building fetch error:', error);
      }
    } catch (err) {
      console.error('Error fetching building:', err);
    }
    return null;
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
      // Get building ID from building code
      const buildingId = await getBuildingIdFromCode(selectedResult.building);
      
      if (!buildingId) {
        alert(`Error: Could not find building "${selectedResult.building}". Please try again or contact support.`);
        return;
      }

      // Parse time slot
      const [startTime, endTime] = selectedResult.time.split('-').map(t => t.trim());
      
      // Build reservation data matching UserReservationConfirmation expectations
      const reservationData = {
        lab_id: selectedResult.id,
        building_id: buildingId,
        room: selectedResult.laboratory,
        reserve_date: selectedResult.date,
        reserve_startTime: startTime + ':00',
        reserve_endTime: endTime + ':00'
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
                <option value="07:30-09:00">07:30AM - 09:00AM</option>
                <option value="09:15-10:45">09:15AM - 10:45AM</option>
                <option value="11:00-12:30">11:00AM - 12:30PM</option>
                <option value="12:45-14:15">12:45PM - 02:15PM</option>
                <option value="14:30-16:00">02:30PM - 04:00PM</option>
                <option value="16:15-17:45">04:15PM - 05:45PM</option>
                <option value="18:00-19:30">06:00PM - 07:30PM</option>
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
              >
                <option value="ALL">- All Buildings -</option>
                {BUILDINGS.map((building) => (
                  <option key={building.code} value={building.code}>
                    {building.code} - {building.name}
                  </option>
                ))}
              </select>

              <label htmlFor="lab_id">Laboratory:</label>
              <select
                id="lab_id"
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
              >
                <option value="ALL">- All Laboratories -</option>
                {availableLabs.map((laboratory) => (
                  <option key={laboratory} value={laboratory}>
                    {laboratory}
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
                  : BUILDINGS.find((building) => building.code === appliedFilters.buildingId)?.name || appliedFilters.buildingId
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
