# amazonlistingenhancerai

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/claybowls-projects/v0-amazonlistingenhancerai)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/vDOY3qiZaXt)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Code Review Summary

- **Framework:** Next.js 14, TypeScript, Tailwind CSS, Radix UI, Lucide React
- **AI Integrations:** OpenAI and Google Generative AI SDKs (API keys required)
- **Package Manager:** PNPM
- **Scripts:** `dev`, `build`, `start`, `lint` (see package.json)
- **Strengths:**
  - Modern, modular stack with strong UI and AI capabilities
  - Vercel integration for seamless production deployment
  - Good use of component libraries and utility-first CSS
- **Potential Issues:**
  - No `.env.example` or documentation for required environment variables (API keys)
  - README lacks local development instructions (see below)
  - Node.js 18.17+ recommended for Next.js 14

## Deployment

Your project is live at:

**[https://vercel.com/claybowls-projects/v0-amazonlistingenhancerai](https://vercel.com/claybowls-projects/v0-amazonlistingenhancerai)**

## Local Development Setup

### Prerequisites
- **Node.js:** v18.17 or later
- **PNPM:** Install globally with `npm install -g pnpm`

### 1. Clone the Repository
```bash
git clone <repository_url>
cd amazonlistingenhancerai
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory. Add your API keys and any other required variables, for example:
```env
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
# Add any other variables required by the application
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Run the Development Server
```bash
pnpm dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build and Run for Production (Optional)
```bash
pnpm build
pnpm start
```

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/vDOY3qiZaXt](https://v0.dev/chat/projects/vDOY3qiZaXt)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
