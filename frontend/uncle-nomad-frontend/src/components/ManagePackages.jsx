"use client"

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import PackageFormModal from './PackageFormModal';

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table';


export default function ManagePackages() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [packages, setPackages] = useState([]);
  const [newPackage, setNewPackage] = useState({ 
    id: '',
    title: '',
    description: '', 
    price: '',
    duration: '',
    groupSize: '',
    location: '',
    itinerary: []
  });

  const [currentDay, setCurrentDay] = useState({
    day: '',
    title: '',
    description: '',
    activities: '',
    accommodation: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [currentPackageId, setCurrentPackageId] = useState(null);



  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {

    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tours`);
      const data = await response.json();
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      // Convert price to string to match backend schema
      const packageData = {
        ...newPackage,
        price: newPackage.price.toString()
      };

      console.log(newPackage)
      
      const url = editMode ? `${API_URL}/api/tours/${currentPackageId}` : `${API_URL}/api/tours`;
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      });

      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add package');
      }

      fetchPackages();
      setNewPackage({ 
        id: '',
        title: '',
        description: '', 
        price: '',
        duration: '',
        groupSize: '',
        location: ''
      });
      setEditMode(false);
      setCurrentPackageId(null);


    } catch (error) {
      console.error('Package creation error:', error);
      setError(error.message);
      setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
    }

  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Tour Packages</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <div className="mb-8">
        <Button variant='custom' onClick={() => setIsModalOpen(true)}>
          Add New Package
        </Button>
      </div>

      <PackageFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        newPackage={newPackage}
        setNewPackage={setNewPackage}
        currentDay={currentDay}
        setCurrentDay={setCurrentDay}
        handleAddPackage={(e) => {
          handleAddPackage(e);
          setIsModalOpen(false);
        }}
        editMode={editMode}
      />

      <h3 className="text-xl font-semibold mb-4 text-gray-800">Existing Packages</h3>
      <Card>
        <Table>
        <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Group Size</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg._id} className="hover:bg-gray-50">
                <TableCell>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setNewPackage({
                        id: pkg.id,
                        title: pkg.title,
                        description: pkg.description,
                        price: pkg.price,
                        duration: pkg.duration,
                        groupSize: pkg.groupSize,
                        location: pkg.location,
                        itinerary: pkg.itinerary || []
                      });
                      setEditMode(true);
                      setCurrentPackageId(pkg._id);
                      setIsModalOpen(true);
                    }}

                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-500"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this package?')) {
                        try {
                          const response = await fetch(`${API_URL}/api/tours/${pkg._id}`, {
                            method: 'DELETE'
                          });
                          if (response.ok) {
                            fetchPackages();
                          }
                        } catch (error) {
                          console.error('Error deleting package:', error);
                        }
                      }
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>

                <TableCell className="font-medium">{pkg.title}</TableCell>
                <TableCell className="max-w-[300px] truncate">{pkg.description}</TableCell>
                <TableCell className="text-right">₹{pkg.price}</TableCell>
                <TableCell>{pkg.duration}</TableCell>
                <TableCell>{pkg.groupSize}</TableCell>
                <TableCell>{pkg.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>

        </Table>
      </Card>

    </div>
  );
}
