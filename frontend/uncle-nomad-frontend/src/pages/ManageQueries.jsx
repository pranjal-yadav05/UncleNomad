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
import QueryReplyModal from "../modals/QueryReplyModal";

const ManageQueries = () => {
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchQueries = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/query/admin?page=${page}&limit=10`,
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
      console.log(data)
      setQueries(data.queries);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error fetching queries:", error);
    } finally {
      setIsLoading(false);
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
  }, [currentPage]);

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
      {queries.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No Queries found.</div>
      ) : (
        <Table className="border border-gray-300">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Email</TableHead>
              <TableHead>Query</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.map((query) => (
              <TableRow key={query._id}>
                <TableCell>{query.email}</TableCell>
                <TableCell>{query.query}</TableCell>
                <TableCell>
                  {new Date(query.createdAt).toLocaleDateString()}
                </TableCell>
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
