import Query from "../models/Query.js";
import nodemailer from "nodemailer";
import ExcelJS from "exceljs";

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Submit a new query
export const submitQuery = async (req, res) => {
  try {
    const { email, query } = req.body;

    // Save query to database
    const newQuery = new Query({ email, query });
    await newQuery.save();

    // Send email to admin
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "New Query from Uncle Nomad Website",
      text: `New query received:\n\nEmail: ${email}\n\nQuery: ${query}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Query submitted successfully" });
  } catch (error) {
    console.error("Error submitting query:", error);
    res.status(500).json({ message: "Failed to submit query" });
  }
};

// Get all queries (for admin panel)
export const getQueries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit to 10 per page
    const skip = (page - 1) * limit;

    // Extract sort parameter from query params
    const sortParam = req.query.sort || "-createdAt"; // Default to sorting by createdAt in descending order

    // Build filter object based on query parameters
    const filter = {};

    // Add status filter if provided and not 'all'
    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    // Add search functionality (search by email or query content)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [{ email: searchRegex }, { query: searchRegex }];
    }

    // Get total count of filtered queries
    const totalQueries = await Query.countDocuments(filter);

    // Fetch paginated queries with filters
    const queries = await Query.find(filter)
      .sort(sortParam)
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      queries,
      totalPages: Math.ceil(totalQueries / limit),
      currentPage: page,
      totalQueries,
    });
  } catch (error) {
    console.error("Error fetching queries:", error);
    res.status(500).json({ message: "Failed to fetch queries" });
  }
};

// Update query status (for admin panel)
export const updateQueryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedQuery = await Query.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedQuery) {
      return res.status(404).json({ message: "Query not found" });
    }

    res.status(200).json(updatedQuery);
  } catch (error) {
    console.error("Error updating query status:", error);
    res.status(500).json({ message: "Failed to update query status" });
  }
};

export const sendQueryReply = async (req, res) => {
  try {
    const { email, message } = req.body;

    const query = await Query.findOne({ email });

    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reply to your query from Uncle Nomad",
      text: `Dear Customer,\n\nThank you for contacting us. Here is our response to your query:\n\n${message}\n\nBest regards,\nThe Uncle Nomad Team`,
    };

    await transporter.sendMail(mailOptions);

    query.status = "resolved"; // or any status you prefer
    await query.save();

    res.status(200).json({ message: "Reply sent successfully" });
  } catch (error) {
    console.error("Error sending query reply:", error);
    res.status(500).json({ message: "Failed to send reply" });
  }
};

export const deleteQuery = async (req, res) => {
  try {
    const { query } = req.body;
    const id = query._id;
    // Find and delete the query by ID
    const deletedQuery = await Query.findByIdAndDelete(id);

    if (!deletedQuery) {
      return res.status(404).json({ message: "Query not found" });
    }

    res.status(200).json({ message: "Query deleted successfully" });
  } catch (error) {
    console.error("Error deleting query:", error);
    res.status(500).json({ message: "Failed to delete query" });
  }
};

// Export queries to Excel
export const exportQueriesToExcel = async (req, res) => {
  try {
    // Build filter object based on query parameters
    const filter = {};

    // Add status filter if provided and not 'all'
    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    // Add search functionality (search by email or query content)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [{ email: searchRegex }, { query: searchRegex }];
    }

    // Extract sort parameter from query params
    const sortParam = req.query.sort || "-createdAt";

    // Fetch queries with filters
    const queries = await Query.find(filter).sort(sortParam).lean();

    if (queries.length === 0) {
      return res.status(404).json({
        message: "No queries found with the current filters",
      });
    }

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Customer Queries");

    // Define columns
    worksheet.columns = [
      { header: "Query ID", key: "id", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Query", key: "query", width: 50 },
      { header: "Status", key: "status", width: 15 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Format header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add data to worksheet
    queries.forEach((query) => {
      // Format date
      const createdAtDate = new Date(query.createdAt);

      // Add row
      worksheet.addRow({
        id: query._id.toString(),
        email: query.email,
        query: query.query,
        status: query.status,
        createdAt: createdAtDate.toLocaleString(),
      });
    });

    // Create a buffer to store the workbook
    const buffer = await workbook.xlsx.writeBuffer();

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Get current date for filename
    const today = new Date().toISOString().split("T")[0];

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=customer_queries_${today}.xlsx`
    );

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting queries to Excel:", error);
    res.status(500).json({
      message: "Failed to export queries",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
