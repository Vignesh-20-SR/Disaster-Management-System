import { Router } from 'express';
import VictimRequest from '../models/VictimRequest.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { BASE_PRECAUTIONS, PRECAUTIONS_BY_TYPE } from '../constants/precautions.js';

const router = Router();

// Get all victim requests (for volunteers)
router.get('/requests', auth(['volunteer']), async (req, res) => {
  try {
    const items = await VictimRequest.find().sort({ createdAt: -1 }).populate('victim', 'name email phone location').populate('assignedVolunteer', 'name email');
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Accept a victim request
router.post('/requests/:id/accept', auth(['volunteer']), async (req, res) => {
  try {
    const item = await VictimRequest.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (item.assignedVolunteer && String(item.assignedVolunteer) !== req.user.id) {
      return res.status(409).json({ error: 'Already assigned' });
    }
    item.assignedVolunteer = req.user.id;
    item.status = 'accepted';
    await item.save();
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send ETA
router.post('/requests/:id/eta', auth(['volunteer']), async (req, res) => {
  try {
    const { etaMinutes } = req.body;
    const item = await VictimRequest.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (!item.assignedVolunteer) item.assignedVolunteer = req.user.id;
    if (String(item.assignedVolunteer) !== req.user.id) return res.status(403).json({ error: 'Not assigned to you' });
    item.etaMinutes = etaMinutes;
    item.status = 'in_progress';
    item.responses.push({ volunteer: req.user.id, message: `ETA set to ${etaMinutes} minutes`, etaMinutes });
    await item.save();
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Resend precautions or custom message
router.post('/requests/:id/message', auth(['volunteer']), async (req, res) => {
  try {
    const { message, resendPrecautions } = req.body;
    const item = await VictimRequest.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (!item.assignedVolunteer) item.assignedVolunteer = req.user.id;
    if (String(item.assignedVolunteer) !== req.user.id) return res.status(403).json({ error: 'Not assigned to you' });

    let finalMessage = message || '';
    if (resendPrecautions) {
      const typed = PRECAUTIONS_BY_TYPE[item.disasterType] || [];
      const list = [...BASE_PRECAUTIONS, ...typed];
      finalMessage = `${finalMessage ? finalMessage + ' ' : ''}Precautions: ${list.join('; ')}`;
      item.precautions = list;
    }
    if (!finalMessage) finalMessage = 'Stay safe. Help is on the way.';
    item.responses.push({ volunteer: req.user.id, message: finalMessage });
    await item.save();
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mark completed
router.post('/requests/:id/complete', auth(['volunteer']), async (req, res) => {
  try {
    const item = await VictimRequest.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (String(item.assignedVolunteer) !== req.user.id) return res.status(403).json({ error: 'Not assigned to you' });
    item.status = 'completed';
    item.responses.push({ volunteer: req.user.id, message: 'Request marked as completed.' });
    await item.save();
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
