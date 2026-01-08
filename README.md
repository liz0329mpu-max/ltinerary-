# Travel Itinerary Planner

A comprehensive travel itinerary planning website with user authentication, interactive maps, real-time currency conversion, and AI-powered travel assistance.

## Features

- **User Authentication**: Secure registration and login system with JWT tokens
- **Itinerary Management**: Create, save, edit, and delete travel itineraries
- **Interactive Maps**: Display itinerary attractions on an interactive map using Leaflet
- **Cover Images**: Add cover images to your travel itineraries
- **Currency Converter**: Real-time multi-currency conversion with exchange rate information
- **AI Travel Assistant**: Intelligent chatbot for travel-related questions and recommendations

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **lowdb** - Lightweight JSON database (no compilation required)
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Axios** - HTTP client for external APIs

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Leaflet** - Interactive maps
- **Axios** - HTTP client

### External APIs
- **ExchangeRate-API** - Currency exchange rates (free tier, daily updates)
- **DeepSeek API** - AI assistant (primary, requires API key)
- **OpenAI API** - AI assistant (fallback, optional, requires API key)
- **OpenStreetMap** - Map tiles (free)

## Project Structure

```
travel-itinerary-planner/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── AIAssistant.tsx      # AI chat assistant
│   │   │   ├── CurrencyConverter.tsx # Currency conversion tool
│   │   │   └── MapView.tsx          # Interactive map component
│   │   ├── pages/               # Page components
│   │   │   ├── Login.tsx            # Login page
│   │   │   ├── Register.tsx         # Registration page
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   └── ItineraryDetail.tsx  # Itinerary details page
│   │   ├── utils/
│   │   │   └── api.ts           # API utility functions
│   │   ├── App.tsx              # Main app component
│   │   └── main.tsx             # Application entry point
│   ├── package.json
│   └── vite.config.ts
│
├── server/                      # Backend Express server
│   ├── routes/                 # API route handlers
│   │   ├── auth.js            # Authentication routes
│   │   ├── itinerary.js       # Itinerary management routes
│   │   ├── currency.js        # Currency conversion routes
│   │   └── ai.js              # AI assistant routes
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── database/
│   │   └── db.js              # Database initialization
│   └── index.js               # Server entry point
│
├── database/                   # Database storage (JSON files)
│   └── travel.json            # Main database file
│
├── package.json               # Root package.json with scripts
├── .env                       # Environment variables (create this)
└── README.md                  # This file
```

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

## Installation

### Step 1: Install Dependencies

Install all dependencies for both backend and frontend:

```bash
npm run install-all
```

This command will:
1. Install backend dependencies (root directory)
2. Install frontend dependencies (client directory)

Alternatively, install them separately:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root directory:

```env
# Server Configuration
PORT=5000

# JWT Secret Key (change this to a random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# DeepSeek API Key (recommended - for AI assistant)
# Get your API key from: https://platform.deepseek.com/
# If not provided, will fallback to OpenAI or rule-based assistant
DEEPSEEK_API_KEY=your-deepseek-api-key

# OpenAI API Key (optional - fallback for AI assistant)
# If not provided, the app will use rule-based assistant
OPENAI_API_KEY=your-openai-api-key-optional
```

**Important Notes:**
- `JWT_SECRET`: Generate a random string (at least 32 characters) for production
- `OPENAI_API_KEY`: Optional. If not provided, AI assistant uses rule-based responses
- Never commit `.env` file to version control (already in `.gitignore`)

## Running the Application

### Development Mode

Start both frontend and backend servers simultaneously:

```bash
npm run dev
```

This will start:
- **Backend server**: http://localhost:5000
- **Frontend application**: http://localhost:5173

Open your browser and navigate to: **http://localhost:5173**

### Running Separately

If you prefer to run them in separate terminals:

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

### Production Build

Build the frontend for production:

```bash
npm run build
```

The production build will be in `client/dist/`

Start production server:

```bash
npm run start:prod
```

