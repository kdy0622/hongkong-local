
import React, { useState, useEffect } from 'react';
import { AppState, GuideResponse } from './types.ts';
import { fetchHongKongGuide, getGoogleSearchLink, getGoogleMapsLink } from './services/geminiService.ts';
import RestaurantCard from './components/RestaurantCard.tsx';

const PRESET_AREAS = [
  { name: "침사추이", en: "Tsim Sha Tsui", desc: "딤섬과 야경의 가성비 조화" },
  { name: "센트럴", en: "Central", desc: "빌딩 숲 사이 숨겨진 로컬 노포" },
  { name: "몽콕", en: "Mong Kok", desc: "생동감 넘치는 길거리 미식 성지" },
  { name: "완차이", en: "Wan Chai", desc: "직장인들이 사랑하는 찐 가성비" },
  { name: "코즈웨이베이", en: "Causeway Bay", desc: "쇼핑 후 즐기는 고퀄리티 노포" }
];

const LOADING_MESSAGES = [
  "김반장이 로컬 정보를 확인 중입니다...",
  "실시간 리뷰를 필터링하고 있어요.",
  "2025년 최신 가격표 체크 중...",
  "진짜 숨은 맛집들을 골라내는 중입니다."
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    loading: false,
    error: null,
    data: null,
    searchQuery: '',
  });

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    if (state.loading) {
      interval = window.setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [state.loading]);

  const performSearch = async (query: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, data: null, searchQuery: query }));
    try {
      const result = await fetchHongKongGuide(query);
      setState(prev => ({ ...prev, loading: false, data: result }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, loading: false, error: err.message || "오류가 발생했습니다." }));
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.searchQuery.trim()) return;
    performSearch(state.searchQuery);
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <header className="relative pt-16 pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1506351421178-63b52a2d25a2?q=80&w=2000')] bg-cover bg-center opacity-10 blur-[2px] animate-pulse-slow"></div>
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 leading-none">
              <span className="text-slate-900">LOCAL HONG KONG</span><br/>
              <span className="text-red-600 neon-text">KIM BAN-JANG</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-semibold max-w-sm">
              20년 차 베테랑 가이드가 전하는 <span className="text-slate-900 underline decoration-red-600 underline-offset-4 font-bold">진짜 로컬 가성비</span> 가이드
            </p>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
            <input
              type="text"
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="동네 혹은 MTR 역명 입력"
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:border-red-600 transition-all text-sm shadow-sm"
            />
            <button type="submit" disabled={state.loading} className="absolute right-2 top-2 bottom-2 bg-red-600 text-white w-8 rounded flex items-center justify-center transition-all hover:bg-red-700 shadow-md">
              {state.loading ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-search text-xs"></i>}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        {state.loading && (
          <div className="py-24 text-center">
            <div className="inline-block w-12 h-1 bg-slate-200 rounded-full overflow-hidden relative mb-6">
               <div className="absolute inset-0 bg-red-600 animate-[loading_1.5s_infinite_linear]"></div>
            </div>
            <p className="text-slate-400 text-xs font-black tracking-[0.2em] uppercase">{LOADING_MESSAGES[loadingMsgIdx]}</p>
          </div>
        )}

        {state.error && (
          <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center my-10">
             <i className="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
             <p className="text-slate-800 font-bold mb-2">{state.error}</p>
             <p className="text-xs text-slate-400 mb-6">시스템 부하 혹은 API 일시 오류일 수 있습니다.</p>
             <button 
              onClick={() => performSearch(state.searchQuery)} 
              className="bg-red-600 text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-red-700 transition-all shadow-md"
             >
               다시 시도하기
             </button>
          </div>
        )}

        {state.data && !state.loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-6 duration-700">
            <div className="lg:col-span-4 lg:sticky lg:top-10 h-fit space-y-8">
              <div className="relative bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-xl shadow-lg text-white">
                    <i className="fas fa-user-ninja"></i>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-0.5">LOCAL EXPERT</h4>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">김반장의 인사말</h2>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-red-100 pl-4 py-1">
                  "{state.data.greeting} {state.data.area_intro}"
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4 flex items-center">
                  <i className="fas fa-lightbulb mr-2"></i> 김반장의 현지 팁
                </h3>
                <div className="space-y-4">
                  {state.data.tips.map((tip, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-red-600 text-[10px] font-black mt-1">0{i+1}</span>
                      <p className="text-xs text-slate-500 leading-normal font-medium">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                   <h3 className="text-[11px] font-black text-pink-600 uppercase tracking-widest mb-4 border-b border-pink-100 pb-2">추천 디저트</h3>
                   {state.data.desserts.map((d, i) => (
                     <div key={i} className="mb-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:border-pink-200 transition-colors">
                        <div className="text-xs font-bold text-slate-800 mb-0.5">{d.name}</div>
                        <div className="text-[10px] text-slate-400 mb-2">대표: <span className="text-pink-600 font-bold">{d.main_dessert}</span></div>
                        <div className="flex gap-2">
                           <a href={getGoogleSearchLink(d.name, d.main_dessert)} target="_blank" className="text-[9px] font-black text-slate-400 hover:text-red-600 uppercase transition-colors">📸 사진</a>
                           <a href={getGoogleMapsLink(d.name)} target="_blank" className="text-[9px] font-black text-slate-400 hover:text-red-600 uppercase transition-colors">📍 지도</a>
                        </div>
                     </div>
                   ))}
                </div>
                <div>
                   <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4 border-b border-blue-100 pb-2">인근 명소</h3>
                   {state.data.attractions.map((a, i) => (
                     <div key={i} className="mb-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div className="text-xs font-bold text-slate-800 mb-0.5">{a.name}</div>
                        <p className="text-[10px] text-slate-400 mb-2 leading-tight">{a.reason}</p>
                        <div className="flex gap-2">
                           <a href={getGoogleSearchLink(a.name)} target="_blank" className="text-[9px] font-black text-slate-400 hover:text-red-600 uppercase transition-colors">📸 사진</a>
                           <a href={getGoogleMapsLink(a.name)} target="_blank" className="text-[9px] font-black text-slate-400 hover:text-red-600 uppercase transition-colors">📍 지도</a>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
                 <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                   KIM'S <span className="text-red-600">BEST VALUE SELECTION</span>
                 </h2>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2025 VERIFIED</span>
              </div>

              <div className="space-y-4">
                {state.data.restaurants.map((res) => (
                  <RestaurantCard key={res.rank} restaurant={res} />
                ))}
              </div>
            </div>
          </div>
        )}

        {!state.data && !state.loading && (
          <div className="mt-12">
            <div className="flex items-center gap-4 mb-8">
              <span className="h-px bg-slate-200 flex-1"></span>
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">추천 검색 지역</h2>
              <span className="h-px bg-slate-200 flex-1"></span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {PRESET_AREAS.map((area, idx) => (
                <button
                  key={idx}
                  onClick={() => performSearch(area.name)}
                  className="bg-white border border-slate-100 p-5 rounded-xl text-left hover:border-red-600 transition-all hover:-translate-y-1 shadow-sm group"
                >
                  <div className="text-red-600 text-lg font-black mb-0.5 group-hover:scale-105 transition-transform leading-none">{area.name}</div>
                  <div className="text-[8px] text-slate-300 font-bold uppercase tracking-widest mb-3">{area.en}</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">{area.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-32 text-center py-10 border-t border-slate-100">
        <div className="flex items-center justify-center gap-4 mb-3">
           <span className="w-6 h-px bg-slate-200"></span>
           <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">KIM BAN JANG GUIDE</span>
           <span className="w-6 h-px bg-slate-200"></span>
        </div>
        <p className="text-slate-400 text-[9px] font-bold">© 2025 LOCAL VETERAN INSIGHTS. ALL DATA VERIFIED FOR HONG KONG TRAVELERS.</p>
      </footer>
    </div>
  );
};

export default App;
