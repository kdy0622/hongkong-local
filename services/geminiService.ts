
import { GoogleGenAI } from "@google/genai";
import { GuideResponse } from "../types.ts";

export const fetchHongKongGuide = async (location: string): Promise<GuideResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  // 10개 식당은 토큰 및 제약 조건 초과 위험이 있어 최우수 7곳으로 조정하여 안정성 확보
  const prompt = `
    당신은 20년 경력의 홍콩 가이드 '김반장'입니다. "${location}" 지역의 최신 미식 정보를 제공하세요.
    
    반드시 다음 JSON 구조를 지켜서 응답하세요:
    {
      "greeting": "반가워요!...",
      "area_intro": "이 동네는...",
      "restaurants": [
        {
          "rank": 1,
          "name_ko": "식당 한글명",
          "name_en": "Restaurant English Name",
          "rating": 4.5,
          "review_count": 1200,
          "recommendation_reason": "여기는 이래서 추천해요...",
          "menu_strings": [
            "영문메뉴명 | 한글메뉴명 | 설명 | 가격(숫자만)"
          ]
        }
      ],
      "desserts": [{ "name": "장소명", "main_dessert": "메뉴명" }],
      "attractions": [{ "name": "명소명", "reason": "이유" }],
      "tips": ["팁1", "팁2"]
    }

    규칙:
    1. 식당은 정확히 7곳을 추천하세요.
    2. 모든 설명은 가이드 말투(해요체)로 작성하세요.
    3. menu_strings는 반드시 "영문명 | 한글명 | 한글설명 | 가격" 형식을 지키세요.
    4. 가격은 HKD 기준 숫자만 적으세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("API 응답이 비어있습니다.");
    }

    const rawData = JSON.parse(response.text.trim());
    
    // 데이터 보정 및 형식 변환
    const formattedData: GuideResponse = {
      greeting: rawData.greeting || "반가워요! 홍콩 김반장입니다.",
      area_intro: rawData.area_intro || "홍콩의 매력이 가득한 곳이죠.",
      restaurants: (rawData.restaurants || []).map((res: any) => ({
        rank: res.rank,
        name_ko: res.name_ko,
        name_en: res.name_en,
        rating: res.rating || 0,
        review_count: res.review_count || 0,
        recommendation_reason: res.recommendation_reason || "김반장이 강추하는 곳입니다.",
        menus: (res.menu_strings || []).map((str: string) => {
          const [en, ko, desc, price] = str.split('|').map(s => s.trim());
          return {
            name: ko ? `${ko} (${en})` : (en || "추천 메뉴"),
            description: desc || "정말 맛있는 현지 인기 메뉴입니다.",
            price_hkd: parseInt(price?.replace(/[^0-9]/g, '')) || 50
          };
        })
      })),
      desserts: rawData.desserts || [],
      attractions: rawData.attractions || [],
      tips: rawData.tips || ["현지 상황에 따라 현금을 준비하세요!", "합석 문화가 있으니 당황하지 마세요."]
    };

    return formattedData;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("데이터를 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
};

export const getGoogleSearchLink = (name: string, keyword: string = "") => {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name + " " + keyword + " Hong Kong local food")}`;
};

export const getGoogleMapsLink = (name: string) => {
  return `https://www.google.com/maps/search/${encodeURIComponent(name + " Hong Kong")}`;
};
