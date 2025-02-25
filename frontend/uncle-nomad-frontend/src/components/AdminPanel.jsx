import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import ManageBookings from './ManageBookings';
import ManageRooms from './ManageRooms';
import ManagePackages from './ManagePackages';
import AdminCredentialsUpdate from './AdminCredentialsUpdate';
import { Button } from './ui/button';


const AdminPanel = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/admin-auth');
  };

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      navigate('/admin-auth');
    }

    if (location.pathname === '/admin') {
      navigate('/admin/bookings');
    }
    
  }, [navigate]);


const navItems = [
    { path: 'bookings', label: 'Manage Bookings' },
    { path: 'rooms', label: 'Manage Rooms' },
    { path: 'packages', label: 'Manage Packages' },
    { path: 'queries', label: 'Manage Queries' },
    { path: 'media', label: 'Manage Hero Media' },
    { path: 'credentials', label: 'Update Credentials' }
  ];




  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        
        <Button 
          variant="destructive" 
          onClick={handleLogout}
          className="ml-4"
        >
          Log Out
        </Button>
      </div>

      
      <nav className="flex gap-4 mb-6 border-b">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `px-4 py-2 rounded-t ${isActive ? 'bg-gray-100 font-medium' : 'text-gray-500 hover:bg-gray-50'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
};

export default AdminPanel;
