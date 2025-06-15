const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

const { client: mqttClient, setPendingUserId } = require('../mqttClient');

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

// Get a measurement for User

const triggerMesurementTopic = "sensor/pomiar";
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Zapisz userId w pendingUserId
    setPendingUserId(userId);

    // Wyślij sygnał do czujnika
    mqttClient.publish(triggerMesurementTopic, "");

    res.status(200).json({ message: "Measurement triggered for userId: " + userId });
  } catch (err) {
    console.error('Error updating log:', err);
    res.status(500).json({ error: 'Failed to get measurements for userId' });
  }
});

router.get('/latest/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const lastLog = await Log.findOne({ userId })
      .sort({ czas: -1 }); // najnowszy wpis

    if (!lastLog) {
      return res.status(404).json({ error: 'No log found for user' });
    }

    res.json(lastLog);
  } catch (err) {
    console.error('Error getting latest log:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Update a log
// router.put('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const log = await Log.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true }
//     ).populate('userId', 'name');

//     if (!log) {
//       return res.status(404).json({ error: 'Log not found' });
//     }

//     // Transform the data to match the frontend expectations
//     const transformedLog = {
//       ...log.toObject(),
//       user: log.userId ? { _id: log.userId._id, name: log.userId.name } : null
//     };

//     res.json(transformedLog);
//   } catch (err) {
//     console.error('Error updating log:', err);
//     res.status(500).json({ error: 'Failed to update log' });
//   }
// });

module.exports = router; 