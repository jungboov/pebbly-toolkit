"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { removeBackground, Config } from '@imgly/background-removal';
import JSZip from 'jszip';
import { themes } from './themes';
import { motion, AnimatePresence } from 'framer-motion';

interface BatchItem {
  id: string;
  original: string;
  processed: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  fileName: string;
}

type UserPlan = 'free' | 'pro' | 'pro_plus';

// 결제 연동 전까지는 free로 고정. 추후 인증/구독 상태에서 동적으로 결정.
const PLAN_LIMITS: Record<UserPlan, { concurrency: number; maxBatch: number }> = {
  free: { concurrency: 2, maxBatch: 10 },
  pro: { concurrency: 4, maxBatch: 50 },
  pro_plus: {
    concurrency:
      typeof navigator !== 'undefined'
        ? Math.min(navigator.hardwareConcurrency || 4, 8)
        : 4,
    maxBatch: Infinity,
  },
};

export default function Home() {
  // 테마를 'pixel'로 아예 고정합니다.
  const t = themes.pixel;

  const currentPlan: UserPlan = 'free';
  const { concurrency, maxBatch } = PLAN_LIMITS[currentPlan];

  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [compareSlider, setCompareSlider] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processNextInQueue = async (items: BatchItem[]) => {
    const config: Partial<Config> & { numThreads?: number } = {
      model: 'isnet',
      device: 'cpu',
      numThreads: 1,
    };

    const queue: BatchItem[] = [...items];

    const processOne = async (item: BatchItem) => {
      setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));
      try {
        const resultBlob = await removeBackground(item.original, {
          ...config,
          progress: (_, current, total) => {
            const p = Math.round((current / total) * 100);
            setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, progress: p } : i));
          }
        });
        const url = URL.createObjectURL(resultBlob);
        setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, processed: url, status: 'completed', progress: 100 } : i));
      } catch (e) {
        console.error("처리 오류:", e);
        setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
      }
    };

    const worker = async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (next) await processOne(next);
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
  };

  const handleFiles = (files: FileList | File[]) => {
    const startIdx = batchItems.length;
    let filesArray = Array.from(files);
    if (filesArray.length > maxBatch) {
      console.warn(`배치 크기 초과 (${filesArray.length} > ${maxBatch}). 초과분 ${filesArray.length - maxBatch}개 무시됨.`);
      filesArray = filesArray.slice(0, maxBatch);
    }
    const newItems: BatchItem[] = filesArray.map(file => ({
      id: crypto.randomUUID(),
      original: URL.createObjectURL(file),
      processed: null,
      status: 'pending',
      progress: 0,
      fileName: file.name
    }));
    setBatchItems(prev => [...prev, ...newItems]);
    if (selectedIndex === null) setSelectedIndex(startIdx);
    setTimeout(() => processNextInQueue(newItems), 100);
  };

  // 전역 드래그 앤 드롭 핸들러
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.relatedTarget === null) setIsDragging(false);
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [batchItems]);

  // 다운로드 기능
  const handleDownloadAll = async () => {
    const completedItems = batchItems.filter(item => item.status === 'completed' && item.processed);
    if (completedItems.length === 0) return;
    setIsDownloading(true);
    const zip = new JSZip();
    try {
      const { saveAs } = await (await import('file-saver')).default;
      for (const item of completedItems) {
        const response = await fetch(item.processed!);
        const blob = await response.blob();
        zip.file(`${item.fileName.replace(/\.[^/.]+$/, "")}_no_bg.png`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "results.zip");
    } catch (error) {
      console.error("다운로드 실패:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const selectedItem = useMemo(() => 
    selectedIndex !== null ? batchItems[selectedIndex] : null
  , [batchItems, selectedIndex]);

  return (
    <main className={`min-h-screen ${t.bg} ${t.font} transition-colors duration-500 antialiased overflow-x-hidden relative`}>
      {/* 드래그 앤 드롭 오버레이 */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-green-500/20 backdrop-blur-md border-4 border-dashed border-[#00ff00] m-6 rounded-3xl flex items-center justify-center pointer-events-none"
          >
            <div className="text-black text-3xl font-black uppercase tracking-widest bg-[#00ff00] px-8 py-4 rounded-none shadow-[10px_10px_0px_rgba(0,0,0,0.5)]">
              Drop Images to Process
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={`${t.nav} sticky top-0 z-50 backdrop-blur-md px-8 py-3 flex justify-between items-center`}>
        <div className="font-black uppercase tracking-tighter text-[#00ff00]">Pb Toolkit _ Pixel_v1.0</div>
        <div className="text-[9px] font-bold text-[#00ff00] opacity-50 uppercase tracking-widest">
          Status: Online // Mode: Background_Removal
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        <div className="lg:col-span-8 space-y-10">
          <header>
            <h1 className={`text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none ${t.accent}`}>
              Pixel <br/> Remover
            </h1>
          </header>

          {/* 메인 뷰어 */}
          <div className={`${t.card} relative aspect-[16/10] flex items-center justify-center overflow-hidden rounded-none bg-black/40`}>
            {!selectedItem ? (
              <div className="text-center cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <div className="w-16 h-16 border-2 border-[#00ff00] flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:bg-[#00ff00] group-hover:text-black transition-all">+</div >
                <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-60">Click or Drag Images Here</span>
              </div>
            ) : (
              <div className="relative w-full h-full p-8 flex items-center justify-center">
                <div className="relative max-h-full shadow-2xl checkerboard-bg overflow-hidden border-2 border-[#00ff00]">
                  <img src={selectedItem.processed || selectedItem.original} className={`max-h-[500px] object-contain block ${selectedItem.status === 'processing' ? 'opacity-30 blur-sm' : ''}`} alt="Main View" />
                  
                  {selectedItem.processed && (
                  <>
                    <div className="absolute inset-0 overflow-hidden z-10" style={{ clipPath: `inset(0 0 0 ${compareSlider}%)` }}>
                      <img src={selectedItem.original} className="max-h-[500px] object-contain block" alt="Original Layer" />
                    </div>
                    
                    <div className="absolute top-0 bottom-0 w-[2px] bg-[#00ff00] z-20 pointer-events-none shadow-[0_0_10px_#00ff00]" style={{ left: `${compareSlider}%` }}>
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black border-2 border-[#00ff00] text-[#00ff00] text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(0,255,0,0.5)] whitespace-nowrap z-30">
                        {compareSlider > 50 ? 'SRC_ORIGIN' : 'OUT_PROCESS'}
                      </div>
                      
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-black border-2 border-[#00ff00] flex items-center justify-center text-[#00ff00] shadow-[0_0_20px_rgba(0,255,0,0.4)] transform rotate-45">
                        <div className="transform -rotate-45 font-black text-xs">↔</div>
                      </div>
                    </div>
                    
                    <input type="range" min="0" max="100" value={compareSlider} onChange={(e) => setCompareSlider(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" />
                  </>
                )}
                  
                  {selectedItem.status === 'processing' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
                      <span className="text-5xl font-black italic tracking-tight text-[#00ff00] animate-pulse">{selectedItem.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={e => e.target.files && handleFiles(e.target.files)} />
          </div>

          {/* 썸네일 바 */}
          <div className="flex gap-4 overflow-x-auto py-2 scrollbar-hide">
            <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-20 h-20 border-2 border-[#00ff00] opacity-30 hover:opacity-100 flex items-center justify-center text-xl transition-all">+</button>
            {batchItems.map((item, idx) => (
              <div key={item.id} onClick={() => { setSelectedIndex(idx); setCompareSlider(50); }}
                className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 cursor-pointer relative transition-all 
                  ${selectedIndex === idx ? 'border-[#00ff00] scale-105 shadow-[0_0_15px_#00ff00]' : 'border-transparent opacity-40 hover:opacity-100'}
                  ${item.status === 'processing' ? 'animate-pulse' : ''}`}
              >
                <img src={item.original} className={`w-full h-full object-cover pointer-events-none ${item.status === 'pending' ? 'grayscale opacity-30' : ''}`} alt="Thumbnail" />
                {item.status === 'completed' && <div className="absolute top-1 right-1 w-4 h-4 bg-[#00ff00] text-black font-bold flex items-center justify-center text-[8px] z-10 shadow-md">OK</div>}
                {item.status === 'processing' && <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-[10px] font-bold text-[#00ff00] z-20">{item.progress}%</div>}
              </div>
            ))}
          </div>
        </div>

        {/* 제어판 */}
        <div className="lg:col-span-4 lg:pt-48 space-y-6">
          <div className={`${t.card} p-8 space-y-4 shadow-[10px_10px_0px_#00ff0022]`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#00ff00] opacity-50 mb-6"># Batch_Control_Node</p>
            <button onClick={handleDownloadAll} disabled={isDownloading || !batchItems.some(i => i.status === 'completed')}
              className={`w-full py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-20 ${t.buttonPrimary}`}>
              {isDownloading ? ">> Archiving..." : `Download_Results (${batchItems.filter(i => i.status === 'completed').length})`}
            </button>
            <button onClick={() => {
              batchItems.forEach(item => {
                URL.revokeObjectURL(item.original);
                if (item.processed) URL.revokeObjectURL(item.processed);
              });
              setBatchItems([]);
              setSelectedIndex(null);
            }} className={`w-full py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all opacity-40 hover:opacity-100 border border-[#00ff00] text-[#00ff00]`}>
              Clear_Cache
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}