import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TravelPage from './components/TravelPage';
import AdminAuth from './components/AdminAuth';
import AdminPanel from './components/AdminPanel';
import ManageBookings from './components/ManageBookings';
import ManageRooms from './components/ManageRooms';
import ManagePackages from './components/ManagePackages';
import ManageQueries from './components/ManageQueries';
import AdminCredentialsUpdate from './components/AdminCredentialsUpdate';
import ManageMedia from './components/ManageMedia';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TravelPage />} />
        <Route path="/admin-auth" element={<AdminAuth />} />
        
        <Route path="/admin" element={<AdminPanel />}>
          <Route path="bookings" element={<ManageBookings />} />
          <Route path="rooms" element={<ManageRooms />} />
          <Route path="packages" element={<ManagePackages />} />
          <Route path="queries" element={<ManageQueries />} />
            <Route path="credentials" element={<AdminCredentialsUpdate />} />
            <Route path="media" element={<ManageMedia />} />
          </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
