/**
 * AI Travel Assistant routes
 * Provides intelligent responses to travel-related questions
 * Supports: DeepSeek API (primary), OpenAI API (fallback), Rule-based (final fallback)
 */

const express = require('express');
const axios = require('axios');

const router = express.Router();

/**
 * AI assistant with DeepSeek integration
 * DeepSeek API provides high-quality responses for travel questions
 */

// Enhanced knowledge base with more keywords and intelligent responses
const travelKnowledgeBase = {
  // Time and season related
  'best time': 'The best time to visit depends on your destination. Generally, spring (March-May) and fall (September-November) offer pleasant weather and fewer crowds. Summer is peak season but can be crowded and expensive.',
  'when to visit': 'The best time to visit depends on your destination. Generally, spring (March-May) and fall (September-November) offer pleasant weather and fewer crowds.',
  'season': 'Travel seasons vary by destination. Spring and fall are generally ideal for most places - good weather, fewer crowds, and better prices than peak summer.',
  
  // Packing related
  'packing': 'Pack light, bring versatile clothing, check weather forecasts, and remember essentials like passport, travel insurance, and chargers.',
  'pack': 'Pack light, bring versatile clothing, check weather forecasts, and remember essentials like passport, travel insurance, and chargers.',
  'what to bring': 'Essentials: passport, travel insurance, chargers, versatile clothing, comfortable shoes, first aid kit, and copies of important documents.',
  'luggage': 'Pack light with versatile items. Roll clothes to save space. Bring essentials only and remember you can buy things at your destination.',
  
  // Budget related
  'budget': 'Consider staying in hostels, using public transportation, eating local food, and booking flights in advance for better deals.',
  'cheap': 'Save money by staying in hostels or budget hotels, using public transport, eating at local restaurants, and booking flights 2-3 months in advance.',
  'save money': 'Book flights early, stay in hostels, use public transportation, eat local food, avoid tourist traps, and travel during off-peak seasons.',
  'expensive': 'Travel costs vary. Save by booking early, choosing budget accommodations, using public transport, and eating where locals eat.',
  
  // Safety related
  'safe': 'Keep copies of important documents, stay aware of your surroundings, avoid displaying valuables, and research local customs and laws.',
  'safety': 'Keep copies of important documents, stay aware of your surroundings, avoid displaying valuables, and research local customs and laws.',
  'dangerous': 'Research your destination, stay aware of your surroundings, keep copies of documents, avoid displaying valuables, and follow local advice.',
  
  // Visa and documents
  'visa': 'Visa requirements vary by country and your nationality. Check with the embassy or consulate of your destination country well in advance.',
  'passport': 'Ensure your passport is valid for at least 6 months beyond your travel dates. Check visa requirements for your destination.',
  'documents': 'Essential documents: valid passport, travel insurance, visas (if required), copies of important documents, and emergency contacts.',
  
  // Destinations
  'japan': 'Japan offers amazing culture, food, and technology. Best times: spring (cherry blossoms) and fall (autumn colors). Must-see: Tokyo, Kyoto, and Mount Fuji.',
  'italy': 'Italy is perfect for history, art, and food lovers. Visit Rome, Florence, and Venice. Best time: spring or fall to avoid summer crowds.',
  'france': 'France offers culture, cuisine, and beautiful landscapes. Paris is a must, but also explore the countryside. Best time: spring or fall.',
  'thailand': 'Thailand offers beautiful beaches, rich culture, and affordable travel. Best time: November to March (dry season). Great for budget travelers.',
  'spain': 'Spain offers vibrant culture, beautiful architecture, and delicious food. Best time: spring or fall. Must-see: Barcelona, Madrid, and Seville.',
  
  // Transportation
  'flight': 'Book flights 2-3 months in advance for best prices. Use flight comparison sites, be flexible with dates, and consider nearby airports.',
  'transport': 'Use public transportation when possible - it\'s cheaper and often more convenient. Consider city passes for unlimited travel.',
  
  // Accommodation
  'hotel': 'Book accommodations in advance, especially during peak season. Consider hostels, Airbnb, or guesthouses for budget options.',
  'stay': 'Options include hotels, hostels, Airbnb, and guesthouses. Book in advance for better prices and availability.',
  
  // Food
  'food': 'Try local cuisine! Eat where locals eat for authentic and affordable meals. Be adventurous but also cautious with street food.',
  'restaurant': 'Eat where locals eat for authentic and affordable meals. Avoid tourist traps near major attractions.',
  
  // General travel advice
  'first time': 'For first-time travelers: plan ahead, pack light, keep copies of documents, get travel insurance, and be open to new experiences!',
  'solo': 'Solo travel is rewarding! Stay in hostels to meet people, keep family informed of your plans, trust your instincts, and enjoy the freedom.',
  'family': 'Family travel requires extra planning. Choose family-friendly destinations, pack entertainment for kids, and allow extra time for everything.',
};

