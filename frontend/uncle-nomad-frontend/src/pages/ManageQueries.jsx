import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import QueryReplyModal from "../modals/QueryReplyModal";
import { formatDate } from "../utils/dateUtils";

const ManageQueries = () => {
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchQueries = async (page = 1) => {
    try {
      setIsLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page,
        limit: 10,
        sort: `${sortOrder === "desc" ? "-" : ""}${sortField}`,
      });

      // Add status filter if not 'all'
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      // Add search term if present
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/query/admin?${params.toString()}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      setQueries(data.queries);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error fetching queries:", error);
      setError("Failed to fetch queries");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    fetchQueries(1);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (field === sortField) {
      // If clicking on the same field, toggle order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // If clicking on a new field, set it as sort field and default to ascending
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page
  };

  // Get sort indicator
  const getSortIndicator = (field) => {
    if (field !== sortField) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  // Handle status filter change
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page
  };

  // Function to handle downloading all data as Excel
  const handleExportData = async () => {
    try {
      setExportLoading(true);

      // Build query parameters for filtered/sorted data
      const params = new URLSearchParams({
        sort: `${sortOrder === "desc" ? "-" : ""}${sortField}`,
      });

      // Add status filter if not 'all'
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      // Add search term if present
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL
        }/api/query/export?${params.toString()}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );

      if (response.status === 404) {
        setError("No queries found with the current filters");
        setExportLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to export queries");
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to download the file
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Get current date for filename
      const today = new Date().toISOString().split("T")[0];

      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `customer_queries_${today}.xlsx`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting queries:", error);
      setError("Failed to export queries. Please try again.");
      setExportLoading(false);
    }
  };

  const handleReply = async (query) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/query/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
          body: JSON.stringify({
            email: query.email,
            message: replyContent,
          }),
        }
      );

      if (response.ok) {
        // Update the query status locally
        setQueries((prevQueries) =>
          prevQueries.map((q) =>
            q._id === query._id ? { ...q, status: "resolved" } : q
          )
        );
        alert("Reply sent successfully");
        setSelectedQuery(null);
        setReplyContent("");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setIsModalOpen(false);
      setIsLoading(false);
    }
  };

  const handleDelete = async (query) => {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/query/delete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
        body: JSON.stringify({
          query: query,
        }),
      }
    );
    if (response.ok) {
      // Update the query status locally
      fetchQueries();
      alert("query deleted successfully");
      setSelectedQuery(null);
      setReplyContent("");
    }
  };

  useEffect(() => {
    fetchQueries(currentPage);
  }, [currentPage, sortField, sortOrder, statusFilter]);

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Manage Queries</h2>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading queries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Manage Customer Queries</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div></div> {/* Empty div for flex spacing */}
        <Button
          variant="outline"
          onClick={handleExportData}
          disabled={exportLoading}>
          {exportLoading ? (
            <div className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></span>
              <span>Exporting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Download Data</span>
            </div>
          )}
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Search Form */}
          <div className="flex-1">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="searchTerm" className="mb-1 block">
                  Search
                </Label>
                <Input
                  id="searchTerm"
                  placeholder="Search by email or query content..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full"
                />
              </div>
              <Button type="submit" className="mt-auto">
                Search
              </Button>
            </form>
          </div>

          {/* Status Filter */}
          <div>
            <Label htmlFor="statusFilter" className="mb-1 block">
              Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {queries.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No Queries found.</div>
      ) : (
        <Table className="border border-gray-300">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSortChange("email")}>
                Email {getSortIndicator("email")}
              </TableHead>
              <TableHead>Query</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSortChange("createdAt")}>
                Date {getSortIndicator("createdAt")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSortChange("status")}>
                Status {getSortIndicator("status")}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.map((query) => (
              <TableRow key={query._id}>
                <TableCell>{query.email}</TableCell>
                <TableCell>{query.query}</TableCell>
                <TableCell>{formatDate(query.createdAt)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded ${
                      query.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                    {query.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {query.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedQuery(query);
                          setIsModalOpen(true);
                        }}>
                        Reply
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(query)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}>
            Previous
          </Button>

          <span className="px-4 py-2 border rounded">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      )}

      {isModalOpen && (
        <QueryReplyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isLoading={isLoading}
          setReplyContent={setReplyContent}
          selectedQuery={selectedQuery}
          setSelectedQuery={setSelectedQuery}
          replyContent={replyContent}
          handleReply={handleReply}
        />
      )}
    </div>
  );
};

export default ManageQueries;
