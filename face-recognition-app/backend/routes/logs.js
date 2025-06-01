const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// Get all logs with user details
router.get('/', async (req, res) => {
  try {
    const logs = await Log.find()
      .populate('userId', 'name')
      .sort({ czas: -1 });
    
    // Transform the data to match the frontend expectations
    const transformedLogs = logs.map(log => ({
      ...log.toObject(),
      user: log.userId ? { _id: log.userId._id, name: log.userId.name } : null
    }));
    
    res.json(transformedLogs);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Update a log
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const log = await Log.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('userId', 'name');

    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    // Transform the data to match the frontend expectations
    const transformedLog = {
      ...log.toObject(),
      user: log.userId ? { _id: log.userId._id, name: log.userId.name } : null
    };

    res.json(transformedLog);
  } catch (err) {
    console.error('Error updating log:', err);
    res.status(500).json({ error: 'Failed to update log' });
  }
});

module.exports = router; 