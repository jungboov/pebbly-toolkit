"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { removeBackground, Config } from '@imgly/background-removal';
import JSZip from 'jszip';
import { themes } from './themes';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelGauge } from './components/PixelGauge';

interface BatchItem {
  id: string;
  original: string;
  processed: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  fileName: string;
  startedAt?: number;
  completedAt?: number;
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
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [modelProgress, setModelProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCompletedIdRef = useRef<string | null>(null);

  const processNextInQueue = async (items: BatchItem[]) => {
    const config: Partial<Config> & { numThreads?: number } = {
      model: 'isnet',
      device: 'cpu',
      numThreads: 1,
    };

    setModelStatus(prev => (prev === 'idle' || prev === 'error') ? 'loading' : prev);

    const queue: BatchItem[] = [...items];

    const processOne = async (item: BatchItem) => {
      const startedAt = Date.now();
      setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing', startedAt } : i));
      try {
        const resultBlob = await removeBackground(item.original, {
          ...config,
          progress: (key, current, total) => {
            const p = Math.round((current / total) * 100);
            // 모델 로딩 phase인지 heuristic 판별 (fetch/download/compute 등)
            const isModelPhase = /fetch|download|compute/i.test(key);
            if (isModelPhase) {
              setModelProgress(p);
              return;
            }
            // inference phase: 이 단계까지 왔으면 모델은 이미 로드됨
            setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, progress: p } : i));
            if (p >= 30) {
              setModelStatus(prev => prev === 'loading' ? 'ready' : prev);
            }
          }
        });
        const url = URL.createObjectURL(resultBlob);
        const completedAt = Date.now();
        lastCompletedIdRef.current = item.id;
        setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, processed: url, status: 'completed', progress: 100, completedAt } : i));
        // 첫 item이 끝까지 성공했다면 모델은 확실히 ready
        setModelStatus(prev => prev === 'loading' ? 'ready' : prev);
      } catch (e) {
        console.error("처리 오류:", e);
        setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
        setModelStatus(prev => prev === 'loading' ? 'error' : prev);
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

  // 자동 점프: 새로 완료된 item으로 selectedIndex 전환
  // (사용자가 이미 완료된 다른 썸네일을 선택했다면 방해하지 않음)
  useEffect(() => {
    const lastId = lastCompletedIdRef.current;
    if (!lastId) return;
    const idx = batchItems.findIndex(i => i.id === lastId);
    if (idx === -1 || batchItems[idx].status !== 'completed') return;

    setSelectedIndex(prevSel => {
      if (prevSel === null) return idx;
      const currentSelected = batchItems[prevSel];
      if (!currentSelected || currentSelected.status === 'pending' || currentSelected.status === 'processing') {
        return idx;
      }
      return prevSel;
    });

    lastCompletedIdRef.current = null;
  }, [batchItems]);

  const handleRetryModel = () => {
    setModelStatus('idle');
    setModelProgress(0);
    const toRetry = batchItems.filter(i => i.status === 'pending' || i.status === 'error');
    if (toRetry.length > 0) {
      setTimeout(() => processNextInQueue(toRetry), 100);
    }
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

  const batchStatus: 'idle' | 'processing' | 'ready' = useMemo(() => {
    if (batchItems.length === 0) return 'idle';
    const active = batchItems.some(i => i.status === 'pending' || i.status === 'processing');
    return active ? 'processing' : 'ready';
  }, [batchItems]);

  const batchStats = useMemo(() => {
    const total = batchItems.length;
    const completed = batchItems.filter(i => i.status === 'completed').length;
    const active = batchItems.filter(i => i.status === 'processing').length;
    const timedItems = batchItems.filter(i => i.status === 'completed' && i.startedAt != null && i.completedAt != null);
    const avgMs = timedItems.length > 0
      ? timedItems.reduce((sum, i) => sum + (i.completedAt! - i.startedAt!), 0) / timedItems.length
      : 0;
    const remaining = batchItems.filter(i => i.status === 'pending' || i.status === 'processing').length;
    const etaMs = avgMs > 0 ? (avgMs * remaining) / Math.max(concurrency, 1) : 0;
    const totalTimeMs = timedItems.length > 0
      ? Math.max(...timedItems.map(i => i.completedAt!)) - Math.min(...timedItems.map(i => i.startedAt!))
      : 0;
    return { total, completed, active, avgMs, etaMs, remaining, totalTimeMs };
  }, [batchItems, concurrency]);

  const overallPercentage = useMemo(() => {
    if (batchItems.length === 0) return 0;
    const sum = batchItems.reduce((acc, i) => {
      if (i.status === 'completed') return acc + 100;
      if (i.status === 'processing') return acc + (i.progress || 0);
      return acc;
    }, 0);
    return Math.round(sum / batchItems.length);
  }, [batchItems]);

  const formatSec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
  const formatEta = (ms: number) => ms <= 0 ? '—' : `~${Math.ceil(ms / 1000)}s`;

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
        <div className="flex items-center gap-2 text-[10px] font-black text-[#00ff00] uppercase tracking-[0.25em]">
          <span className={batchStatus === 'processing' ? 'animate-pulse' : ''}>
            {batchStatus === 'idle' ? '○' : batchStatus === 'processing' ? '●' : '✓'}
          </span>
          <span>
            {batchStatus === 'idle' && '[IDLE]'}
            {batchStatus === 'processing' && `[PROCESSING] ${batchStats.completed}/${batchStats.total}`}
            {batchStatus === 'ready' && `[READY] ${batchStats.completed}/${batchStats.total}`}
          </span>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-8 py-12 relative z-10">
        {/* 히어로 타이틀 (grid 바깥, 전체 너비) */}
        <header className="mb-10">
          <div className="text-sm font-bold uppercase tracking-[0.5em] text-[#00ff00] opacity-60 mb-2">
            // PEBBLY
          </div>
          <h1 className={`text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none ${t.accent}`}>
            Pixel <br/> Remover
          </h1>
        </header>

        {/* 메인 뷰어 + 우측 STATUS/CONTROL 카드: 같은 높이로 stretch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* 메인 뷰어 (col-span-8, aspect-[16/10]이 row 높이 결정) */}
          <div className={`lg:col-span-8 ${t.card} relative aspect-[16/10] flex items-center justify-center overflow-hidden rounded-none bg-black/40`}>
            {!selectedItem ? (
              <div className="text-center cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <div className="w-16 h-16 border-2 border-[#00ff00] flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:bg-[#00ff00] group-hover:text-black transition-all">+</div >
                <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-60">Click or Drag Images Here</span>
              </div>
            ) : (
              <div className="relative w-full h-full p-8 flex items-center justify-center">
                <div className="relative max-h-full shadow-2xl bg-checkerboard overflow-hidden border-2 border-[#00ff00]">
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

          {/* 우측: STATUS + CONTROL — 자연 높이 스택 (h-full/flex 연쇄 제거) */}
          <div className="lg:col-span-4 min-w-0">
            <div className="space-y-6 min-w-0">

              {/* STATUS 카드 */}
              <div className={`${t.card} p-6 overflow-hidden min-w-0`}>
                <div className="space-y-4 min-w-0">

                  {/* HEADER: 상태 아이콘 + 라벨 (항상) */}
                  <div className="flex-shrink-0 min-w-0">
                    {modelStatus === 'loading' ? (
                      <>
                        <div className="text-2xl text-[#00ff00] animate-pulse leading-none">⋯</div>
                        <div className="font-black uppercase tracking-[0.3em] text-[#00ff00] text-sm mt-2">INITIALIZING</div>
                      </>
                    ) : modelStatus === 'error' ? (
                      <>
                        <div className="text-2xl text-red-500 leading-none">!!</div>
                        <div className="font-black uppercase tracking-[0.3em] text-red-500 text-sm mt-2">MODEL_ERROR</div>
                      </>
                    ) : batchStatus === 'idle' ? (
                      <>
                        <div className="text-2xl text-[#00ff00] leading-none">○</div>
                        <div className="font-black uppercase tracking-[0.3em] text-[#00ff00] text-sm mt-2">IDLE</div>
                        <div className="text-[#00ff00] text-[11px] opacity-60 uppercase tracking-widest mt-3">
                          대기 중 · 이미지를 드롭하세요
                        </div>
                      </>
                    ) : batchStatus === 'processing' ? (
                      <>
                        <div className="text-2xl text-[#00ff00] animate-pulse leading-none">●</div>
                        <div className="font-black uppercase tracking-[0.3em] text-[#00ff00] text-sm mt-2">PROCESSING</div>
                        <div className="text-[#00ff00] text-[11px] font-mono mt-2 opacity-80 uppercase tracking-[0.15em]">
                          {batchStats.completed}/{batchStats.total} COMPLETE · {batchStats.active} ACTIVE
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl text-[#00ff00] leading-none">✓</div>
                        <div className="font-black uppercase tracking-[0.3em] text-[#00ff00] text-sm mt-2">READY</div>
                        <div className="text-[#00ff00] text-[11px] font-mono mt-2 opacity-80 uppercase tracking-[0.15em]">
                          {batchStats.completed}/{batchStats.total} COMPLETE
                        </div>
                      </>
                    )}
                  </div>

                  {/* AI_ENGINE (INITIALIZING 중) */}
                  {modelStatus === 'loading' && (
                    <div className="flex-shrink-0 pt-3 border-t border-[#00ff00]/20 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#00ff00] opacity-50 mb-3"># AI_ENGINE</p>
                      <div className="text-[#00ff00] text-[11px] font-mono uppercase tracking-[0.15em] opacity-80">AI Engine 준비 중</div>
                      <div className="text-[#00ff00] text-[10px] opacity-60 mt-1">43MB 다운로드 · 처음 1회만</div>
                      <div className="mt-3">
                        <PixelGauge value={modelProgress} blocks={20} height="sm" glow />
                      </div>
                    </div>
                  )}

                  {/* DETAILS (MODEL_ERROR) */}
                  {modelStatus === 'error' && (
                    <div className="flex-shrink-0 pt-3 border-t border-red-500/30 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-500 opacity-70 mb-3"># DETAILS</p>
                      <div className="text-red-400 text-[10px] opacity-80 uppercase tracking-widest leading-relaxed">네트워크 또는 브라우저 캐시 문제일 수 있습니다</div>
                      <button onClick={handleRetryModel}
                        className="mt-4 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all">
                        &gt;&gt; Retry
                      </button>
                    </div>
                  )}

                  {/* METRICS (PROCESSING) */}
                  {modelStatus !== 'loading' && modelStatus !== 'error' && batchStatus === 'processing' && (
                    <div className="flex-shrink-0 pt-3 border-t border-[#00ff00]/20 space-y-3 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#00ff00] opacity-50"># METRICS</p>
                      <div className="space-y-1.5 text-[#00ff00] text-[11px] font-mono uppercase tracking-[0.15em]">
                        <div className="flex justify-between min-w-0 gap-2">
                          <span className="opacity-60 truncate min-w-0">ETA:</span>
                          <span className="font-black flex-shrink-0 whitespace-nowrap">{formatEta(batchStats.etaMs)}</span>
                        </div>
                        <div className="flex justify-between min-w-0 gap-2">
                          <span className="opacity-60 truncate min-w-0">AVG:</span>
                          <span className="font-black flex-shrink-0 whitespace-nowrap">{batchStats.avgMs > 0 ? `${formatSec(batchStats.avgMs)} / img` : '—'}</span>
                        </div>
                      </div>
                      <div className="space-y-2 min-w-0">
                        <div className="flex justify-between min-w-0 gap-2 text-[10px] font-mono uppercase tracking-widest text-[#00ff00]/60">
                          <span className="truncate min-w-0">OVERALL</span>
                          <span className="flex-shrink-0 whitespace-nowrap">{overallPercentage}%</span>
                        </div>
                        <PixelGauge value={overallPercentage} blocks={10} height="md" glow />
                        <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff00]/60 truncate">
                          {batchStats.completed} / {batchStats.total} PROCESSED
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE (PROCESSING + 선택된 항목이 처리 중) */}
                  {modelStatus !== 'loading' && modelStatus !== 'error' && batchStatus === 'processing' && selectedItem?.status === 'processing' && (
                    <div className="flex-shrink-0 pt-3 border-t border-[#00ff00]/20 space-y-2 overflow-hidden min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#00ff00] opacity-50"># ACTIVE</p>
                      <div className="text-[11px] font-mono text-[#00ff00]/80 truncate min-w-0">
                        {selectedItem.fileName}
                      </div>
                      <div className="flex justify-between min-w-0 gap-2 text-[10px] font-mono uppercase tracking-widest text-[#00ff00]/60">
                        <span className="truncate min-w-0">CURRENT</span>
                        <span className="flex-shrink-0 whitespace-nowrap">{selectedItem.progress}%</span>
                      </div>
                      <PixelGauge value={selectedItem.progress} blocks={10} height="md" glow />
                    </div>
                  )}

                  {/* SUMMARY (READY) */}
                  {modelStatus !== 'loading' && modelStatus !== 'error' && batchStatus === 'ready' && (
                    <div className="flex-shrink-0 pt-3 border-t border-[#00ff00]/20 space-y-3 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#00ff00] opacity-50"># SUMMARY</p>
                      <div className="space-y-1.5 text-[#00ff00] text-[11px] font-mono uppercase tracking-[0.15em]">
                        <div className="flex justify-between min-w-0 gap-2">
                          <span className="opacity-60 truncate min-w-0">TOTAL_TIME:</span>
                          <span className="font-black flex-shrink-0 whitespace-nowrap">{batchStats.totalTimeMs > 0 ? formatSec(batchStats.totalTimeMs) : '—'}</span>
                        </div>
                        <div className="flex justify-between min-w-0 gap-2">
                          <span className="opacity-60 truncate min-w-0">AVG:</span>
                          <span className="font-black flex-shrink-0 whitespace-nowrap">{batchStats.avgMs > 0 ? `${formatSec(batchStats.avgMs)} / img` : '—'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FOOTER: 하단 고정 (ERROR 제외) */}
                  {modelStatus !== 'error' && (
                    <div className="mt-auto flex-shrink-0 pt-3 border-t border-[#00ff00]/20 min-w-0">
                      {batchStatus === 'ready' ? (
                        <div className="text-[#00ff00] text-[10px] font-black uppercase tracking-[0.25em] text-right opacity-80 animate-pulse">
                          ↓ DOWNLOAD_READY
                        </div>
                      ) : (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#00ff00] opacity-50 mb-2"># FULLY_LOCAL</p>
                          <div className="text-[#00ff00] text-[10px] opacity-60 leading-relaxed">
                            {batchStatus === 'idle'
                              ? '이미지는 브라우저에서만 처리되며, 외부로 전송되지 않습니다.'
                              : '유출 없음 · 100% 로컬'}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* CONTROL 카드 */}
              <div className={`${t.card} p-6 flex-shrink-0 space-y-3 min-w-0`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00ff00] opacity-50 mb-2"># CONTROL</p>
                <button onClick={handleDownloadAll} disabled={isDownloading || !batchItems.some(i => i.status === 'completed')}
                  className={`w-full py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-20 ${t.buttonPrimary}`}>
                  {isDownloading ? ">> Archiving..." : `Download_Results (${batchStats.completed})`}
                </button>
                <button onClick={() => {
                  batchItems.forEach(item => {
                    URL.revokeObjectURL(item.original);
                    if (item.processed) URL.revokeObjectURL(item.processed);
                  });
                  setBatchItems([]);
                  setSelectedIndex(null);
                }} className="w-full py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all opacity-40 hover:opacity-100 border border-[#00ff00] text-[#00ff00]">
                  Clear_Cache
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* 썸네일 바 (grid 바깥, 메인 영역 아래) */}
        <div className="mt-6 flex gap-4 overflow-x-auto py-2 scrollbar-hide">
          <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-20 h-20 border-2 border-[#00ff00] opacity-30 hover:opacity-100 flex items-center justify-center text-xl transition-all">+</button>
          {batchItems.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            const stateClass = isSelected
              ? 'border-[#00ff00] scale-105 shadow-[0_0_15px_#00ff00]'
              : item.status === 'processing'
                ? 'border-[#00ff00]/60 opacity-40 hover:opacity-100'
                : item.status === 'completed'
                  ? 'border-transparent opacity-60 hover:opacity-100 shadow-[0_0_6px_rgba(0,255,0,0.25)]'
                  : 'border-transparent opacity-40 hover:opacity-100';
            return (
              <div key={item.id} onClick={() => { setSelectedIndex(idx); setCompareSlider(50); }}
                className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 cursor-pointer relative transition-all hover:scale-105 ${stateClass} ${item.status === 'processing' ? 'animate-pulse' : ''}`}
              >
                <img src={item.original} className={`w-full h-full object-cover pointer-events-none ${item.status === 'pending' ? 'grayscale opacity-30' : ''}`} alt="Thumbnail" />
                {item.status === 'completed' && <div className="absolute top-1 right-1 w-4 h-4 bg-[#00ff00] text-black font-bold flex items-center justify-center text-[8px] z-10 shadow-md">OK</div>}
                {item.status === 'processing' && (
                  <>
                    <div className="absolute inset-0 bg-black/40 z-10" />
                    <div className="absolute top-1 right-1 bg-black/70 text-[#00ff00] text-[9px] font-black px-1 leading-none py-0.5 z-20">
                      {item.progress}%
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 z-20">
                      <PixelGauge value={item.progress} blocks={5} height="sm" />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}