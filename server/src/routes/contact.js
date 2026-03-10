import express from 'express';
import { Contact } from '../db/Contact.js';

const router = express.Router();

// POST /api/contact — public endpoint
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (name.length > 100 || email.length > 200 || subject.length > 200 || message.length > 2000) {
            return res.status(400).json({ error: 'Field too long' });
        }

        const contact = new Contact({ name, email, subject, message });
        await contact.save();

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error('Contact submit error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

export default router;
