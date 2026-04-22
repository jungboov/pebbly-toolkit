"use client";

import { useBatchProcessor } from './hooks/useBatchProcessor';
import { themes } from './themes';
import { Hero } from './components/Hero';
import { Viewer } from './components/Viewer';
import { StatusBar } from './components/StatusBar';
import { ThumbnailStrip } from './components/ThumbnailStrip';
import { ControlRow } from './components/ControlRow';
import { DragOverlay } from './components/DragOverlay';

export default function Home() {
  const t = themes.pixel;
  const {
    batchItems,
    selectedIndex,
    setSelectedIndex,
    compareSlider,
    setCompareSlider,
    isDragging,
    isDownloading,
    modelStatus,
    modelProgress,
    selectedItem,
    batchStatus,
    batchStats,
    overallPercentage,
    fileInputRef,
    handleFiles,
    handleDownloadAll,
    handleClearCache,
    handleRetryModel,
  } = useBatchProcessor();

  return (
    <main className={`min-h-screen ${t.bg} ${t.font} antialiased overflow-x-hidden relative`}>
      <DragOverlay isDragging={isDragging} />

      <nav className={`${t.nav} sticky top-0 z-50 backdrop-blur-md px-4 py-2 flex justify-between items-center`}>
        <div className="font-black uppercase tracking-[0.15em] text-[10px] text-[#00ff00] opacity-90">
          PB TOOLKIT _ PIXEL_V1.0
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-black text-[#00ff00] uppercase tracking-[0.15em]">
          <span className={batchStatus === 'processing' ? 'animate-pulse' : ''}>
            {batchStatus === 'idle' ? '○' : batchStatus === 'processing' ? '●' : '✓'}
          </span>
          <span>[{batchStatus.toUpperCase()}]</span>
        </div>
      </nav>

      <div className="max-w-[480px] md:max-w-[560px] mx-auto px-4 py-4 md:py-6 flex flex-col gap-3 md:gap-4">
        <Hero />
        <Viewer
          selectedItem={selectedItem}
          compareSlider={compareSlider}
          onCompareChange={setCompareSlider}
          onFileInputClick={() => fileInputRef.current?.click()}
        />
        <StatusBar
          modelStatus={modelStatus}
          modelProgress={modelProgress}
          batchStatus={batchStatus}
          batchStats={batchStats}
          overallPercentage={overallPercentage}
          onRetryModel={handleRetryModel}
        />
        <ThumbnailStrip
          items={batchItems}
          selectedIndex={selectedIndex}
          onSelect={(idx) => {
            setSelectedIndex(idx);
            setCompareSlider(50);
          }}
          onAdd={() => fileInputRef.current?.click()}
        />
        <ControlRow
          completedCount={batchStats.completed}
          isDownloading={isDownloading}
          onDownload={handleDownloadAll}
          onClear={handleClearCache}
        />
        <div className="text-center text-[9px] opacity-40 tracking-[0.25em] font-black text-[#00ff00] mt-2">
          🔒 100% LOCAL · NO UPLOAD · ZERO SERVER
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
    </main>
  );
}