/**
 * POST /api/ai/chat
 * Chat with AI travel assistant
 * Request body: { message }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    console.log('AI chat request received:', { message: message?.substring(0, 50) });

    if (!message || typeof message !== 'string') {
      console.error('Invalid message:', message);
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    const userMessage = message.toLowerCase().trim();
    
    if (!userMessage) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Try to use AI API for intelligent responses
    // Priority: DeepSeek > OpenAI > Hugging Face > Rule-based
    
    // Option 1: Try DeepSeek API if key is available (primary AI provider)
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    console.log('Checking DeepSeek API key:', deepseekApiKey ? 'Found' : 'Not found');
    
    if (deepseekApiKey && deepseekApiKey.trim() !== '') {
      try {
        console.log('Attempting DeepSeek API call...');
        const deepseekResponse = await axios.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: 'deepseek-chat', // or 'deepseek-reasoner' for more complex reasoning
            messages: [
              {
                role: 'system',
                content: 'You are a helpful and knowledgeable travel assistant. Provide concise, practical, and accurate advice about travel planning, destinations, travel tips, packing, budgeting, safety, and all travel-related topics. Answer in a friendly, informative, and conversational manner. Always provide specific and actionable advice when possible.'
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 500,
            temperature: 0.7,
            stream: false
          },
          {
            headers: {
              'Authorization': `Bearer ${deepseekApiKey.trim()}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout for DeepSeek
          }
        );

        if (deepseekResponse.data && deepseekResponse.data.choices && deepseekResponse.data.choices[0]) {
          const aiResponse = deepseekResponse.data.choices[0].message.content;
          console.log('✅ DeepSeek response received successfully');
          return res.json({
            response: aiResponse,
            source: 'DeepSeek AI'
          });
        } else {
          console.error('❌ DeepSeek API returned invalid response structure:', deepseekResponse.data);
        }
      } catch (deepseekError) {
        const errorDetails = {
          message: deepseekError.message,
          status: deepseekError.response?.status,
          statusText: deepseekError.response?.statusText,
          data: deepseekError.response?.data,
          code: deepseekError.code
        };
        console.error('❌ DeepSeek API error:', JSON.stringify(errorDetails, null, 2));
        
        // If it's an authentication error, don't fall through - return error
        if (deepseekError.response?.status === 401 || deepseekError.response?.status === 403) {
          console.error('⚠️ DeepSeek API authentication failed - check your API key');
          // Still fall through to allow other options
        }
        // Fall through to other options
      }
    } else {
      console.log('⚠️ DeepSeek API key not configured, skipping...');
    }

    // Check if DeepSeek failed due to payment issue
    // If so, we should inform the user but still try other options

    // Option 2: Try OpenAI API if key is available (fallback)
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful travel assistant. Provide concise, practical advice about travel planning, destinations, and travel tips. Answer in a friendly and informative manner.'
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 300,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          }
        );

        const aiResponse = openaiResponse.data.choices[0].message.content;
        console.log('OpenAI response received');
        return res.json({
          response: aiResponse,
          source: 'OpenAI'
        });
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError.response?.data || openaiError.message);
        // Fall through to other options
      }
    }

    // Option 3: Try Hugging Face free API (no key required, but rate limited)
    // Using a simple text generation model for travel advice
    try {
      const huggingFaceResponse = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        {
          inputs: {
            past_user_inputs: [],
            generated_responses: [],
            text: `You are a travel assistant. User asks: ${message}. Provide helpful travel advice:`
          },
          parameters: {
            max_length: 200,
            temperature: 0.7,
            return_full_text: false
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 second timeout
        }
      );

      if (huggingFaceResponse.data && huggingFaceResponse.data.generated_text) {
        let aiResponse = huggingFaceResponse.data.generated_text.trim();
        // Clean up the response
        aiResponse = aiResponse.replace(/^.*?travel assistant.*?:/i, '').trim();
        if (aiResponse && aiResponse.length > 10) {
          console.log('Hugging Face response received');
          return res.json({
            response: aiResponse,
            source: 'Hugging Face AI'
          });
        }
      }
    } catch (hfError) {
      console.log('Hugging Face API not available, using rule-based:', hfError.message);
      // Fall through to rule-based
    }

    // Option 3: Use improved rule-based system with better pattern matching
    console.log('Using rule-based assistant for message:', userMessage.substring(0, 50));

    // Enhanced rule-based response system with better matching
    let response = null;
    let bestMatch = null;
    let bestMatchLength = 0;

    // Check for keywords in user message (find longest match for better accuracy)
    for (const [keyword, answer] of Object.entries(travelKnowledgeBase)) {
      if (userMessage.includes(keyword)) {
        // Prefer longer, more specific matches
        if (keyword.length > bestMatchLength) {
          bestMatch = answer;
          bestMatchLength = keyword.length;
        }
      }
    }

    if (bestMatch) {
      response = bestMatch;
    }

    // Enhanced pattern matching for common questions
    if (!response) {
      // Greetings
      if (userMessage.match(/\b(hello|hi|hey|greetings)\b/)) {
        response = 'Hello! I\'m your travel assistant. I can help you with travel planning, destination recommendations, packing tips, budget advice, safety tips, and more. What would you like to know?';
      }
      // Help requests
      else if (userMessage.match(/\b(help|assist|support|guide)\b/)) {
        response = 'I can help you with: best travel times, packing tips, budget travel advice, safety tips, visa requirements, destination recommendations, flight booking, and accommodation. What specific topic would you like help with?';
      }
      // Recommendations
      else if (userMessage.match(/\b(recommend|suggest|where should|where to go|best place|destination)\b/)) {
        response = 'Great destinations to consider: Japan for culture and food, Italy for history and art, New Zealand for nature, Iceland for unique landscapes, Thailand for beaches and affordability, Spain for vibrant culture, and France for art and cuisine. What type of experience are you looking for?';
      }
      // Questions about specific countries
      else if (userMessage.match(/\b(about|tell me|information|know)\b.*\b(country|place|destination|city)\b/)) {
        response = 'I can provide information about many destinations! Try asking about a specific country like "Tell me about Japan" or "What should I know about Italy?" I can help with travel tips, best times to visit, and what to see.';
      }
      // Cost/money questions
      else if (userMessage.match(/\b(how much|cost|price|expensive|cheap|budget|money)\b/)) {
        response = 'Travel costs vary greatly by destination and travel style. Budget tips: book flights 2-3 months early, stay in hostels or budget hotels, use public transport, eat local food, and travel during off-peak seasons. Would you like advice for a specific destination?';
      }
      // Time/duration questions
      else if (userMessage.match(/\b(how long|duration|days|weeks|time needed|stay)\b/)) {
        response = 'The ideal trip duration depends on your destination and interests. Major cities: 3-5 days, countries: 1-2 weeks minimum. Consider travel time, jet lag, and allowing time to truly experience each place. What destination are you planning for?';
      }
      // Weather/climate questions
      else if (userMessage.match(/\b(weather|climate|temperature|rain|sunny|cold|hot)\b/)) {
        response = 'Weather varies by destination and season. Research your destination\'s climate for your travel dates. Generally, spring and fall offer the best weather in most places. Would you like specific weather information for a destination?';
      }
      // General travel questions - provide more helpful response
      else {
        // Try to extract key topics from the message
        const hasQuestionWord = userMessage.match(/\b(what|where|when|why|how|which|who)\b/);
        const hasTravelWord = userMessage.match(/\b(travel|trip|vacation|journey|visit|go|see)\b/);
        
        if (hasQuestionWord && hasTravelWord) {
          response = `I'd be happy to help with your travel question about "${message.substring(0, 50)}"! Could you provide a bit more detail? For example, are you asking about a specific destination, travel dates, budget, or activities? I can help with planning, recommendations, tips, and advice.`;
        } else {
          response = 'I understand you\'re asking about travel. I can help with: destination recommendations, best times to visit, packing tips, budget travel, safety advice, visa requirements, flight booking, and more. Could you be more specific about what you\'d like to know? For example, "What should I pack for Japan?" or "Best time to visit Italy?"';
        }
      }
    }

    if (!response) {
      console.error('No response generated for message:', userMessage);
      response = 'I apologize, but I couldn\'t understand your question. Could you please rephrase it? I can help with travel planning, packing tips, destination recommendations, and more.';
    }

    console.log('Sending response:', response.substring(0, 50));
    res.json({
      response: response,
      source: 'Rule-based Assistant'
    });
  } catch (error) {
    console.error('AI chat error:', error);
    const errorMessage = error.message || 'Failed to process chat message';
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;


