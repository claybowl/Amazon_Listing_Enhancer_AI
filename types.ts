export interface ProductDetails {
  name: string;
  originalDescription: string;
  originalImageUrls: string[];
  tone?: string;
  style?: string;
}

export interface EnhancedProductDetails extends ProductDetails {
  enhancedDescription: string;
  generationContext?: string; // Added to store context about the description generation
  // tone and style are inherited from ProductDetails, but also explicitly listed here
  // to emphasize they are part of the enhanced output context.
  tone?: string;
  style?: string;
  generatedImagePrompts: string[];
  generatedImages: string[]; // Array of base64 image strings
}

export enum AppStep {
  Input = 'input',
  ProcessingDescription = 'processingDescription',
  DisplayEnhanced = 'displayEnhanced',
  ProcessingImages = 'processingImages',
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Potentially other types of chunks if the API supports them
}

/**
 * Options for using a source image in image generation (e.g., img2img or variations).
 */
export interface SourceImageOptions {
  sourceImage: string; // Base64 encoded image data, without the "data:image/...;base64," prefix.
  imageStrength?: number; // Optional, typically for Stability AI (0.0 to 1.0). Not used by OpenAI DALL-E 2 variations.
}

export interface FeedbackData {
  contentType: 'description' | 'image';
  contentReference: string; // For description, snippet. For image, its base64 data or a generated ID/URL/prompt.
  modelId: string;
  rating: 'good' | 'bad';
  timestamp: string; // ISO 8601 format
  notes?: string; // Optional user comment
  // sessionId?: string; // Optional
}
