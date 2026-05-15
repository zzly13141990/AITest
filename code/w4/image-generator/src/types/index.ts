export interface GenerateImageRequest {
  prompt: string;
}

export interface GenerateImageResponse {
  imageUrl: string;
  imageData?: string; // base64 格式
}

export interface ApiConfig {
  apiKey: string;
  apiUrl: string;
  llmName: string;
}

export interface AppState {
  apiKey: string;
  apiUrl: string;
  llmName: string;
  prompt: string;
  isLoading: boolean;
  generatedImageUrl: string | null;
  error: string | null;
}
