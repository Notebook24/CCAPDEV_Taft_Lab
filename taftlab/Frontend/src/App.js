import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Admin Pages
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminProfileView from './pages/admin/AdminProfileView';
import AdminBuildingDashboard from './pages/admin/AdminBuildingDashboard';
import AdminManageSeatReservations from './pages/admin/AdminManageSeatReservations';

// User Pages
import UserHomePage from './pages/user/UserHomePage';
import UserReservationHistory from './pages/user/UserReservationHistory';
import UserAdvancedSearch from './pages/user/UserAdvancedSearch';
import UserProfileView from './pages/user/UserProfileView';
import UserChangePassword from './pages/user/UserChangePassword';
import UserEditProfile from './pages/user/UserEditProfile';
import UserReservationPage from './pages/user/UserReservationPage';
import UserReservationSeats from './pages/user/UserReservationSeats';
import UserReservationConfirmation from './pages/user/UserReservationConfirmation';
import ViewOtherProfile from './pages/user/ViewOtherProfile';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminHomePage />} />
        <Route path="/admin/profile" element={<AdminProfileView />} />
        <Route path="/admin/building-dashboard" element={<AdminBuildingDashboard />} />
        <Route path="/admin/manage-reservations" element={<AdminManageSeatReservations />} />

        {/* User Routes */}
        <Route path="/user" element={<UserHomePage />} />
        <Route path="/user/reservation-history" element={<UserReservationHistory />} />
        <Route path="/user/advanced-search" element={<UserAdvancedSearch />} />
        <Route path="/user/profile" element={<UserProfileView />} />
        <Route path="/user/change-password" element={<UserChangePassword />} />
        <Route path="/user/edit-profile" element={<UserEditProfile />} />
        <Route path="/user/reservation" element={<UserReservationPage />} />
        <Route path="/user/reservation-seats" element={<UserReservationSeats />} />
        <Route path="/user/reservation-confirmation" element={<UserReservationConfirmation />} />
        <Route path="/user/view-profile/:userId" element={<ViewOtherProfile />} />

        {/* Default*/}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;