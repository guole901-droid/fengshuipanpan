import React, { useState, useEffect, useRef } from 'react';
import { Compass, Settings, ChevronRight, Download, Image as ImageIcon } from 'lucide-react';

// --- 样式注入 ---
const FontStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@300;500;700;900&display=swap');
      
      .font-weibei {
        font-family: 'Ma Shan Zheng', cursive;
      }
      .font-song {
        font-family: 'Noto Serif SC', serif;
      }
      .font-num {
        font-family: 'Noto Serif SC', serif;
      }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      
      .printing .no-print {
        display: none !important;
      }
    `}
  </style>
);

// --- 基础数据 ---
// base: 洛书原始数 (用于五黄入中时查找本宫阴阳)
const GRID_MAPPING = [
  { id: 0, name: '巽', base: 4 }, { id: 1, name: '离', base: 9 }, { id: 2, name: '坤', base: 2 },
  { id: 3, name: '震', base: 3 }, { id: 4, name: '中宫', base: 5 }, { id: 5, name: '兑', base: 7 },
  { id: 6, name: '艮', base: 8 }, { id: 7, name: '坎', base: 1 }, { id: 8, name: '乾', base: 6 }
];

const FLIGHT_PATH = [4, 8, 5, 6, 1, 7, 2, 3, 0]; 

// 二十四山数据 (修正壬山为2)
const MOUNTAINS = [
  { name: '壬', trigram: 1, yuan: 0, repStar: 2 }, 
  { name: '子', trigram: 1, yuan: 1, repStar: 1 },
  { name: '癸', trigram: 1, yuan: 2, repStar: 1 },
  { name: '丑', trigram: 8, yuan: 0, repStar: 7 },
  { name: '艮', trigram: 8, yuan: 1, repStar: 7 },
  { name: '寅', trigram: 8, yuan: 2, repStar: 9 },
  { name: '甲', trigram: 3, yuan: 0, repStar: 1 },
  { name: '卯', trigram: 3, yuan: 1, repStar: 2 },
  { name: '乙', trigram: 3, yuan: 2, repStar: 2 },
  { name: '辰', trigram: 4, yuan: 0, repStar: 6 },
  { name: '巽', trigram: 4, yuan: 1, repStar: 6 },
  { name: '巳', trigram: 4, yuan: 2, repStar: 6 },
  { name: '丙', trigram: 9, yuan: 0, repStar: 7 },
  { name: '午', trigram: 9, yuan: 1, repStar: 9 },
  { name: '丁', trigram: 9, yuan: 2, repStar: 9 },
  { name: '未', trigram: 2, yuan: 0, repStar: 2 },
  { name: '坤', trigram: 2, yuan: 1, repStar: 2 },
  { name: '申', trigram: 2, yuan: 2, repStar: 1 },
  { name: '庚', trigram: 7, yuan: 0, repStar: 9 },
  { name: '酉', trigram: 7, yuan: 1, repStar: 7 },
  { name: '辛', trigram: 7, yuan: 2, repStar: 7 },
  { name: '戌', trigram: 6, yuan: 0, repStar: 6 },
  { name: '乾', trigram: 6, yuan: 1, repStar: 6 },
  { name: '亥', trigram: 6, yuan: 2, repStar: 6 },
];

const TRIGRAM_MOUNTAIN_INDICES = {
  1: [0, 1, 2], 8: [3, 4, 5], 3: [6, 7, 8], 4: [9, 10, 11],
  9: [12, 13, 14], 2: [15, 16, 17], 7: [18, 19, 20], 6: [21, 22, 23]
};

const STAR_YINYANG = {
  1: [1, -1, -1], 2: [-1, 1, 1], 3: [1, -1, -1], 4: [-1, 1, 1],
  5: [0, 0, 0], 6: [-1, 1, 1], 7: [1, -1, -1], 8: [-1, 1, 1], 9: [1, -1, -1],
};

const CHINESE_NUMS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const YEARS = Array.from({length: 101}, (_, i) => 1949 + i);

// --- 算法 ---
const flyStars = (startNum, isForward) => {
  const result = new Array(9).fill(0);
  let current = startNum;
  for (let i = 0; i < 9; i++) {
    result[FLIGHT_PATH[i]] = current;
    if (isForward) {
      current = current >= 9 ? 1 : current + 1;
    } else {
      current = current <= 1 ? 9 : current - 1;
    }
  }
  return result;
};

const getAnnualStar = (year) => {
  let offset = (year - 2000) % 9;
  let star = 9 - offset;
  if (star <= 0) star += 9;
  if (star > 9) star -= 9; 
  return star;
};

const getOverlayPosition = (gridIdx) => {
  const offset = "-2.5rem"; 
  const base = { position: 'absolute' };
  const centerH = { left: '50%', transform: 'translateX(-50%)' }; 
  const centerV = { top: '50%', transform: 'translateY(-50%)' };

  switch(gridIdx) {
    case 1: return { ...base, top: offset, ...centerH }; 
    case 7: return { ...base, bottom: offset, ...centerH }; 
    case 3: return { ...base, left: offset, ...centerV }; 
    case 5: return { ...base, right: offset, ...centerV }; 
    case 0: return { ...base, top: '-1.5rem', left: '-1.5rem' }; 
    case 2: return { ...base, top: '-1.5rem', right: '-1.5rem' }; 
    case 6: return { ...base, bottom: '-1.5rem', left: '-1.5rem' }; 
    case 8: return { ...base, bottom: '-1.5rem', right: '-1.5rem' }; 
    default: return { display: 'none' };
  }
};

const getWatermarkPosition = (gridIdx) => {
  const gap = "2.2rem";
  switch(gridIdx) {
    case 1: return { top: '50%', left: gap, transform: 'translateY(-50%)', whiteSpace: 'nowrap' }; 
    case 7: return { top: '50%', left: gap, transform: 'translateY(-50%)', whiteSpace: 'nowrap' }; 
    case 3: return { top: gap, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', writingMode: 'vertical-rl' }; 
    case 5: return { top: gap, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', writingMode: 'vertical-rl' }; 
    case 0: return { left: gap, top: 0, whiteSpace: 'nowrap' }; 
    case 2: return { right: gap, top: 0, whiteSpace: 'nowrap' };
    case 6: return { left: gap, bottom: 0, whiteSpace: 'nowrap' }; 
    case 8: return { right: gap, bottom: 0, whiteSpace: 'nowrap' };
    default: return { display: 'none' };
  }
};

const App = () => {
  const currentYear = new Date().getFullYear();
  const chartRef = useRef(null);
  
  const [inputPeriod, setInputPeriod] = useState(9);
  const [inputSitting, setInputSitting] = useState(1);
  const [inputYear, setInputYear] = useState(currentYear);
  const [inputReplacement, setInputReplacement] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); 

  const [chartData, setChartData] = useState(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handleCalculate = () => {
    const sMountain = MOUNTAINS[inputSitting];
    const facingIndex = (inputSitting + 12) % 24;
    const fMountain = MOUNTAINS[facingIndex];
    
    const baseChart = flyStars(inputPeriod, true);
    const sGridIdx = getGridIndexByTrigram(sMountain.trigram);
    const fGridIdx = getGridIndexByTrigram(fMountain.trigram);
    
    // 【关键】获取坐向宫位的原始洛书数 (gridBase)
    const sOriginalBase = GRID_MAPPING[sGridIdx].base;
    const fOriginalBase = GRID_MAPPING[fGridIdx].base;
    
    const sBaseStar = baseChart[sGridIdx];
    const fBaseStar = baseChart[fGridIdx];

    // 计算时传入 gridBase
    const { start: mStart, forward: mFwd } = resolveStarAndDirection(sBaseStar, sMountain.yuan, inputReplacement, sOriginalBase);
    const mountainChart = flyStars(mStart, mFwd);

    const { start: wStart, forward: wFwd } = resolveStarAndDirection(fBaseStar, fMountain.yuan, inputReplacement, fOriginalBase);
    const waterChart = flyStars(wStart, wFwd);

    const annualStar = getAnnualStar(inputYear);
    const annualChart = flyStars(annualStar, true);

    setChartData({
      base: baseChart,
      mountain: mountainChart,
      water: waterChart,
      annual: annualChart,
      sittingInfo: sMountain,
      facingInfo: fMountain,
      sGridIdx,
      fGridIdx,
      period: inputPeriod,
      year: inputYear,
      isReplacement: inputReplacement
    });
    setHasCalculated(true);
  };

  const handleDownload = () => {
    if (!chartRef.current || !window.html2canvas) return;
    setIsDownloading(true);
    setTimeout(() => {
        chartRef.current.classList.add('printing');
        window.html2canvas(chartRef.current, {
            scale: 2.5, 
            backgroundColor: '#fdfbf7',
            useCORS: true,
            logging: false,
            scrollX: 0,
            scrollY: 0,
        }).then(canvas => {
            chartRef.current.classList.remove('printing');
            const link = document.createElement('a');
            link.download = `玄空排盘_${chartData.sittingInfo.name}山_${CHINESE_NUMS[chartData.period]}运.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            setIsDownloading(false);
        });
    }, 200);
  };

  // 【算法重写】完美处理五黄及替卦
  const resolveStarAndDirection = (star, yuan, isRep, gridBase) => {
    // 1. 确定入中星 (targetStar)
    let targetStar = star;
    
    // 如果是替卦，且星不是5（5无替），则查找替星
    if (isRep && star !== 5) {
        const indices = TRIGRAM_MOUNTAIN_INDICES[star];
        if (indices) {
             const mIdx = indices[yuan]; // 找同元龙的对应山
             targetStar = MOUNTAINS[mIdx].repStar;
        }
    }
    // 注意：如果原星是5，无论是否替卦，入中星都保持5。

    // 2. 确定顺逆 (Direction)
    let direction = true;
    
    // 确定阴阳基准卦 (refTrigram)
    // 规则：
    // A. 如果入中星是5 (无论是原星5还是替出来的5)，
    //    都必须用【本宫洛书数】(gridBase) 来定阴阳。
    //    (例如：9运5黄在坎，用坎卦(1)定阴阳)
    // B. 如果入中星不是5，则用该星本身的卦象定阴阳。
    
    let refTrigram = targetStar;
    if (targetStar === 5) {
        refTrigram = gridBase;
    }
    
    const yinyangs = STAR_YINYANG[refTrigram];
    if (yinyangs) {
        // yuan: 0=地, 1=天, 2=人
        direction = (yinyangs[yuan] === 1);
    }
    
    return { start: targetStar, forward: direction };
  };

  const getGridIndexByTrigram = (t) => {
    const map = { 1: 7, 2: 2, 3: 3, 4: 0, 6: 8, 7: 5, 8: 6, 9: 1 };
    return map[t];
  };

  const renderOverlayIcon = (type, gridIdx) => {
    if (gridIdx === undefined) return null;
    const style = getOverlayPosition(gridIdx);
    const watermarkStyle = getWatermarkPosition(gridIdx);
    const isSitting = type === 'sitting';
    const bgColor = isSitting ? 'bg-stone-900' : 'bg-[#b91c1c]';
    const label = isSitting ? '坐' : '向';
    const colorClass = isSitting ? 'text-[#8b0000]' : 'text-[#b91c1c]';

    return (
        <div style={style} className="z-20 flex items-center justify-center">
             <div className={`w-6 h-6 ${bgColor} text-[#fdfbf7] text-[11px] font-song font-bold flex items-center justify-center border-2 border-white/50 shadow-lg ${isSitting ? 'rounded-sm' : 'rounded-full'} shrink-0 relative`}>
                {label}
                {isDownloading && (
                  <div className={`absolute ${colorClass} font-song text-[10px] font-bold opacity-75`} style={watermarkStyle}>
                    郭骐榕风水传承
                  </div>
                )}
             </div>
        </div>
    );
  };

  const renderCell = (idx) => {
    if (!chartData) return null;
    const baseVal = chartData.base[idx];
    const mtVal = chartData.mountain[idx];
    const wtVal = chartData.water[idx];
    const annVal = chartData.annual[idx]; 
    const info = GRID_MAPPING[idx];
    let bgStyle = "bg-[#f9f7f2]"; 
    if (idx === 4) bgStyle = "bg-[#f0eadd]"; 

    return (
      <div key={idx} className={`relative ${bgStyle} flex flex-col items-center justify-between p-2 select-none font-song h-full`}>
        <div className="w-full flex justify-between items-start px-1 mt-0.5">
          <span className="text-3xl font-num font-bold text-stone-800 leading-none">{mtVal}</span>
          <span className="text-3xl font-num font-bold text-[#1e3a8a] leading-none">{wtVal}</span>
        </div>
        <div className="flex flex-col items-center justify-center -mt-3 z-10 flex-1">
           <span className="text-sm font-num font-bold text-[#b91c1c] mb-0 tracking-widest">({annVal})</span>
           <span className="text-4xl font-song font-black text-[#8b0000] opacity-20 leading-none select-none">{CHINESE_NUMS[baseVal]}</span>
        </div>
        <div className="text-[11px] font-song text-stone-500 tracking-[0.3em] font-medium opacity-70 pb-1.5">{info.name}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#e8e6e1] py-8 px-4 font-song text-stone-800 flex flex-col items-center">
      <FontStyles />
      <div className="w-full max-w-2xl bg-[#fdfbf7] shadow-xl rounded-sm overflow-hidden border border-[#d6d3d1]">
        
        <div className="bg-[#2a2a2a] text-[#d4af37] p-8 text-center relative">
           <div className="absolute inset-x-0 top-2 h-[1px] bg-[#d4af37] opacity-30 mx-4"></div>
           <div className="absolute inset-x-0 bottom-2 h-[1px] bg-[#d4af37] opacity-30 mx-4"></div>
           <h1 className="text-4xl sm:text-5xl font-weibei tracking-widest mb-3 text-[#e6cca0] drop-shadow-md">上愿玄空飞星排盘</h1>
           <div className="flex justify-center items-center gap-3 opacity-90 mt-4">
             <span className="h-[1px] w-8 bg-[#8b6b4b]"></span>
             <p className="text-xs sm:text-sm tracking-[0.2em] font-song text-[#a8a29e] font-light uppercase">郭骐榕 会长 设计支持</p>
             <span className="h-[1px] w-8 bg-[#8b6b4b]"></span>
           </div>
        </div>

        <div className="p-6 bg-[#f5f4f0] border-b border-[#e7e5e4]">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative group">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 block pl-1">二十四山坐向</label>
                  <select 
                    value={inputSitting}
                    onChange={(e) => setInputSitting(Number(e.target.value))}
                    className="w-full bg-white border border-stone-300 text-stone-800 py-3 px-3 rounded-sm focus:outline-none focus:border-[#8b5a2b] font-song text-lg shadow-sm appearance-none"
                  >
                    {MOUNTAINS.map((m, i) => (
                      <option key={i} value={i}>{m.name}山 ({MOUNTAINS[(i+12)%24].name}向)</option>
                    ))}
                  </select>
                  <ChevronRight className="w-4 h-4 absolute right-3 bottom-4 text-stone-400 pointer-events-none rotate-90" />
                </div>
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 block pl-1">元运</label>
                        <select 
                          value={inputPeriod}
                          onChange={(e) => setInputPeriod(Number(e.target.value))}
                          className="w-full bg-white border border-stone-300 text-stone-800 py-3 px-2 rounded-sm focus:outline-none focus:border-[#8b5a2b] font-song text-lg shadow-sm"
                        >
                          {[1,2,3,4,5,6,7,8,9].map(n => ( <option key={n} value={n}>{CHINESE_NUMS[n]}运</option> ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 block pl-1">流年</label>
                        <select 
                          value={inputYear}
                          onChange={(e) => setInputYear(Number(e.target.value))}
                          className="w-full bg-white border border-stone-300 text-stone-800 py-3 px-2 rounded-sm focus:outline-none focus:border-[#8b5a2b] font-song text-lg shadow-sm"
                        >
                          {YEARS.map(y => ( <option key={y} value={y}>{y}年</option> ))}
                        </select>
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center mt-2 pt-4 border-t border-stone-200">
               <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setInputReplacement(!inputReplacement)}>
                  <div className={`w-4 h-4 border transition-colors ${inputReplacement ? 'bg-[#8b0000] border-[#8b0000]' : 'bg-white border-stone-400 group-hover:border-[#8b0000]'} flex items-center justify-center rounded-sm`}>
                    {inputReplacement && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <span className={`text-sm font-song tracking-wide ${inputReplacement ? 'text-[#8b0000] font-bold' : 'text-stone-500'}`}>兼向替卦</span>
               </div>
               <button 
                  onClick={handleCalculate}
                  className="bg-[#8b0000] hover:bg-[#6b0000] text-[#fdfbf7] font-song font-bold py-2 px-8 rounded-sm shadow-md active:translate-y-0.5 transition-all tracking-[0.3em] flex items-center gap-2"
               >
                 <Compass className="w-4 h-4" /> 开始排盘
               </button>
            </div>
          </div>
        </div>

        {hasCalculated && chartData ? (
          <div className="flex flex-col items-center pb-8 bg-[#fdfbf7]">
             <div ref={chartRef} className="bg-[#fdfbf7] p-8 sm:p-12 w-full flex flex-col items-center justify-center relative">
               
               <div className="w-full max-w-sm flex justify-between items-end border-b border-[#8b5a2b]/30 pb-2 mb-8 px-2 z-10">
                 <div className="flex flex-col">
                   <span className="text-[10px] text-stone-400 tracking-widest mb-1 font-song">当前格局</span>
                   <span className="text-2xl font-bold font-song text-[#2c2c2c]">
                     {chartData.sittingInfo.name}山{chartData.facingInfo.name}向
                     {chartData.isReplacement && <span className="ml-2 text-xs text-[#8b0000] font-normal border border-[#8b0000] px-1 rounded-sm">替卦</span>}
                   </span>
                 </div>
                 <div className="text-right flex flex-col">
                   <span className="text-sm font-song text-stone-600 font-bold">{CHINESE_NUMS[chartData.period]}运</span>
                   <span className="text-xs font-song text-stone-400">{chartData.year} 甲辰年</span>
                 </div>
               </div>

               <div className="relative z-10 mb-20">
                   
                   <div className="inline-block p-1 bg-[#8b5a2b] shadow-2xl rounded-sm overflow-hidden relative z-10">
                       <div className="border-[3px] border-[#d4af37] p-[2px] bg-[#8b5a2b]">
                           <div className="grid grid-cols-3 grid-rows-3 gap-[1px] bg-[#8b5a2b] w-72 h-72 sm:w-80 sm:h-80 overflow-hidden">
                               {GRID_MAPPING.map((_, idx) => renderCell(idx))}
                           </div>
                       </div>
                   </div>

                   <div className="absolute inset-0 z-20 pointer-events-none">
                       {renderOverlayIcon('sitting', chartData.sGridIdx)}
                       {renderOverlayIcon('facing', chartData.fGridIdx)}
                   </div>

               </div>

               <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-stone-500 font-song opacity-80 z-10 bg-[#fdfbf7]/80 px-4 py-2 rounded-full border border-stone-100">
                 <span className="text-xs tracking-widest text-[#8b5a2b] mr-2 opacity-100">说明中宫：</span>
                 <div className="flex items-center gap-2"><span className="font-num text-lg font-bold text-stone-800">{chartData.mountain[4]}</span><span>山星 (左上)</span></div>
                 <div className="flex items-center gap-2"><span className="font-num text-lg font-bold text-[#1e3a8a]">{chartData.water[4]}</span><span>向星 (右上)</span></div>
                 <div className="flex items-center gap-2"><span className="font-num text-sm font-bold text-[#b91c1c]">({chartData.annual[4]})</span><span>流年 (中上)</span></div>
               </div>
               
               {isDownloading && (
                  <div className="mt-8 text-sm font-weibei text-[#8b0000] opacity-60 tracking-[0.5em]">郭骐榕风水传承</div>
               )}

             </div>

             <div className="mt-2 mb-4">
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-[#8b0000] text-white px-6 py-2 rounded-sm shadow hover:bg-[#6b0000] transition-colors font-song tracking-widest text-sm"
                >
                  <Download className="w-4 h-4" />
                  保存排盘图片
                </button>
             </div>
          </div>
        ) : (
          <div className="bg-[#fdfbf7] p-6 sm:p-8 min-h-[400px] flex flex-col items-center justify-center text-center opacity-40">
             <div className="w-20 h-20 border-2 border-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <span className="font-weibei text-4xl text-stone-800">道</span>
             </div>
             <p className="font-song tracking-widest text-stone-600">静候排盘</p>
          </div>
        )}

      </div>
      <div className="mt-8 text-[10px] text-stone-400 font-song opacity-60 flex gap-4">
        <span>上愿玄空</span><span>•</span><span>易学传承</span>
      </div>
    </div>
  );
};

export default App;
