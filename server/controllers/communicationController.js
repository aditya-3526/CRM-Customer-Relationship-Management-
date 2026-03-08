const Communication = require('../models/Communication');
const Customer = require('../models/Customer');
const Reminder = require('../models/Reminder');

// @desc    Get all communications
// @route   GET /api/communications
// @access  Public
exports.getCommunications = async (req, res, next) => {
  try {
    let query;

    if (req.params.customerId) {
      query = Communication.find({ customerId: req.params.customerId });
    } else {
      query = Communication.find().populate({
        path: 'customerId',
        select: 'name email',
      });
    }

    const communications = await query.sort('-date');

    res.status(200).json({
      success: true,
      count: communications.length,
      data: communications,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Get single communication
// @route   GET /api/communications/:id
// @access  Public
exports.getCommunication = async (req, res, next) => {
  try {
    const communication = await Communication.findById(req.params.id).populate({
      path: 'customerId',
      select: 'name email',
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        error: 'Communication not found',
      });
    }

    res.status(200).json({
      success: true,
      data: communication,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Create communication
// @route   POST /api/communications
// @access  Public
exports.createCommunication = async (req, res, next) => {
  try {
    // Add customer to body
    if (!req.body.customerId) {
      return res.status(400).json({
        success: false,
        error: 'Please specify a customer',
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(req.body.customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    const communication = await Communication.create(req.body);

    // Auto-create a follow-up reminder 3 days from now
    try {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 3);
      await Reminder.create({
        customerId: req.body.customerId,
        title: `Follow up with ${customer.name}`,
        description: `Follow up on ${req.body.type || 'communication'}: "${(req.body.notes || '').substring(0, 80)}"`,
        dueDate: followUpDate,
        type: 'follow_up',
        status: 'pending',
      });
    } catch (reminderErr) {
      console.error('Failed to auto-create reminder:', reminderErr.message);
    }

    res.status(201).json({
      success: true,
      data: communication,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update communication
// @route   PUT /api/communications/:id
// @access  Public
exports.updateCommunication = async (req, res, next) => {
  try {
    const communication = await Communication.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: 'customerId',
      select: 'name email',
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        error: 'Communication not found',
      });
    }

    res.status(200).json({
      success: true,
      data: communication,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Delete communication
// @route   DELETE /api/communications/:id
// @access  Public
exports.deleteCommunication = async (req, res, next) => {
  try {
    const communication = await Communication.findByIdAndDelete(req.params.id);

    if (!communication) {
      return res.status(404).json({
        success: false,
        error: 'Communication not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

const { GoogleGenAI } = require('@google/genai');

// @desc    Draft AI Email
// @route   POST /api/communications/draft-email
// @access  Private
exports.draftEmail = async (req, res, next) => {
  try {
    const { customerId, context } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, error: 'Please specify a customer' });
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Initialize Gemini API
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      You are a professional sales representative. Write a concise, professional follow-up email to a client named ${customer.name}.
      They work in the ${customer.industry || 'general'} industry.
      Additional context provided by the sales rep: "${context || 'Just checking in on our previous conversation.'}"
      
      The email should be clear, polite, and persuasive. Do not include subject lines or placeholders like [Your Name]. Just provide the body of the email.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.status(200).json({
      success: true,
      data: response.text,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};