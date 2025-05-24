# Video Chat App

A Next.js application that provides video processing and AI-powered chat functionality. This app allows users to upload videos, processes them with OpenAI's vision models, and provides an intelligent chat interface to ask questions about video content.

## Architecture Overview

The Video Chat App is built with a modern tech stack centered around Next.js, using the App Router for efficient server-side and client-side rendering. The application features user authentication, video processing, frame analysis with OpenAI's vision models, and real-time chat capabilities.

### System Architecture

The application follows a modern full-stack architecture:

1. **Frontend Layer**: React components rendered through Next.js, with both server and client components
2. **API Layer**: Next.js API routes that handle authentication, video processing, and AI interactions
3. **Database Layer**: PostgreSQL for structured data storage with Drizzle ORM for type-safe queries
4. **Storage Layer**: Supabase Storage for video files and extracted frame images
5. **AI Integration Layer**: OpenAI Vision API for analyzing video frames and Chat API for conversations

The application uses a streaming architecture for the chat interface, leveraging Server-Sent Events (SSE) to provide real-time responses from the AI model.

### Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with credential provider
- **Storage**: Supabase Storage for videos and frame images
- **AI Integration**: OpenAI GPT-4 Vision API for frame analysis and text models for chat
- **Styling**: Tailwind CSS with a custom UI component library based on Radix UI primitives
- **State Management**: React Hooks and Context API
- **Deployment**: Vercel

## Core Features

1. **User Authentication**: Secure registration and login system built with NextAuth.js
2. **Video Upload**: Support for uploading and storing video files
3. **Video Processing**: Automatic extraction of frames for AI analysis
4. **Frame Analysis**: OpenAI Vision Model processing of video frames to understand content
5. **Chat Interface**: AI-powered conversational interface to ask questions about video content
6. **Dashboard**: User dashboard to manage uploaded videos and conversations

## Project Structure

### Frontend

The application follows Next.js App Router structure:

- **`/src/app`**: Contains all pages and API routes
  - **`/(dashboard)`**: Protected dashboard pages requiring authentication
  - **`/auth`**: Authentication pages (login/register)
  - **`/api`**: Backend API endpoints

### Component Architecture

The UI is built with a custom component library organized in the `/src/components` directory:

- **`/ui`**: Reusable UI components (cards, buttons, inputs, etc.)
- **`/components`**: Application-specific components
  - `chat-interface.tsx`: The conversational UI for video chat
  - `video-player.tsx`: Custom video player component
  - `video-processor.tsx`: Handles video frame extraction and processing
  - `video-uploader.tsx`: Component for handling video uploads

### Backend Services

Backend functionality is implemented through Next.js API routes:

- **`/api/auth`**: Authentication endpoints
- **`/api/chat`**: Chat functionality with AI
- **`/api/frames`**: Video frame processing and analysis
- **`/api/video`**: Video management endpoints

### Database Schema

PostgreSQL database with Drizzle ORM:

- **`users`**: User account information
- **`videos`**: Uploaded video metadata
- **`frameAnalyses`**: Stored results of AI analysis of video frames
- **`conversations`**: Chat conversations about videos
- **`messages`**: Individual messages within conversations

## Data Flow

1. **Video Upload**: User uploads a video through the interface
2. **Processing**: Backend extracts frames from the video at regular intervals
3. **AI Analysis**: Each frame is analyzed by OpenAI's Vision model
4. **Indexing**: Analysis results are stored in the database
5. **Chat**: User interacts with the video through a chat interface
6. **AI Response**: The system retrieves relevant frame analyses and uses them to inform AI responses

## Environment Setup

Create a `.env.local` file with the following variables:

```
# Database
DATABASE_URL=your_postgres_connection_string

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_next_auth_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Optional: Storage (if using cloud storage for videos)
STORAGE_URL=your_storage_url
```

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Set up the database:

```bash
npx drizzle-kit push
```

4. Run the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This application is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy

## API Endpoints

### Video API
- `POST /api/video` - Upload a new video
- `GET /api/video/:id` - Get video information

### Chat API
- `POST /api/chat` - Send a chat message about a video
- `GET /api/messages/:conversationId` - Get messages for a conversation

### Frames API
- `POST /api/frames` - Process a video frame with AI vision model

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
