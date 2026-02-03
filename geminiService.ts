import { GoogleGenAI, Type } from "@google/genai";
import { Scene, ScriptRequest } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 針對初步大綱進行 AI 深度優化
 */
export const refineOutline = async (outline: string, tone: string, director: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      你是一位頂級好萊塢劇本顧問。請針對以下初步構想進行「創意擴展」，自動強化敘事衝突、視覺張力與情感共鳴點。
      
      原始大綱: "${outline}"
      影片調性: "${tone}"
      模擬導演風格: "${director}"
      
      請輸出包含以下結構的繁體中文內容：
      1. 【創意鉤子 (Hook)】: 一句話吸引人的開場。
      2. 【核心衝突 (Core Conflict)】: 描述故事的主要張力。
      3. 【視覺印記 (Visual Signature)】: 描述一個符合該導演風格的獨特視覺元素。
      4. 【優化劇情流 (Refined Narrative)】: 三段式的流暢故事敘述。
      
      每次優化必須從不同視角重新構思，提供多樣化的方案。
    `,
  });
  return response.text || outline;
};

/**
 * 生成專業分鏡腳本，嚴格鎖定導演風格並產出 KLING 提示詞
 */
export const generateScript = async (params: ScriptRequest): Promise<Scene[]> => {
  const finalOutline = params.refinedOutline || params.outline;
  
  const prompt = `
    你現在是「導演我最行 (InspoDirector AI)」，一位精通影視製作的視覺大師。
    
    ### 專案參數
    大綱: ${finalOutline}
    導演風格: ${params.directorStyle} (嚴格鎖定該導演的美學標竿)
    視覺風格: ${params.style}
    敘事結構: ${params.structureType}
    調性: ${params.tone}
    受眾: ${params.targetAudience}
    專業選項: ${params.features.join(", ")}
    鏡頭數: ${params.sceneCount}
    總時長: ${params.duration}秒

    ### 指令規範
    1. 鏡頭語言必須符合導演美學（例如：李安的內斂情感、魏斯·安德森的對稱、大衛芬奇的冷冽）。
    2. 為每一幕生成專為 KLING AI 優化的影像提示詞 (英文)。格式：[Subject & Details] + [Action/Physics] + [Environment/Lighting] + [Camera Movement] + [Quality Tags]。
    3. 生成一個 "visualConsistencyTag" 描述整體的視覺一致性特徵（光影、色彩、角色外貌）。

    請輸出 JSON 陣列。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 6000 },
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            structure: { type: Type.STRING },
            sceneNumber: { type: Type.NUMBER },
            imagePrompt: { type: Type.STRING },
            klingPrompt: { type: Type.STRING },
            cameraDirection: { type: Type.STRING },
            voiceover: { type: Type.STRING },
            estimatedDuration: { type: Type.NUMBER },
            notes: { type: Type.STRING },
            visualConsistencyTag: { type: Type.STRING },
          },
          required: ["sceneNumber", "imagePrompt", "klingPrompt", "cameraDirection", "voiceover", "estimatedDuration"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Script Parsing Error:", e);
    return [];
  }
};

export const generateSceneSketch = async (imagePrompt: string, sketchStyle: string, consistencyTag?: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { 
      parts: [{ text: `CINEMATIC STORYBOARD SKETCH. Style: ${sketchStyle}. Consistency Context: ${consistencyTag || ''}. Scene Description: ${imagePrompt}. Professional framing and lighting.` }] 
    },
    config: { imageConfig: { aspectRatio: "16:9" } },
  });

  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : "";
};