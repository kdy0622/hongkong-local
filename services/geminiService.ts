
import { GoogleGenAI, Type } from "@google/genai";
import { GuideResponse } from "../types";

const HKD_TO_KRW_RATE = 175;

export const fetchHongKongGuide = async (location: string): Promise<GuideResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  // 'Constraint is too tall' 에러 방지를 위해 스키마를 단순화하고 검색 도구를 비활성화함
  const prompt = `
    Persona: 'Hong Kong Kim Ban-jang', 20-year veteran local guide.
    Task: Provide a "Best Value & Local Vibes" travel guide for "${location}" (2025 data).
    
    QUANTITY RULES (MANDATORY):
    - EXACTLY 10 restaurants in 'restaurants'.
    - EXACTLY 3 items in 'desserts'.
    - EXACTLY 3 items in 'attractions'.
    
    Content Rules:
    - FOCUS on affordable authentic local gems (Cha Chaan Teng, Dai Pai Dong, Dim Sum).
    - Greeting: "반가워요! 홍콩 20년 차, 여러분의 김반장입니다!" + short expert insight about ${location}.
    - Menu Rule: For each restaurant, provide exactly 5 menu strings in 'menu_strings' array.
    - Format for EACH menu string: "Menu Name | Taste/Ingredient Description | Price in HKD" 
    - (Example: "Wonton Noodles | Snap shrimp with thin egg noodles | 45")
    - Format: Strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        // 검색 도구는 복잡한 JSON 스키마와 혼용 시 에러를 유발할 수 있어 비활성화
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
                  menu_strings: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["rank", "name_ko", "name_en", "rating", "review_count", "recommendation_reason", "menu_strings"]
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

    const rawData = JSON.parse(response.text.trim());
    
    // menu_strings를 MenuItem 구조로 안전하게 변환
    const formattedData: GuideResponse = {
      ...rawData,
      restaurants: (rawData.restaurants || []).map((res: any) => ({
        ...res,
        menus: (res.menu_strings || []).map((str: string) => {
          const parts = str.split('|').map(s => s.trim());
          return {
            name: parts[0] || "추천 메뉴",
            description: parts[1] || "현지에서 인기 있는 메뉴입니다.",
            price_hkd: parseInt(parts[2]?.replace(/[^0-9]/g, '')) || 50
          };
        })
      }))
    };

    return formattedData;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const getGoogleSearchLink = (name: string, keyword: string = "") => {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name + " " + keyword + " Hong Kong local food 2025")}`;
};

export const getGoogleMapsLink = (name: string) => {
  return `https://www.google.com/maps/search/${encodeURIComponent(name + " Hong Kong")}`;
};
