const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const FormData = require('form-data');



// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Register new user
router.post('/register', upload.single('image'), async (req, res) => {
  console.log('Received registration request');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('File:', req.file);

  try {
    if (!req.file) {
      console.error('No image file in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { name } = req.body;
    if (!name) {
      console.error('No name provided in request');
      return res.status(400).json({ error: 'Name is required' });
    }

    console.log('Creating new user with name:', name);

    // Create new user
    const user = new User({
      name,
      registrationDate: new Date()
    });
    
    console.log('Saving user to database...');
    await user.save();
    console.log('User saved with ID:', user._id);

    // Get face embedding from Python service
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));
    formData.append('userId', user._id.toString());

    console.log('Sending request to Python service...');
    try {
      const response = await axios.post('http://127.0.0.1:5000/create-embedding', formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 5000,
        proxy: false
      });

      console.log('Received response from Python service:', response.data);

      // Update user with embedding
      user.embedding = response.data.embedding;
      await user.save();
      console.log('Updated user with embedding');

    } catch (pythonError) {
      console.error('Error from Python service:', {
        error: pythonError.message,
        response: pythonError.response?.data,
        stack: pythonError.stack
      });
      // Delete the user if embedding creation failed
      await User.findByIdAndDelete(user._id);
      throw new Error('Failed to create face embedding');
    }

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    console.log('Cleaned up temporary file');

    res.json({ 
      message: 'User registered successfully',
      userId: user._id,
      name: user.name
    });
  } catch (error) {
    console.error('User registration error:', {
      message: error.message,
      stack: error.stack
    });

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: 'User registration failed',
      details: error.message 
    });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('_id name registrationDate');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

//recognize face

router.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Przygotuj dane dla Python API
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));

    // Wyślij do serwera Pythona
    const response = await axios.post('http://127.0.0.1:5000/recognize-face', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    // Usuń tymczasowy plik
    fs.unlinkSync(req.file.path);

    const result = response.data;

    if (result.recognized) {
      // Pobierz dane użytkownika z MongoDB
      const user = await User.findById(result.userId).select('_id name registrationDate');

      if (!user) {
        return res.status(404).json({ error: 'User embedding matched, but user not found in DB' });
      }

      return res.json({
        recognized: true,
        user: {
          id: user._id,
          name: user.name,
          registrationDate: user.registrationDate
        },
        similarity_score: result.similarity_score
      });
    } else {
      return res.status(404).json({
        recognized: false,
        message: 'No matching user found'
      });
    }
  } catch (error) {
    console.error('Face recognition error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Face recognition failed', details: error.message });
  }
});

// Verify face
router.post('/verify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Send to Python service for verification
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));
    formData.append('userId', userId);

    const response = await axios.post('http://127.0.0.1:5000/verify-face', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json(response.data);
  } catch (error) {
    console.error('Face verification error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Face verification failed' });
  }
});

module.exports = router; 