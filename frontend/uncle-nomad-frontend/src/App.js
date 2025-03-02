import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TravelPage from './pages/TravelPage';
import AdminAuth from './components/AdminAuth';
import AdminPanel from './components/AdminPanel';
import ManageBookings from './pages/ManageBookings';
import ManageRooms from './pages/ManageRooms';
import ManagePackages from './pages/ManagePackages';
import ManageQueries from './pages/ManageQueries';
import AdminCredentialsUpdate from './components/AdminCredentialsUpdate';
import ManageMedia from './pages/ManageMedia';
import TourDetailsPage from './pages/TourDetailsPage';
import './App.css'
import ManageGallery from './pages/ManageGallery';
import GalleryPage from './pages/GalleryPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import RoomSelectionPage from './pages/RoomSelectionPage';
import ManageTourBookings from './pages/ManageTourBookings';
import AvailabilityPage from './pages/AvailabilityPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TravelPage />} />
        <Route path='/tour/:id' element={<TourDetailsPage/>}/>
        <Route path='/rooms/:id' element={<RoomDetailsPage/>}/>
        <Route path="/admin-auth" element={<AdminAuth />} />
        <Route path='/gallery' element={<GalleryPage/>} />
        <Route path='/room-selection' element={<RoomSelectionPage/>} />
        <Route path='/availability' element={<AvailabilityPage/>} />
        <Route path='/profile' element={<ProfilePage/>} />

        {/*Admin Route */}
        <Route path="/admin" element={<AdminPanel />}>
          <Route path="bookings" element={<ManageBookings />} />
          <Route path="tourbookings" element={<ManageTourBookings/>} />
          <Route path="gallery" element={<ManageGallery/>} />
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
