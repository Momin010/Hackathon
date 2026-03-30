# Planera

Event planning and food management system for student entrepreneurship events at Aalto University. Planera uses AI to generate smart food recommendations based on event type, attendance, and dietary requirements from Luma RSVPs.

## Features

- **Event Discovery**: Automatically fetches events from Luma calendar
- **AI-Powered Recommendations**: Uses Vertex AI (Gemini 2.5 Pro) to generate food orders
- **Dietary Awareness**: Tracks lactose-free, gluten-free, nut-free, and vegan requirements
- **No-Show Prediction**: Adjusts headcount based on event type and historical data
- **Order History**: Save and track shopping lists with purchase status
- **Shopping Integration**: Quick link to S-kauppa for purchasing items

## Quick Start

### Prerequisites

- Node.js 18+ and Bun
- Supabase account (for database)
- Google Cloud Platform account with Vertex AI enabled
- Luma API key

### Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Google Cloud / Vertex AI
GCP_PROJECT_ID=your_gcp_project_id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Luma API
LUMA_API_KEY=your_luma_api_key
LUMA_BASE_URL=https://luma-mock-server.vercel.app
```

### Database Setup

Run the SQL migrations in your Supabase SQL Editor:

1. `supabase/schema.sql` - Creates orders and order_items tables
2. `supabase/notifications.sql` - Creates notifications table

### Running the App

**Backend (Next.js API):**
```bash
bun install
bun run dev
# Runs on http://localhost:3001
```

**Frontend (Vite + React):**
```bash
cd frontend
bun install
bun run dev
# Runs on http://localhost:3000
```

## How to Use

### 1. Dashboard
- View upcoming events from Luma
- Chat with the AI assistant to generate food recommendations
- See event summaries and quick actions

### 2. Events Page
- Browse all upcoming events
- See event details: name, date, type (Pizza Night, Workshop, Fireside Chat)
- Click "Plan Food" to start planning

### 3. Planning an Event
- Select an event from the Events page
- Click "Generate Order" to create an AI-powered shopping list
- The AI considers:
  - Event type (pizza, snacks, sandwiches)
  - Expected attendance (with no-show adjustment)
  - Dietary restrictions from guest RSVPs
- Review the generated shopping list
- Items are automatically saved to your Order History

### 4. Order History
- View all planned events
- See purchase progress for each order
- Click on an order to view the full shopping list

### 5. Shopping List / Order Detail
- View all items needed for the event
- Check off items as you purchase them
- Click "Buy on S-kauppa" to open the grocery store
- Progress bar shows completion status
- Mark all items as purchased to complete the order

### 6. Settings
- Configure app preferences
- Manage notifications

## Event Types

| Event Type | Description | Typical Items |
|------------|-------------|---------------|
| Pizza Night | Exclusive table chat with pizzas | Pizzas, soft drinks, napkins |
| Workshop / Snacks | Hands-on coding/building event | Chips, energy bars, soft drinks, water |
| Fireside Chat | Casual speaker event | Sandwiches, deli meats, cheese, soft drinks |

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Vertex AI (Gemini 2.5 Pro)
- **Event Data**: Luma API

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET | Fetch all events from Luma |
| `/api/recommend` | POST | Generate AI food recommendation |
| `/api/history` | GET | Get order history |
| `/api/orders/:id` | GET | Get specific order |
| `/api/orders/:id/items/:itemId` | PUT | Update item purchase status |
| `/api/notifications` | GET/POST/PUT/DELETE | Notification management |
| `/api/chat` | POST | AI chat assistant |

## Development

### Project Structure

```
├── frontend/          # Vite React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   └── services/    # API client
├── src/
│   ├── app/api/       # Next.js API routes
│   └── lib/           # Backend utilities
│       ├── food-engine.ts    # AI integration
│       ├── luma-client.ts    # Luma API client
│       ├── supabase-client.ts # Database client
│       └── classifier.ts      # Event classification
├── supabase/          # Database schemas
```

### Key Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Google Auth Library** - GCP authentication
- **Supabase JS Client** - Database access

## License

MIT License - See LICENSE file for details
