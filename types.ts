export interface ProductDetails {
  name: string;
  originalDescription: string;
  originalImageUrls: string[];
}

export interface EnhancedProductDetails extends ProductDetails {
  enhancedDescription: string;
  generationContext?: string; // Added to store context about the description generation
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
