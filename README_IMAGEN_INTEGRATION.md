# Imagen 3 Integration Guide

## Overview
This integration adds support for Google's Imagen 3 model with advanced features including style control, aspect ratio selection, post-processing options, and rate limiting.

## Security Notice
**IMPORTANT**: Never expose API keys in client-side code. The API key should be stored as an environment variable:

\`\`\`bash
# Add to your .env.local file
GEMINI_API_KEY=your_actual_api_key_here
\`\`\`

## Features

### Core Generation Features
- **Text-to-Image Generation**: Convert text prompts to high-quality images
- **Multiple Image Generation**: Generate 1-4 images per request
- **Aspect Ratio Control**: Square, portrait, landscape, and standard ratios
- **Style Selection**: Photographic, digital art, sketch, watercolor, oil painting, anime
- **Quality Control**: Standard and HD quality options
- **Safety Levels**: Configurable content filtering

### Advanced Features
- **Guidance Scale**: Control how closely the model follows the prompt (1-20)
- **Seed Control**: Reproducible generation with custom seeds
- **Rate Limiting**: Built-in rate limiting with visual feedback
- **Post-Processing**: Upscaling, style transfer, and color adjustments

### Post-Processing Options
- **Upscaling**: 2x or 4x image enhancement
- **Style Transfer**: Apply artistic styles to generated images
- **Color Adjustments**: Brightness, contrast, and saturation controls

## Usage

### Basic Usage
\`\`\`typescript
import { generateImagesWithImagen } from './services/providers/geminiImagenService'

const options = {
  prompt: "A beautiful sunset over mountains",
  numberOfImages: 2,
  aspectRatio: 'ASPECT_RATIO_16_9',
  style: 'photographic',
  quality: 'hd'
}

const result = await generateImagesWithImagen(options)
console.log('Generated images:', result.images)
console.log('Metadata:', result.metadata)
\`\`\`

### Advanced Usage with Post-Processing
\`\`\`typescript
import { generateImagesWithImagen, postProcessImage } from './services/providers/geminiImagenService'

const options = {
  prompt: "Digital art of a futuristic city",
  numberOfImages: 1,
  style: 'digital_art',
  guidanceScale: 12,
  seed: 12345
}

const result = await generateImagesWithImagen(options)

// Apply post-processing
const postProcessingOptions = {
  upscale: true,
  upscaleLevel: 2,
  styleTransfer: {
    enabled: true,
    targetStyle: 'artistic'
  },
  colorAdjustment: {
    brightness: 10,
    contrast: 5,
    saturation: 15
  }
}

const enhancedImage = await postProcessImage(result.images[0], postProcessingOptions)
\`\`\`

## Rate Limiting

The integration includes built-in rate limiting:
- **Limit**: 60 requests per minute
- **Visual Feedback**: Shows remaining requests and reset time
- **Automatic Handling**: Prevents requests when limit is exceeded

\`\`\`typescript
import { rateLimiter } from './services/providers/geminiImagenService'

// Check if request can be made
if (rateLimiter.canMakeRequest()) {
  // Make request
  rateLimiter.recordRequest()
} else {
  const waitTime = rateLimiter.getTimeUntilNextRequest()
  console.log(`Wait ${waitTime}ms before next request`)
}
\`\`\`

## Error Handling

The service provides comprehensive error handling:

\`\`\`typescript
try {
  const result = await generateImagesWithImagen(options)
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    // Handle rate limiting
  } else if (error.message.includes('Invalid request')) {
    // Handle validation errors
  } else if (error.message.includes('API key invalid')) {
    // Handle authentication errors
  } else {
    // Handle other errors
  }
}
\`\`\`

## Component Integration

The `ImagenAdvancedControls` component provides a complete UI for Imagen 3 generation:

\`\`\`tsx
import ImagenAdvancedControls from './components/ImagenAdvancedControls'

<ImagenAdvancedControls
  onImagesGenerated={(images, metadata) => {
    // Handle generated images
    console.log('Generated:', images.length, 'images')
  }}
  isGenerating={isGenerating}
  setIsGenerating={setIsGenerating}
/>
\`\`\`

## API Endpoints

### Server-Side Generation
- **Endpoint**: `/api/gemini/generate-images-advanced`
- **Method**: POST
- **Body**: `ImagenGenerationOptions`
- **Response**: `{ images: string[], metadata: object }`

### Client-Side Fallback
If server-side API key is not configured, the service automatically falls back to client-side generation using the provided API key.

## Environment Variables

Required environment variables:
\`\`\`bash
# Primary (recommended)
GEMINI_API_KEY=your_api_key

# Alternatives (for backward compatibility)
GOOGLE_GEN_AI_API_KEY=your_api_key
API_KEY=your_api_key
\`\`\`

## Best Practices

1. **Security**: Always use environment variables for API keys
2. **Rate Limiting**: Monitor rate limit status and implement appropriate delays
3. **Error Handling**: Implement comprehensive error handling for all scenarios
4. **User Experience**: Provide clear feedback during generation and rate limiting
5. **Performance**: Consider caching generated images for repeated requests
6. **Accessibility**: Ensure all UI controls are accessible with proper ARIA labels

## Troubleshooting

### Common Issues

1. **"API key invalid"**: Verify the API key is correctly set in environment variables
2. **"Rate limit exceeded"**: Wait for the rate limit to reset or implement request queuing
3. **"No images generated"**: Check prompt content and safety settings
4. **"Invalid request"**: Verify all parameters are within acceptable ranges

### Debug Mode
Enable debug logging by setting:
\`\`\`bash
DEBUG=imagen:*
\`\`\`

## Future Enhancements

Planned improvements:
- **Batch Processing**: Queue multiple generation requests
- **Image Editing**: In-place editing of generated images
- **Template System**: Predefined prompt templates
- **Analytics**: Usage tracking and optimization suggestions
- **Integration**: Direct integration with other image editing tools
