import { Router } from 'express';
import VictimRequest from '../models/VictimRequest.js';
import { auth } from '../middleware/auth.js';
import { BASE_PRECAUTIONS, PRECAUTIONS_BY_TYPE } from '../constants/precautions.js';

const router = Router();

// Create a new victim request
router.post('/requests', auth(['victim']), async (req, res) => {
  try {
    const { 
      disasterType, 
      resourcesNeeded = [], 
      description, 
      phone, 
      email, 
      location, 
      name, 
      coordinates,
      weather,
      timestamp
    } = req.body;
    
    const precautions = [...BASE_PRECAUTIONS, ...(PRECAUTIONS_BY_TYPE[disasterType] || [])];
    
    // Prepare the request data
    const requestData = {
      victim: req.user.id,
      name: name || req.user.name,
      email,
      phone,
      location,
      disasterType,
      resourcesNeeded,
      description,
      precautions,
      createdAt: timestamp ? new Date(timestamp) : new Date()
    };
    
    // Add coordinates if available
    if (coordinates && coordinates.lat && coordinates.lng) {
      requestData.coordinates = {
        type: 'Point',
        coordinates: [coordinates.lng, coordinates.lat] // GeoJSON uses [longitude, latitude]
      };
    }
    
    // Add weather data if available
    if (weather) {
      requestData.weather = weather;
    }
    
    const doc = await VictimRequest.create(requestData);
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get my victim requests
router.get('/me', auth(['victim']), async (req, res) => {
  try {
    const items = await VictimRequest.find({ victim: req.user.id })
      .sort({ createdAt: -1 })
      .populate('assignedVolunteer', 'name email')
      .lean();
      
    // Format coordinates for the frontend
    const formattedItems = items.map(item => {
      if (item.coordinates && item.coordinates.coordinates) {
        const [lng, lat] = item.coordinates.coordinates;
        return {
          ...item,
          coordinates: { lat, lng },
          _id: item._id.toString()
        };
      }
      return { ...item, _id: item._id.toString() };
    });
    
    res.json(formattedItems);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single request by id (owner only)
router.get('/requests/:id', auth(['victim']), async (req, res) => {
  try {
    const item = await VictimRequest.findById(req.params.id).populate('assignedVolunteer', 'name email');
    if (!item || String(item.victim) !== req.user.id) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Submit review after completion
router.post('/requests/:id/review', auth(['victim']), async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const item = await VictimRequest.findById(req.params.id);
    if (!item || String(item.victim) !== req.user.id) return res.status(404).json({ error: 'Not found' });
    if (item.status !== 'completed') return res.status(400).json({ error: 'Request not completed yet' });
    item.review = { rating, feedback, at: new Date() };
    if (rating || feedback) {
      const msg = `Victim review: ${'⭐'.repeat(Number(rating||0))}${rating?` (${rating}/5)`:''}${feedback?` - ${feedback}`:''}`;
      item.responses.push({ volunteer: item.assignedVolunteer, message: msg });
    }
    await item.save();
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get precautions by type
router.get('/precautions/:type', (req, res) => {
  const type = req.params.type;
  const list = [...BASE_PRECAUTIONS, ...(PRECAUTIONS_BY_TYPE[type] || [])];
  res.json({ type, precautions: list });
});

export default router;
