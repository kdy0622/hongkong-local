
import React from 'react';
import { Restaurant } from '../types';
import { getGoogleSearchLink, getGoogleMapsLink } from '../services/geminiService';

interface Props {
  restaurant: Restaurant;
}

const HKD_TO_KRW_RATE = 175;

const RestaurantCard: React.FC<Props> = ({ restaurant }) => {
  const formatKRW = (hkd: number) => {
    return (hkd * HKD_TO_KRW_RATE).toLocaleString();
  };

  return (
    <div className="hongkong-card group relative rounded-xl overflow-hidden mb-6 border-l-4 border-red-600/40 hover:border-red-600 transition-all duration-300">
      <div className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Rank & Stats Sidebar */}
          <div className="flex-shrink-0 flex md:flex-col items-center gap-2 w-full md:w-16">
             <span className="text-4xl font-black text-red-600/10 group-hover:text-red-600/20 transition-colors leading-none italic">
               {String(restaurant.rank).padStart(2, '0')}
             </span>
             <div className="flex flex-row md:flex-col items-center gap-1">
                <div className="text-orange-600 text-xs font-bold">
                  <i className="fas fa-star mr-1"></i>{restaurant.rating}
                </div>
                <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
                  REV {restaurant.review_count >= 1000 ? (restaurant.review_count/1000).toFixed(1)+'K' : restaurant.review_count}
                </div>
             </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-lg md:text-xl font-extrabold text-slate-800 group-hover:text-red-600 transition-colors truncate">
                {restaurant.name_ko}
              </h3>
              <span className="text-[11px] font-medium text-slate-400 italic ml-2 truncate">{restaurant.name_en}</span>
            </div>
            
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed mb-6 italic opacity-90 border-l border-slate-200 pl-3">
              "{restaurant.recommendation_reason}"
            </p>

            {/* Detailed Menu List (5 items) */}
            <div className="grid grid-cols-1 gap-4 mb-2">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Kim's Selection</div>
              <div className="space-y-3">
                {restaurant.menus.map((menu, i) => (
                  <div key={i} className="group/menu border-b border-slate-100 pb-2 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-700 group-hover/menu:text-red-600 transition-colors">
                        {menu.name}
                      </span>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[11px] font-mono text-red-600 font-bold leading-none">{menu.price_hkd} <span className="text-[9px]">HKD</span></span>
                        <span className="text-[9px] text-slate-400 font-medium mt-0.5">약 {formatKRW(menu.price_hkd)}원</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug group-hover/menu:text-slate-700 transition-colors pr-16">
                      {menu.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex md:flex-col gap-2 w-full md:w-24 flex-shrink-0 mt-2 md:mt-0">
            <a
              href={getGoogleSearchLink(restaurant.name_en, restaurant.menus[0]?.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-lg transition-all group/btn border border-slate-200"
            >
              <i className="fas fa-camera text-xs mb-1 group-hover/btn:scale-110 transition-transform"></i>
              <span className="text-[9px] font-black tracking-tighter">PHOTO</span>
            </a>
            <a
              href={getGoogleMapsLink(restaurant.name_en)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center justify-center bg-red-600 text-white py-3 rounded-lg shadow-sm hover:bg-red-700 transition-all group/btn"
            >
              <i className="fas fa-map-marker-alt text-xs mb-1 group-hover/btn:scale-110 transition-transform"></i>
              <span className="text-[9px] font-black tracking-tighter">MAP</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
