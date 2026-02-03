export interface Scene {
  structure: string;
  sceneNumber: number;
  imagePrompt: string;
  klingPrompt: string; 
  cameraDirection: string;
  voiceover: string;
  estimatedDuration: number;
  notes: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  visualConsistencyTag?: string;
}

export interface ScriptRequest {
  outline: string;
  refinedOutline?: string; // AI 優化後的創意大綱
  style: string;
  directorStyle: string; 
  duration: string;
  sceneCount: string; 
  structureType: string;
  tone: string; 
  targetAudience: string; 
  sketchStyle: string; 
  features: string[];
}