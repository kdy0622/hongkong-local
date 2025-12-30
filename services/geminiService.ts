
import { GoogleGenAI, Type } from "@google/genai";
import { GuideResponse } from "../types";

const HKD_TO_KRW_RATE = 175;

export const fetchHongKongGuide = async (location: string): Promise<GuideResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    Persona: 'Hong Kong Kim Ban-jang', 20-year veteran local guide.
    Task: Provide a "Best Value & Local Vibes" travel guide for "${location}" (2025 data).
    
    Rules:
    1. EXCLUDE luxury/high-end. FOCUS on affordable authentic local gems (Cha Chaan Teng, Dai Pai Dong, Dim Sum, Roasted Meats).
    2. Greeting: "반가워요! 홍콩 20년 차, 여러분의 김반장입니다!" + short expert insight about ${location}.
    3. Recommendation Reason: 2 alluring sentences per restaurant about value & charm.
    4. Menu Requirements: Provide EXACTLY 5 menu items for EACH restaurant. 
    5. Menu Description: For each menu, describe specific ingredients and taste profile (e.g., "불향 가득한 소고기와 쫄깃한 쌀면의 조화", "바삭한 껍질 속 육즙이 터지는 거위 고기").
    6. Format: Strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            greeting: { type: Type.STRING },
            area_intro: { type: Type.STRING },
            restaurants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rank: { type: Type.NUMBER },
                  name_ko: { type: Type.STRING },
                  name_en: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  review_count: { type: Type.NUMBER },
                  recommendation_reason: { type: Type.STRING },
                  menus: {
                    type: Type.ARRAY,
                    minItems: 5,
                    maxItems: 5,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        price_hkd: { type: Type.NUMBER }
                      },
                      required: ["name", "description", "price_hkd"]
                    }
                  }
                },
                required: ["rank", "name_ko", "name_en", "rating", "review_count", "recommendation_reason", "menus"]
              }
            },
            desserts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  main_dessert: { type: Type.STRING }
                },
                required: ["name", "main_dessert"]
              }
            },
            attractions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["name", "reason"]
              }
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["greeting", "area_intro", "restaurants", "desserts", "attractions", "tips"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text.trim()) as GuideResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const formatCurrency = (hkd: number) => {
  const krw = Math.round(hkd * HKD_TO_KRW_RATE).toLocaleString();
  return `HKD ${hkd} (약 ${krw}원)`;
};

export const getGoogleSearchLink = (name: string, keyword: string = "") => {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name + " " + keyword + " Hong Kong local food 2025")}`;
};

export const getGoogleMapsLink = (name: string) => {
  return `https://www.google.com/maps/search/${encodeURIComponent(name + " Hong Kong")}`;
};
