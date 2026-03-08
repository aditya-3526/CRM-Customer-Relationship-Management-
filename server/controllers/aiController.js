const Customer = require('../models/Customer');
const Communication = require('../models/Communication');
const { GoogleGenAI } = require('@google/genai');

// @desc    Generate AI insights for a customer
// @route   POST /api/ai/customer-insights
// @access  Private
exports.generateCustomerInsights = async (req, res, next) => {
    try {
        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({ success: false, error: 'Please specify a customer' });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        const communications = await Communication.find({ customerId })
            .sort('-date')
            .limit(20);

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const commSummary = communications.length > 0
            ? communications.map(c => `${c.type} on ${new Date(c.date).toLocaleDateString()} - ${c.status} - ${c.priority} priority - "${c.notes?.substring(0, 100)}"`).join('\n')
            : 'No communications recorded yet.';

        const daysSinceLastContact = communications.length > 0
            ? Math.floor((Date.now() - new Date(communications[0].date).getTime()) / (1000 * 60 * 60 * 24))
            : null;

        const prompt = `
      You are a CRM analytics AI. Analyze this customer's profile and engagement history, then return ONLY valid JSON (no markdown, no code blocks).

      Customer Profile:
      - Name: ${customer.name}
      - Industry: ${customer.industry || 'Unknown'}
      - Location: ${customer.location || 'Unknown'}
      - Status: ${customer.status}
      - Pipeline Stage: ${customer.stage || 'Lead'}
      - Deal Value: $${customer.value.toLocaleString()}
      - Days since last contact: ${daysSinceLastContact !== null ? daysSinceLastContact : 'Never contacted'}
      - Total interactions: ${communications.length}

      Recent Communication History:
      ${commSummary}

      Return this exact JSON structure:
      {
        "engagement_score": <number 1-10>,
        "churn_risk": "<low|medium|high>",
        "recommended_action": "<one clear sentence>",
        "summary": "<2-3 sentence analysis>",
        "next_best_step": "<specific actionable suggestion>"
      }
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let insights;
        try {
            // Strip any markdown code fences if present
            let text = response.text.trim();
            text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            insights = JSON.parse(text);
        } catch (parseErr) {
            insights = {
                engagement_score: communications.length > 3 ? 7 : communications.length > 0 ? 4 : 1,
                churn_risk: daysSinceLastContact === null ? 'high' : daysSinceLastContact > 30 ? 'high' : daysSinceLastContact > 14 ? 'medium' : 'low',
                recommended_action: daysSinceLastContact === null ? 'Schedule an initial outreach call.' : 'Follow up on recent conversation.',
                summary: `Customer has ${communications.length} recorded interactions. ${daysSinceLastContact !== null ? `Last contacted ${daysSinceLastContact} days ago.` : 'No contact recorded yet.'}`,
                next_best_step: 'Schedule a follow-up communication.',
            };
        }

        res.status(200).json({ success: true, data: insights });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Natural language search
// @route   POST /api/ai/natural-search
// @access  Private
exports.naturalLanguageSearch = async (req, res, next) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ success: false, error: 'Please provide a search query' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `
      You are a MongoDB query translator. Convert the following natural language query into a MongoDB filter object for a Customer collection.

      Customer Schema fields:
      - name (String)
      - email (String)
      - phone (String)
      - industry (String)
      - location (String)
      - status (String: "Active", "Inactive", "Pending")
      - stage (String: "Lead", "Contacted", "Proposal", "Negotiation", "Closed Won")
      - value (Number - deal value in dollars)
      - createdAt (Date)

      Natural language query: "${query}"

      Return ONLY valid JSON with this structure (no markdown, no code blocks):
      {
        "filter": { <mongodb filter object> },
        "description": "<human-readable interpretation of the query>"
      }

      Use $regex with $options "i" for text searches.
      Use $gte, $lte for number/date ranges.
      For relative dates like "last month", calculate from today: ${new Date().toISOString()}.
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let parsed;
        try {
            let text = response.text.trim();
            text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            parsed = JSON.parse(text);
        } catch (parseErr) {
            // Fallback to basic text search
            parsed = {
                filter: {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } },
                        { industry: { $regex: query, $options: 'i' } },
                        { location: { $regex: query, $options: 'i' } },
                    ],
                },
                description: `Text search for "${query}"`,
            };
        }

        const customers = await Customer.find(parsed.filter).limit(20).sort('-value');

        res.status(200).json({
            success: true,
            data: {
                customers,
                filter: parsed.filter,
                description: parsed.description,
                count: customers.length,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
