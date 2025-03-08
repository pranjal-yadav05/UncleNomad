import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET; // Should be moved to env in production

// Endpoint to verify admin credentials
router.post('/verify', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  } catch (error) {
    console.error('Error during authentication:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to update admin credentials
router.post('/update-credentials', async (req, res) => {
  const { currentUsername, currentPassword, newUsername, newPassword } = req.body;

  try {
    // Verify current credentials
    const admin = await Admin.findOne({ username: currentUsername });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid current credentials' });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid current credentials' });
    }

    // Update credentials
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    admin.username = newUsername;
    admin.password = hashedPassword;
    await admin.save();

    return res.json({ message: 'Credentials updated successfully' });
  } catch (error) {
    console.error('Error updating credentials:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


export default router;
