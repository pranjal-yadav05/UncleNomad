"use client"
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import RoomFormModal from '../modals/RoomFormModal';
export default function ManageRooms() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
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
    images: [],
    existingImages: []
  });
  const [editMode, setEditMode] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    fetchRooms();
  }, []);
  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/rooms`,{headers:{"x-api-key": process.env.REACT_APP_API_KEY}});
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
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const url = editMode ? `${API_URL}/api/rooms/${currentRoomId}` : `${API_URL}/api/rooms`;
    const method = editMode ? 'PUT' : 'POST';
  
    // Create a FormData object
    const formDataToSend = new FormData();

    const formattedAmenities = Array.isArray(formData.amenities)
  ? formData.amenities
  : (typeof formData.amenities === "string" ? formData.amenities.split(",").map(a => a.trim()) : []);

    // Append the basic fields
    formDataToSend.append('type', formData.type);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('capacity', formData.capacity);
    formDataToSend.append('totalRooms', formData.totalRooms);
    formDataToSend.append('mealIncluded', formData.mealIncluded);
    formDataToSend.append('mealPrice', formData.mealPrice);
    formDataToSend.append('extraBedPrice', formData.extraBedPrice);
    formDataToSend.append('smokingAllowed', formData.smokingAllowed);
    formDataToSend.append('alcoholAllowed', formData.alcoholAllowed);
    formDataToSend.append('childrenAllowed', formData.childrenAllowed);
    formDataToSend.append('childrenPolicy', formData.childrenPolicy || '');
    
    // Append amenities as an array
    formattedAmenities.forEach((amenity) => {
      formDataToSend.append("amenities[]", amenity);
    });
      
    // Append beds if they exist
    if (formData.beds && formData.beds.length > 0) {
      formDataToSend.append('beds', JSON.stringify(formData.beds));
    }
    
    // Append multiple image files
    if (formData.images && formData.images.length > 0) {
      formData.images.forEach(image => {
        formDataToSend.append('images', image);
      });
    }
    
    // Append existing images if in edit mode
    if (editMode && formData.existingImages) {
      formDataToSend.append('existingImages', JSON.stringify(formData.existingImages));
    }
    
    try {
      const response = await fetch(url, {
        method,
        body: formDataToSend,
        headers:{"x-api-key": process.env.REACT_APP_API_KEY}
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${editMode ? 'update' : 'create'} room`);
      }
      
      // Reset form and fetch updated rooms
      resetForm();
      fetchRooms();
      // Close the modal
      setShowRoomForm(false);
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} room:`, error);
      alert(`Failed to ${editMode ? 'update' : 'create'} room. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = (room) => {
    const roomWithAmenities = {
      ...room,
      amenities: Array.isArray(room.amenities) ? room.amenities : [],
      beds: Array.isArray(room.beds) ? room.beds : [],
      images: []
    };
    
    setFormData({
      ...roomWithAmenities,
      id: room._id,
      existingImages: room.imageUrls || []
    });
    setEditMode(true);
    setCurrentRoomId(room._id);
    setShowRoomForm(true);
  };
  
  const handleDelete = async (roomId) => { // ✅ Use roomId instead of 'id'
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }
  
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {"x-api-key": process.env.REACT_APP_API_KEY}
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete room');
      }
  
      setRooms(rooms.filter(room => room._id !== roomId)); // ✅ Use '_id'
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const handleAddRoom = () => {
    resetForm();
    setEditMode(false);
    setCurrentRoomId(null);
    setShowRoomForm(true);
  };
  
  const resetForm = () => {
    setFormData({
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
      images: [],
      existingImages: []
    });
  };
  
  const formatAmenities = (amenities) => {
    if (!amenities || !Array.isArray(amenities) || amenities.length === 0) {
      return "No amenities provided"; // Default text when no amenities are available
    }
    return amenities.join(", ");
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Rooms</h1>
        <Button onClick={handleAddRoom}>Add New Room</Button>
      </div>
      
      {isLoading && !showRoomForm ? (
        <div className="text-center py-8">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No rooms found. Add a new room to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="border border-gray-300">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Total Rooms</TableHead>
                <TableHead>Amenities</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room._id}>
                  {console.log(room)}
                  <TableCell>{room.type}</TableCell>
                  <TableCell>₹{room.price}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell>{room.totalRooms}</TableCell>
                  <TableCell>{formatAmenities(room.amenities)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(room)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(room._id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <RoomFormModal
        isOpen={showRoomForm}
        onClose={() => setShowRoomForm(false)}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        editMode={editMode}
        isLoading={isLoading}
      />
    </div>
  );
}