import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const PackageFormModal = ({ 
  isOpen, 
  onClose, 
  newPackage, 
  setNewPackage, 
  currentDay, 
  setCurrentDay, 
  handleAddPackage, 
  editMode 
}) => {
  const [editingDayIndex, setEditingDayIndex] = useState(null);

  if (!isOpen) return null;

  const handleAddOrUpdateDay = () => {
    if (!currentDay.day || !currentDay.title || !currentDay.description || 
        !currentDay.activities || !currentDay.accommodation) {
      alert('Please fill all day fields');
      return;
    }

    if (editingDayIndex !== null) {
      // Update existing day
      const updatedItinerary = [...newPackage.itinerary];
      updatedItinerary[editingDayIndex] = currentDay;
      setNewPackage({ ...newPackage, itinerary: updatedItinerary });
      setEditingDayIndex(null);
    } else {
      // Add new day
      setNewPackage({
        ...newPackage,
        itinerary: [...newPackage.itinerary, currentDay]
      });
    }

    setCurrentDay({
      day: '',
      title: '',
      description: '',
      activities: '',
      accommodation: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {editMode ? 'Edit Package' : 'Add New Package'}
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={handleAddPackage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Package Fields */}
              <div className="space-y-2">
                <Label htmlFor="title">Package ID</Label>
                <Input
                  id="title"
                  value={newPackage.id}
                  onChange={(e) => setNewPackage({ ...newPackage, id: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Package Title</Label>
                <Input
                  id="title"
                  value={newPackage.title}
                  onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={newPackage.price}
                  onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={newPackage.duration}
                  onChange={(e) => setNewPackage({ ...newPackage, duration: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupSize">Group Size</Label>
                <Input
                  id="groupSize"
                  value={newPackage.groupSize}
                  onChange={(e) => setNewPackage({ ...newPackage, groupSize: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newPackage.location}
                  onChange={(e) => setNewPackage({ ...newPackage, location: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  required
                />
              </div>

              {/* Itinerary Section */}
              <div className="space-y-2 md:col-span-2">
                <h4 className="font-semibold">Itinerary</h4>
                {newPackage.itinerary.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {newPackage.itinerary.map((day, index) => (
                      <div key={index} className="p-2 border rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Day {day.day}: {day.title}</p>
                            <p className="text-sm text-gray-600">{day.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentDay(day);
                                setEditingDayIndex(index);
                              }}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPackage(prev => ({
                                  ...prev,
                                  itinerary: prev.itinerary.filter((_, i) => i !== index)
                                }));
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Day Number</Label>
                    <Input
                      id="day"
                      type="number"
                      value={currentDay.day}
                      onChange={(e) => setCurrentDay({ ...currentDay, day: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dayTitle">Day Title</Label>
                    <Input
                      id="dayTitle"
                      value={currentDay.title}
                      onChange={(e) => setCurrentDay({ ...currentDay, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dayDescription">Day Description</Label>
                    <Input
                      id="dayDescription"
                      value={currentDay.description}
                      onChange={(e) => setCurrentDay({ ...currentDay, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activities">Activities</Label>
                    <Input
                      id="activities"
                      value={currentDay.activities}
                      onChange={(e) => setCurrentDay({ ...currentDay, activities: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accommodation">Accommodation</Label>
                    <Input
                      id="accommodation"
                      value={currentDay.accommodation}
                      onChange={(e) => setCurrentDay({ ...currentDay, accommodation: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Button
                    type="button"
                    onClick={handleAddOrUpdateDay}
                  >
                    {editingDayIndex !== null ? 'Update Day' : 'Add Day'}
                  </Button>
                  {newPackage.itinerary.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewPackage(prev => ({
                          ...prev,
                          itinerary: []
                        }));
                      }}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Clear All Days
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setNewPackage({
                    id: '',
                    title: '',
                    description: '', 
                    price: '',
                    duration: '',
                    groupSize: '',
                    location: '',
                    itinerary: []
                  });
                  setCurrentDay({
                    day: '',
                    title: '',
                    description: '',
                    activities: '',
                    accommodation: ''
                  });
                  setEditingDayIndex(null);
                }}
              >
                Clear Form
              </Button>
              <Button type="submit">
                {editMode ? 'Update Package' : 'Add Package'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PackageFormModal;
