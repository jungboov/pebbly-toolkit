"use client";

import { useState, useRef } from 'react';
import { removeBackground } from '@imgly/background-removal';
import JSZip from 'jszip';
import { themes, ThemeName } from './themes';

interface BatchItem {
  id: string;
  original: string;
  processed: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  fileName: string;
}

export default function Home() {
  const [themeName, setThemeName] = useState<ThemeName>('carbon');
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [compareSlider, setCompareSlider] = useState(50);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = themes[themeName] || themes.carbon;

  // 1. 다중 파일 순차 처리 (Queue)
  const processNextInQueue = async (items: BatchItem[]) => {
    for (const item of items) {
      setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));
      
      try {
        const response = await fetch(item.original);
        const blob = await response.blob();
        
        const resultBlob = await removeBackground(blob, {
          progress: (_, current, total) => {
            const p = Math.round((current / total) * 100);
            setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, progress: p } : i));
          }
        });

        const processedUrl = URL.createObjectURL(resultBlob);
        setBatchItems(prev => prev.map(i => i.id === item.id ? { 
          ...i, processed: processedUrl, status: 'completed', progress: 100 
        } : i));
      } catch (error) {
        console.error("Processing error:", error);
        setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
      }
    }
  };

  // 2. 파일 업로드 핸들러
  const handleFiles = (files: FileList) => {
    const newItems: BatchItem[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      original: URL.createObjectURL(file),
      processed: null,
      status: 'pending',
      progress: 0,
      fileName: file.name
    }));

    setBatchItems(prev => [...prev, ...newItems]);
    if (selectedIndex === null) setSelectedIndex(batchItems.length);
    processNextInQueue(newItems);
  };

  // 3. ZIP 일괄 다운로드 (Turbopack 에러 방지용 다이나믹 임포트)
  const handleDownloadAll = async () => {
    const completedItems = batchItems.filter(item => item.status === 'completed' && item.processed);
    if (completedItems.length === 0) return;

    setIsDownloading(true);
    const zip = new JSZip();

    try {
      const { saveAs } = await import('file-saver'); // Client-side only import

      for (const item of completedItems) {
        const response = await fetch(item.processed!);
        const blob = await response.blob();
        const cleanName = item.fileName.split('.').slice(0, -1).join('.') || 'image';
        zip.file(`${cleanName}_no_bg.png`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "pebbly_results.zip");
    } catch (error) {
      alert("다운로드 중 오류가 발생했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  const selectedItem = selectedIndex !== null ? batchItems[selectedIndex] : null;

  return (
    <main className={`min-h-screen transition-all duration-700 ${t.bg} ${t.font} antialiased`}>
      {/* Navigation */}
      <nav className={`${t.nav} sticky top-0 z-50 backdrop-blur-xl bg-opacity-80`}>
        <div className="max-w-[1600px] mx-auto px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black bg-current text-black shadow-lg`}>Pb</div>
            <span className="text-sm font-black uppercase tracking-tighter">Pebbly Toolkit</span>
          </div>
          <div className="flex gap-1 p-1 bg-black/5 rounded-2xl overflow-x-auto max-w-[60%] scrollbar-hide">
            {(Object.keys(themes) as ThemeName[]).map((name) => (
              <button key={name} onClick={() => setThemeName(name)} className={`px-4 py-1.5 text-[10px] font-bold uppercase transition-all rounded-xl whitespace-nowrap ${themeName === name ? 'bg-white text-black shadow-sm' : 'opacity-40 hover:opacity-100'}`}>
                {name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-12">
            <header>
              <h1 className="text-[80px] md:text-[120px] font-black italic tracking-tighter leading-[0.8] uppercase select-none">
                Background <br/> <span className={t.accent}>Remover</span>
              </h1>
            </header>

            {/* 메인 작업 영역: 배경 제거 미리보기 강화 */}
            <div 
              className={`${t.card} relative min-h-[550px] overflow-hidden flex items-center justify-center border-2 border-dashed ${t.dropzone} ${isDragging ? 'scale-[0.98] border-opacity-100 ring-4 ring-current ring-opacity-10' : 'border-opacity-20'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
            >
              <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleFiles(e.target.files)} accept="image/*" multiple className="hidden" />

              {!selectedItem ? (
                <div className="text-center cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-16 h-16 border-2 border-current opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform font-light text-3xl">+</div>
                  <p className="text-[12px] font-black tracking-[0.5em] uppercase opacity-40">Click or Drop Multiple Images</p>
                </div>
              ) : (
                <div className="relative w-full h-full p-10 flex items-center justify-center group">
                  {/* 투명 배경 격자무늬 컨테이너 */}
                  <div className="relative shadow-2xl rounded-sm overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-gray-200">
                    
                    {/* 1. 하단 레이어: 배경이 제거된 이미지 (항상 깔려 있음) */}
                    {selectedItem.processed ? (
                      <img src={selectedItem.processed} className="max-h-[500px] object-contain block" alt="processed" />
                    ) : (
                      <img src={selectedItem.original} className="max-h-[500px] object-contain block opacity-50" alt="placeholder" />
                    )}
                    
                    {/* 2. 상단 레이어: 원본 이미지 (슬라이더 값에 따라 오른쪽에서 왼쪽으로 가려짐) */}
                    {selectedItem.processed && (
                      <div 
                        className="absolute inset-0 overflow-hidden z-10 transition-all duration-75" 
                        style={{ clipPath: `inset(0 0 0 ${compareSlider}%)` }}
                      >
                        <img src={selectedItem.original} className="max-h-[500px] object-contain block" alt="original" />
                      </div>
                    )}

                    {/* 3. 슬라이더 바 컨트롤 */}
                    {selectedItem.processed && (
                      <>
                        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none" style={{ left: `${compareSlider}%` }}>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold text-[12px] shadow-2xl border-2 border-gray-100">↔</div>
                        </div>
                        <input 
                          type="range" min="0" max="100" value={compareSlider} 
                          onChange={(e) => setCompareSlider(Number(e.target.value))} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" 
                        />
                      </>
                    )}
                  </div>

                  {/* 처리 중 로딩 상태 */}
                  {selectedItem.status === 'processing' && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40">
                      <p className="text-6xl font-black italic animate-pulse">{selectedItem.progress}%</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 하단 썸네일 리스트 */}
            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide">
              <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-current opacity-20 hover:opacity-100 transition-all flex items-center justify-center text-3xl"> + </button>
              {batchItems.map((item, idx) => (
                <div key={item.id} onClick={() => setSelectedIndex(idx)} className={`flex-shrink-0 w-24 h-24 rounded-xl border-2 overflow-hidden cursor-pointer transition-all relative ${selectedIndex === idx ? 'border-[#0f62fe] scale-110 z-10 shadow-xl' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                  <img src={item.original} className="w-full h-full object-cover" />
                  {item.status === 'processing' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold">{item.progress}%</div>}
                  {item.status === 'completed' && <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] text-white shadow-lg">✓</div>}
                </div>
              ))}
            </div>
          </div>

          {/* 사이드바 제어창 */}
          <div className="lg:col-span-4 pt-10 lg:pt-56 space-y-10">
            <div className={`${t.card} p-10`}>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-10 opacity-40 italic underline">Batch_Control_Node</h3>
              <div className="space-y-4">
                <button 
                  onClick={handleDownloadAll}
                  disabled={isDownloading || !batchItems.some(i => i.status === 'completed')}
                  className={`w-full py-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:-translate-y-1 ${batchItems.some(i => i.status === 'completed') ? t.buttonPrimary : 'opacity-20 cursor-not-allowed'}`}
                >
                  {isDownloading ? "Zipping..." : `Download All (${batchItems.filter(i => i.status === 'completed').length})`}
                </button>
                <button onClick={() => { setBatchItems([]); setSelectedIndex(null); }} className={`w-full py-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all ${t.buttonSecondary}`}>Clear Memory</button>
              </div>
              {selectedItem && (
                <div className="mt-12 pt-8 border-t border-current border-opacity-10">
                  <p className="text-[11px] font-bold truncate mb-1">{selectedItem.fileName}</p>
                  <p className={`text-[9px] font-mono uppercase font-black ${selectedItem.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedItem.status}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}