
export interface MenuItem {
  name: string;
  description: string;
  price_hkd: number;
}

export interface Restaurant {
  rank: number;
  name_ko: string;
  name_en: string;
  rating: number;
  review_count: number;
  recommendation_reason: string; // 추가: 전문가의 매력적인 추천 이유
  menus: MenuItem[];
}

export interface DessertOrCafe {
  name: string;
  main_dessert: string;
}

export interface Attraction {
  name: string;
  reason: string;
}

export interface GuideResponse {
  greeting: string;
  area_intro: string;
  restaurants: Restaurant[];
  desserts: DessertOrCafe[];
  attractions: Attraction[];
  tips: string[];
}

export interface AppState {
  loading: boolean;
  error: string | null;
  data: GuideResponse | null;
  searchQuery: string;
}
