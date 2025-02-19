import logo from './logo.svg';
import TravelPage from './components/TravelPage';
import AdminAuth from './components/AdminAuth';
import AdminPanel from './components/AdminPanel';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ManageBookings from './components/ManageBookings';
import ManagePackages from './components/ManagePackages';
import ManageRooms from './components/ManageRooms';
import AdminCredentialsUpdate from './components/AdminCredentialsUpdate';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<TravelPage />} />
          <Route path="/admin-auth" element={<AdminAuth />} />
          <Route path="/admin" element={<AdminPanel />}>
            <Route index element={<ManageBookings />} />
            <Route path="bookings" element={<ManageBookings />} />
            <Route path="rooms" element={<ManageRooms />} />
            <Route path="packages" element={<ManagePackages />} />
            <Route path="credentials" element={<AdminCredentialsUpdate />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