## Dependencies

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web framework |
| cors | ^2.8.5 | Cross-origin resource sharing |
| bcryptjs | ^2.4.3 | Password hashing |
| jsonwebtoken | ^9.0.2 | JWT authentication |
| lowdb | ^7.0.1 | JSON database |
| dotenv | ^16.3.1 | Environment variables |
| axios | ^1.6.2 | HTTP client |

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI library |
| react-dom | ^18.2.0 | React DOM rendering |
| react-router-dom | ^6.20.1 | Client-side routing |
| axios | ^1.6.2 | HTTP client |
| leaflet | ^1.9.4 | Interactive maps |
| react-leaflet | ^4.2.1 | React wrapper for Leaflet |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | ^3.0.2 | Auto-restart server on changes |
| concurrently | ^8.2.2 | Run multiple commands |
| typescript | ^5.3.3 | TypeScript compiler |
| vite | ^5.0.8 | Build tool and dev server |
| @vitejs/plugin-react | ^4.2.1 | Vite React plugin |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Itineraries
- `GET /api/itinerary` - Get all user itineraries (authenticated)
- `GET /api/itinerary/:id` - Get specific itinerary (authenticated)
- `POST /api/itinerary` - Create new itinerary (authenticated)
- `PUT /api/itinerary/:id` - Update itinerary (authenticated)
- `DELETE /api/itinerary/:id` - Delete itinerary (authenticated)
- `POST /api/itinerary/:id/attraction` - Add attraction (authenticated)
- `DELETE /api/itinerary/:itineraryId/attraction/:attractionId` - Delete attraction (authenticated)

### Currency
- `GET /api/currency/rates?base=USD` - Get exchange rates
- `POST /api/currency/convert` - Convert currency
- `GET /api/currency/supported` - Get supported currencies

### AI Assistant
- `POST /api/ai/chat` - Chat with AI assistant

### Health Check
- `GET /api/health` - Server health status

## Database

The application uses **lowdb** (JSON file-based database) stored in `database/travel.json`.

**Database Structure:**
```json
{
  "users": [],
  "itineraries": [],
  "attractions": []
}
```

**Advantages:**
- No separate database server required
- Easy to backup (just copy JSON file)
- No compilation needed (pure JavaScript)
- Perfect for development and small projects

## Usage Guide

### 1. Register an Account
1. Navigate to http://localhost:5173
2. Click "Register here"
3. Fill in username, email, and password
4. Click "Register"

### 2. Create an Itinerary
1. After login, click "+ New Itinerary"
2. Enter title and description
3. (Optional) Add cover image URL
4. Click "Create Itinerary"

### 3. Add Attractions
1. Open an itinerary
2. Click "+ Add Attraction"
3. Fill in:
   - **Name** (required)
   - **Latitude** and **Longitude** (required)
   - Address, description, visit date/time (optional)
4. Click "Add Attraction"
5. Attraction will appear on the map

### 4. Use Currency Converter
1. In Dashboard sidebar, find "Currency Converter"
2. Enter amount
3. Select source and target currencies
4. Click "Convert"
5. View conversion result and exchange rate

### 5. Chat with AI Assistant
1. In Dashboard sidebar, find "AI Travel Assistant"
2. Type your question (e.g., "packing tips for Japan")
3. Click "Send"
4. Receive AI-powered response

## Getting Coordinates for Attractions

### Method 1: Google Maps
1. Go to https://www.google.com/maps
2. Search for your location
3. Right-click on the map
4. Click the first coordinate number
5. Copy latitude and longitude

### Method 2: Online Tools
- Visit https://www.latlong.net/
- Search for your location
- Copy coordinates

## Troubleshooting

### Port Already in Use
If port 5000 or 5173 is already in use:
- Change `PORT` in `.env` file
- Or modify `client/vite.config.ts` for frontend port

### Database Errors
- Ensure `database/` directory exists
- Delete `database/travel.json` if corrupted (will be recreated)
- Restart the server

### Frontend Can't Connect to Backend
- Ensure backend server is running
- Check `.env` file configuration
- Verify `client/vite.config.ts` proxy settings

### Currency Converter Not Working
- Check internet connection
- Verify ExchangeRate-API is accessible
- Check browser console for errors

### AI Assistant Not Responding
- Check server logs for errors
- Verify OpenAI API key if using OpenAI (optional)
- Rule-based assistant should work without API key

## Development

### Code Structure

**Backend:**
- Routes are organized by feature (auth, itinerary, currency, ai)
- Middleware handles authentication
- Database operations use lowdb (synchronous API)

**Frontend:**
- Components are reusable and modular
- Pages handle routing and main views
- API calls are centralized in `utils/api.ts`
- TypeScript provides type safety

### Adding New Features

1. **Backend Route**: Add new route in `server/routes/`
2. **Frontend Component**: Create component in `client/src/components/`
3. **API Integration**: Add API function in `client/src/utils/api.ts`
4. **Styling**: Add CSS file alongside component

## Production Deployment

See deployment configuration files:
- `railway.json` - Railway deployment config
- `render.yaml` - Render deployment config
- `vercel.json` - Vercel deployment config

For deployment instructions, refer to deployment guides or platform documentation.

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- API routes are protected with authentication middleware
- CORS is configured for frontend communication
- Environment variables are not committed to version control

## License

MIT License

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs for errors
3. Check browser console for frontend errors
4. Verify all dependencies are installed correctly

---

**Happy Travel Planning!** ✈️🌍

