"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import StatsFormModal from "../modals/StatsFormModal"; // A modal for adding and editing stats

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "../components/ui/table";

export default function ManageStats() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [stats, setStats] = useState(null); // stats will be an object instead of an array
  const [newStats, setNewStats] = useState({
    destinations: "",
    tours: "",
    travellers: "",
    ratings: "",
  });

  const [editMode, setEditMode] = useState(false);  // Toggle edit mode
  const [currentStatsId, setCurrentStatsId] = useState(null);  // Track the current stat ID for editing
  const [error, setError] = useState("");  // For error messages
  const [isModalOpen, setIsModalOpen] = useState(false);  // Modal visibility
  const [isUploading, setIsUploading] = useState(false);  // Handle upload state
  const [isLoading, setIsLoading] = useState(false);  // For loading spinner state

  useEffect(() => {
    fetchStats();  // Fetch stats when component loads
    setIsModalOpen(false);  // Close modal after loading stats
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);  // Show loading spinner
      const response = await fetch(`${API_URL}/api/tours/stats`, {
        headers: { "x-api-key": process.env.REACT_APP_API_KEY },
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();  // Parse JSON response
      setStats(data);  // Store the single stat object
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError("Failed to load stats. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStats = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const url = editMode
        ? `${API_URL}/api/tours/stats/${currentStatsId}`
        : `${API_URL}/api/tours/stats`;
      const method = editMode ? "PUT" : "POST";
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        method,
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY,
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newStats),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save stats");
      }

      fetchStats();  // Refresh stats
      resetForm();  // Reset form
    } catch (error) {
      console.error("❌ Stats creation error:", error);
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setNewStats({
      destinations: "",
      tours: "",
      travellers: "",
      ratings: "",
    });
    setEditMode(false);
    setCurrentStatsId(null);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Manage Stats</h2>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Stats</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-8">
        <Button variant="custom" onClick={() => setIsModalOpen(true)}>
          Add New Stats
        </Button>
      </div>

      {/* Pass the stats object and handleAddStats function to the modal */}
      <StatsFormModal
        isOpen={isModalOpen}
        onClose={resetForm}
        newStats={newStats}
        setNewStats={setNewStats}
        handleAddStats={handleAddStats}
        editMode={editMode}
        isUploading={isUploading}
        setIsModalOpen={setIsModalOpen}
      />

      <h3 className="text-xl font-semibold mb-4 text-gray-800">Current Stats</h3>
      {stats ? (
        <Card>
          <Table className="border border-gray-300">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead>Destinations</TableHead>
                <TableHead>Tours</TableHead>
                <TableHead>Happy Travellers</TableHead>
                <TableHead>Average Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow key={stats._id} className="hover:bg-gray-50">
                <TableCell>{stats.destinations}</TableCell>
                <TableCell>{stats.tours}</TableCell>
                <TableCell>{stats.travellers}</TableCell>
                <TableCell>{stats.ratings}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setNewStats({
                        destinations: stats.destinations,
                        tours: stats.tours,
                        travellers: stats.travellers,
                        ratings: stats.ratings,
                      });
                      setEditMode(true);
                      setCurrentStatsId(stats._id);
                      setIsModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-500"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this stat?")) {
                        try {
                          const token = localStorage.getItem("token");
                          const response = await fetch(
                            `${API_URL}/api/tours/stats/${stats._id}`,
                            {
                              method: "DELETE",
                              headers: {
                                "x-api-key": process.env.REACT_APP_API_KEY,
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );
                          if (response.ok) fetchStats();
                        } catch (error) {
                          console.error("Error deleting stat:", error);
                          setError("Failed to delete stat");
                        }
                      }
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      ) : (
        <p>No stats found.</p>
      )}
    </div>
  );
}
