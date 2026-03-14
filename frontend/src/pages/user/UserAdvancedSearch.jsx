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
  const [hasSearched, setHasSearched] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState({
    searchDate: getTodayDate(),
    timeSlot: '',
    showOnlyAvailable: true,
    buildingId: 'ALL',
    labId: 'ALL'
  });

  // Sample search results data - DELETE once backend is connected
  const [searchResults] = useState([
    ...Object.entries(LABS_BY_BUILDING).flatMap(([buildingCode, laboratories], indexOuter) =>
      laboratories.map((laboratory, indexInner) => ({
        id: indexOuter * 100 + indexInner + 1,
        building: buildingCode,
        laboratory,
        date: getTodayDate(),
        time: '09:15 - 10:45',
        availableSeats: 4 + ((indexOuter + indexInner) % 16),
        status: 'Available'
      }))
    )
  ]);

  // delet shall not passssssss done ^^

  const availableLabs = buildingId === 'ALL'
    ? Object.values(LABS_BY_BUILDING).flat()
    : LABS_BY_BUILDING[buildingId] || [];

  const filteredResults = searchResults.filter((result) => {
    const matchesBuilding = appliedFilters.buildingId === 'ALL' || result.building === appliedFilters.buildingId;
    const matchesLab = appliedFilters.labId === 'ALL' || result.laboratory === appliedFilters.labId;
    const matchesAvailability = !appliedFilters.showOnlyAvailable || result.status === 'Available';
    return matchesBuilding && matchesLab && matchesAvailability;
  });

  useEffect(() => {
    const stylesheetUrls = ['/assets/style/user_css/user_advanced_search.css'];

    // for keeping styles consistent throughout pages, do Not remove this plz
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

    return () => {
      appendedLinks.forEach((link) => document.head.removeChild(link));
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedFilters({
      searchDate,
      timeSlot,
      showOnlyAvailable,
      buildingId,
      labId
    });
    setHasSearched(true);
    // TODO: Call backend API with filters
  };

  const handleReset = (e) => {
    e.preventDefault();
    setSearchDate(getTodayDate());
    setTimeSlot('');
    setShowOnlyAvailable(true);
    setBuildingId('ALL');
    setLabId('ALL');
    setAppliedFilters({
      searchDate: getTodayDate(),
      timeSlot: '',
      showOnlyAvailable: true,
      buildingId: 'ALL',
      labId: 'ALL'
    });
    setHasSearched(true);
  };

  const handleBuildingChange = (e) => {
    const selectedBuilding = e.target.value;
    setBuildingId(selectedBuilding);
    setLabId('ALL');
  };

  const handleReserve = () => {
    navigate('/user/reservation-confirmation');
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
            <h4>Results for: {appliedFilters.searchDate}, {appliedFilters.timeSlot}</h4>
            <h4>
              Filters: {
                appliedFilters.buildingId === 'ALL'
                  ? 'All Buildings'
                  : BUILDINGS.find((building) => building.code === appliedFilters.buildingId)?.name || appliedFilters.buildingId
              }, {appliedFilters.labId === 'ALL' ? 'All Labs' : appliedFilters.labId}
            </h4>
          </div>

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
              {filteredResults.map((result) => (
                <tr key={result.id}>
                  <td>{result.building}</td>
                  <td>{result.laboratory}</td>
                  <td>{appliedFilters.searchDate}</td>
                  <td>{appliedFilters.timeSlot}</td>
                  <td>{result.availableSeats}</td>
                  <td>{result.status}</td>
                  <td className="action-col">
                    <button className="admin-btn" onClick={handleReserve}>
                      Reserve
                    </button>
                  </td>
                </tr>
              ))}
              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>No matching laboratories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default UserAdvancedSearch;
