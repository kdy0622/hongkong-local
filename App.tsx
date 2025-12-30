
import React, { useState, useEffect } from 'react';
import { AppState, GuideResponse, Restaurant } from './types.ts';
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
  "김반장이 정보를 확인 중입니다...",
  "데이터량을 조절하여 안정적으로 불러오는 중...",
  "실시간 리뷰를 필터링하고 있어요.",
  "진짜 숨은 맛집들을 골라내는 중입니다."
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    loading: false,
    error: null,
    data: null,
    searchQuery: '',
  });

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    if (state.loading || loadingMore) {
      interval = window.setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [state.loading, loadingMore]);

  const performSearch = async (query: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, data: null, searchQuery: query }));
    setRestaurants([]);
    setHasMore(false);
    
    try {
      // 1. 처음에는 1~5위만 가져와서 부하를 줄임
      const result = await fetchHongKongGuide(query, 1, 5);
      setState(prev => ({ ...prev, loading: false, data: result }));
      setRestaurants(result.restaurants);
      setHasMore(true); // 더 보여줄 수 있는 상태로 설정
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const handleLoadMore = async () => {
    if (!state.data || loadingMore) return;
    
    setLoadingMore(true);
    try {
      // 2. 추가 클릭 시 6~10위 정보를 가져옴
      const result = await fetchHongKongGuide(state.searchQuery, 6, 5);
      setRestaurants(prev => [...prev, ...result.restaurants]);
      setHasMore(false); // 10위까지 보여줬으므로 종료 (필요시 확장 가능)
    } catch (err: any) {
      alert("추가 정보를 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.searchQuery.trim()) return;
    performSearch(state.searchQuery);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <header className="relative pt-16 pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1506351421178-63b52a2d25a2?q=80&w=2000')] bg-cover bg-center opacity-10 blur-[2px] animate-pulse-slow"></div>
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="text-left cursor-pointer" onClick={() => setState({ ...state, data: null, error: null, searchQuery: '' })}>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 leading-none">
              <span className="text-slate-900">LOCAL HONG KONG</span><br/>
              <span className="text-red-600 neon-text">KIM BAN-JANG</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-semibold max-w-sm">
              <span className="text-slate-900 underline decoration-red-600 underline-offset-4 font-bold">안전하고 정교한</span> 쪼개기 가이드 (2025)
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
             <button 
              onClick={() => performSearch(state.searchQuery)} 
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-red-700 shadow-md"
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
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
                 <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                   KIM'S <span className="text-red-600">SELECTED LIST</span>
                 </h2>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   {restaurants.length} / 10 PLACES
                 </span>
              </div>

              <div className="space-y-4">
                {restaurants.map((res) => (
                  <RestaurantCard key={res.rank} restaurant={res} />
                ))}
              </div>

              {/* 더 보기 인터랙션 */}
              {hasMore && (
                <div className="mt-12 p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-white/50">
                  <p className="text-slate-600 font-bold mb-4 italic">"아직 5곳이 더 남았습니다. 김반장이 더 알려드릴까요?"</p>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="group relative bg-slate-900 text-white px-10 py-4 rounded-xl font-black text-sm hover:bg-red-600 transition-all shadow-xl disabled:opacity-50 overflow-hidden"
                  >
                    <span className="relative z-10">
                      {loadingMore ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                      김반장! 5곳 더 알려주세요!
                    </span>
                    <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  </button>
                </div>
              )}

              {/* 재검색 및 명소 안내 */}
              {!hasMore && !loadingMore && restaurants.length > 5 && (
                <div className="mt-16 text-center space-y-6">
                  <div className="inline-block p-1 bg-slate-100 rounded-full mb-2">
                    <div className="bg-white px-4 py-1 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guide Complete</div>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 italic">"이 지역 맛집은 여기까지입니다! 다른 동네도 가보실까요?"</h3>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                      onClick={scrollToTop}
                      className="bg-white border border-slate-200 text-slate-800 px-6 py-3 rounded-lg text-xs font-bold hover:border-red-600 transition-all"
                    >
                      상단으로 올라가서 재검색
                    </button>
                    <button 
                      onClick={() => setState({ ...state, data: null, searchQuery: '' })}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg text-xs font-bold hover:bg-red-700 transition-all shadow-md"
                    >
                      추천 지역 목록보기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!state.data && !state.loading && (
          <div className="mt-12 animate-in fade-in duration-500">
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
        <p className="text-slate-400 text-[9px] font-bold">© 2025 LOCAL VETERAN INSIGHTS. 안정성을 위해 쪼개기 방식을 사용 중입니다.</p>
      </footer>
    </div>
  );
};

export default App;
