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

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const url = editMode ? `${API_URL}/api/rooms/${currentRoomId}` : `${API_URL}/api/rooms`;
    const method = editMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
        childrenPolicy: ''
      });
      setEditMode(false);
      setCurrentRoomId(null);
      setShowRoomForm(false);
    } catch (error) {
      console.error('Error saving room:', error);
      alert(`Error: ${error.message}`);
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
      const response = await fetch(`${API_URL}/api/rooms/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRooms();
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

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
