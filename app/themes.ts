export type ThemeName = 'pixel'; // 'pixel'만 남김

export const themes = {
  pixel: {
    bg: "bg-[#222] text-[#00ff00] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]",
    nav: "border-b-4 border-[#00ff00] bg-black",
    card: "bg-black border-4 border-[#00ff00] shadow-[8px_8px_0px_0px_rgba(0,255,0,0.3)]",
    accent: "text-[#00ff00]",
    buttonPrimary: "bg-[#00ff00] text-black font-bold hover:bg-white border-b-4 border-r-4 border-green-900 active:translate-y-1 active:border-0",
    buttonSecondary: "border-2 border-[#00ff00] hover:bg-[#003300] text-[#00ff00]",
    dropzone: "bg-[#111] border-[#00ff00] border-dashed",
    font: "font-mono",
    cardText: "text-[#00ff00]",
    // [대안 2 적용] Minimal 모서리 오버레이 테마
    labelOverlay: "absolute bottom-4 right-4 z-20 flex gap-2",
    labelOverlayActive: "bg-[#00ff00] text-black px-2 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest",
    labelOverlayInactive: "text-white/30 px-2 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest blur-[1px]",
  }
};

/**
 * 전역 CSS 애니메이션 스타일 정의
 * 썸네일에서 'processing' 상태일 때 사용되는 spin-slow 효과를 위해 필요합니다.
 */
export const GlobalStyles = `
  @keyframes spin-slow {
    from { transform: rotate(0deg) scale(1.2); }
    to { transform: rotate(360deg) scale(1.2); }
  }
  .animate-spin-slow {
    animation: spin-slow 10s linear infinite;
  }
`;