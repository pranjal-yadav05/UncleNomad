"use client"

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import RoomFormModal from './RoomFormModal';

export default function ManageRooms() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    id: '',
    type: '',
    price: '',
    capacity: '',
    totalRooms: '',
    amenities: [],
    mealIncluded: false,
    mealPrice: 0,
    extraBedPrice: 0,
    smokingAllowed: false,
    alcoholAllowed: false,
    childrenAllowed: true,
    childrenPolicy: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/api/rooms`);
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setRooms(data);
      } else {
        console.error('Invalid data format:', data);
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    } finally{
      setIsLoading(false)
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true)
    const url = editMode ? `${API_URL}/api/rooms/${currentRoomId}` : `${API_URL}/api/rooms`;
    const method = editMode ? 'PUT' : 'POST';
  
    // Create a FormData object
    const formDataToSend = new FormData();
    
    // Properly append each field to the FormData
    for (const key in formData) {
      // Handle arrays like amenities specially
      if (Array.isArray(formData[key])) {
        formData[key].forEach(item => formDataToSend.append(`${key}[]`, item));
      } 
      // Handle file objects (don't try to convert them to string)
      else if (key === 'image' && formData[key] instanceof File) {
        formDataToSend.append(key, formData[key]);
      }
      // Handle booleans and other primitives
      else {
        formDataToSend.append(key, formData[key]);
      }
    }
  
    try {
      const response = await fetch(url, {
        method,
        body: formDataToSend,
        // Important: Do not set Content-Type header when sending FormData
        // Let the browser set it with the correct boundary
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save room');
      }
  
      fetchRooms();
      setFormData({
        id: '',
        type: '',
        price: '',
        capacity: '',
        totalRooms: '',
        amenities: [],
        mealIncluded: false,
        mealPrice: 0,
        extraBedPrice: 0,
        smokingAllowed: false,
        alcoholAllowed: false,
        childrenAllowed: true,
        childrenPolicy: '',
        image: null // Reset image field properly
      });
      setEditMode(false);
      setCurrentRoomId(null);
      setShowRoomForm(false);
    } catch (error) {
      console.error('Error saving room:', error);
      alert(`Error: ${error.message}`);
    } finally{
      setIsLoading(false)
    }
  };

  const handleEdit = (room) => {
    setFormData({
      id: room.id,
      type: room.type,
      price: room.price,
      capacity: room.capacity,
      totalRooms: room.totalRooms,
      amenities: room.amenities,
      mealIncluded: room.mealIncluded,
      mealPrice: room.mealPrice,
      extraBedPrice: room.extraBedPrice,
      smokingAllowed: room.smokingAllowed,
      alcoholAllowed: room.alcoholAllowed,
      childrenAllowed: room.childrenAllowed,
      childrenPolicy: room.childrenPolicy
    });
    setEditMode(true);
    setCurrentRoomId(room._id);
    setShowRoomForm(true);
  };

  const handleDelete = async (id) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/api/rooms/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRooms();
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    } finally{
      setIsLoading(false)
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Manage Rooms</h2>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Rooms</h1>
      
      <Button 
        onClick={() => setShowRoomForm(true)} 
        className="mb-4"
        variant='custom' 
      >
        Add New Room
      </Button>

      <RoomFormModal
        isOpen={showRoomForm}
        onClose={() => setShowRoomForm(false)}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        editMode={editMode}
      />

      <Table className="border border-gray-300">
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead>Image</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Total Rooms</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((room) => (
            <TableRow key={room._id}>
              <TableCell>
                {room.imageUrl && (
                  <img 
                    src={room.imageUrl} 
                    alt={'image'} 
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
              </TableCell>
              <TableCell>{room.id}</TableCell>
              <TableCell>{room.type}</TableCell>
              <TableCell>{room.price}</TableCell>
              <TableCell>{room.capacity}</TableCell>
              <TableCell>{room.totalRooms}</TableCell>
              <TableCell>
                <Button variant="ghost" onClick={() => handleEdit(room)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => handleDelete(room._id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
