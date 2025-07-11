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


------

# Troubleshooting Guide: Environment Variables and Image Generation

## Quick Verification Steps

### 1. Check Environment Variables
Visit these debug endpoints in your browser (development only):

- **Environment Status**: `http://localhost:3001/api/debug-env`
- **OpenAI API Test**: `http://localhost:3001/api/test-openai`

### 2. Expected Results

#### Environment Status (`/api/debug-env`)
You should see:
```json
{
  "envStatus": {
    "OPENAI_API_KEY": true,
    "GEMINI_API_KEY": false,
    "STABILITY_API_KEY": false,
    // ... other keys
  },
  "partialKeys": {
    "OPENAI_API_KEY": "sk-proj-Kr...",
    "GEMINI_API_KEY": null
  },
  "message": "Environment variables debug info"
}
```

#### OpenAI API Test (`/api/test-openai`)
You should see:
```json
{
  "success": true,
  "keyFound": true,
  "keyValid": true,
  "dalleModelsAvailable": ["dall-e-2", "dall-e-3"],
  "message": "OpenAI API key is working correctly"
}
```

### 3. How Image Generation Should Work

1. **Open the app** at `http://localhost:3001`
2. **Check AI Configuration section** - you should see:
   - "1/7 providers configured" (or similar)
   - OpenAI models available in the dropdown
3. **Select an image model** - choose "DALL-E 3 (openai)" from the dropdown
4. **Enter product details** and click "Enhance Listing"
5. **Generate images** - click "Generate Images" button
6. **Check browser console** for detailed logs showing:
   - Selected model information
   - API endpoint being called
   - Request payload details

### 4. Common Issues and Solutions

#### Issue: "No image models available"
**Solution**: 
- Verify your `.env.local` file has `OPENAI_API_KEY=your_key_here`
- Restart the development server: `npm run dev`
- Check the debug endpoints above

#### Issue: "OpenAI API Key not configured on the server"
**Solution**:
- Your `.env.local` file might not be in the root directory
- Ensure the file is named exactly `.env.local` (not `.env.local.txt`)
- Restart the development server

#### Issue: Images not generating
**Solution**:
- Check browser console for error messages
- Verify the selected model in the AI Configuration dropdown
- Test the API key using `/api/test-openai` endpoint

### 5. Browser Console Debugging

When generating images, you should see logs like:
```
Making image request to: /api/openai/generate-images
Using model: DALL-E 3 (dall-e-3) from provider: openai
Request payload: { modelId: "dall-e-3", prompt: "High-quality product photo...", numberOfImages: 1 }
Image API Response Status: 200
```

### 6. Environment Variable Priority

The app checks for API keys in this order:
- `OPENAI_API_KEY` (recommended)
- `GEMINI_API_KEY` or `GOOGLE_GEN_AI_API_KEY` or `API_KEY` (for Gemini)
- `STABILITY_API_KEY` (for Stability AI)
- `REPLICATE_API_KEY` (for Replicate)

### 7. Clean Up Debug Endpoints

After troubleshooting, you can delete these files:
- `app/api/debug-env/route.ts`
- `app/api/test-openai/route.ts`
- `TROUBLESHOOTING.md` (this file)

## Current Configuration Status

Based on your `.env.local` file, you have:
- ✅ OpenAI API Key configured
- ❌ Other providers not configured

This means:
- **Text Generation**: Should auto-select GPT-4o
- **Image Generation**: Should auto-select DALL-E 3
- **Available Models**: Only OpenAI models will appear in dropdowns

## Next Steps

1. Run the debug endpoints to verify everything is working
2. Test image generation with a simple product
3. If issues persist, check the browser console for detailed error messages
4. Consider adding other API keys (Stability AI, Replicate) for more model options 