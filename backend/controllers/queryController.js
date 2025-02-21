import Query from '../models/Query.js';
import nodemailer from 'nodemailer';

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
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
      subject: 'New Query from Uncle Nomad Website',
      text: `New query received:\n\nEmail: ${email}\n\nQuery: ${query}`
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Query submitted successfully' });
  } catch (error) {
    console.error('Error submitting query:', error);
    res.status(500).json({ message: 'Failed to submit query' });
  }
};

// Get all queries (for admin panel)
export const getQueries = async (req, res) => {
  try {
    const queries = await Query.find().sort({ createdAt: -1 });
    res.status(200).json(queries);
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ message: 'Failed to fetch queries' });
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
      return res.status(404).json({ message: 'Query not found' });
    }

    res.status(200).json(updatedQuery);
  } catch (error) {
    console.error('Error updating query status:', error);
    res.status(500).json({ message: 'Failed to update query status' });
  }
};

export const sendQueryReply = async (req, res) => {
  try {
    const { email, message } = req.body;

    const query = await Query.findOne({ email });

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reply to your query from Uncle Nomad',
      text: `Dear Customer,\n\nThank you for contacting us. Here is our response to your query:\n\n${message}\n\nBest regards,\nThe Uncle Nomad Team`
    };

    await transporter.sendMail(mailOptions);

    query.status = 'resolved'; // or any status you prefer
    await query.save();

    res.status(200).json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Error sending query reply:', error);
    res.status(500).json({ message: 'Failed to send reply' });
  }
};

export const deleteQuery = async (req, res) => {
  try {
    const { query } = req.body;
    const id = query._id
    // Find and delete the query by ID
    const deletedQuery = await Query.findByIdAndDelete(id);

    if (!deletedQuery) {
      return res.status(404).json({ message: 'Query not found' });
    }

    res.status(200).json({ message: 'Query deleted successfully' });
  } catch (error) {
    console.error('Error deleting query:', error);
    res.status(500).json({ message: 'Failed to delete query' });
  }
};
