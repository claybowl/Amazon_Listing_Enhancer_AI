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