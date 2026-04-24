"use client";

export function BotLoader({ size = 64 }: { size?: number }) {
  return (
    <div
      className="inline-block animate-bounce-gentle"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="-1 -1 15 16"
        className="w-full h-full"
        style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
      >
        <rect x="2" y="0" width="9" height="1" fill="#00ff00"/>
        <rect x="1" y="1" width="11" height="1" fill="#00ff00"/>
        <rect x="1" y="2" width="11" height="1" fill="#00ff00"/>
        <rect x="1" y="3" width="11" height="1" fill="#00ff00"/>
        <rect x="1" y="4" width="11" height="1" fill="#00ff00"/>
        <rect x="1" y="5" width="11" height="1" fill="#00ff00"/>
        <rect x="0" y="6" width="13" height="1" fill="#00ff00"/>
        <rect x="0" y="7" width="1" height="1" fill="#00ff00"/>
        <rect x="1" y="7" width="1" height="1" fill="#009900"/>
        <rect x="2" y="7" width="9" height="1" fill="#00ff00"/>
        <rect x="11" y="7" width="1" height="1" fill="#009900"/>
        <rect x="12" y="7" width="1" height="1" fill="#00ff00"/>
        <rect x="0" y="8" width="1" height="1" fill="#00ff00"/>
        <rect x="1" y="8" width="1" height="1" fill="#009900"/>
        <rect x="2" y="8" width="9" height="1" fill="#00ff00"/>
        <rect x="11" y="8" width="1" height="1" fill="#009900"/>
        <rect x="12" y="8" width="1" height="1" fill="#00ff00"/>
        <rect x="0" y="9" width="1" height="1" fill="#00ff00"/>
        <rect x="1" y="9" width="1" height="1" fill="#009900"/>
        <rect x="2" y="9" width="9" height="1" fill="#00ff00"/>
        <rect x="11" y="9" width="1" height="1" fill="#009900"/>
        <rect x="12" y="9" width="1" height="1" fill="#00ff00"/>
        <rect x="0" y="10" width="1" height="1" fill="#00ff00"/>
        <rect x="1" y="10" width="1" height="1" fill="#009900"/>
        <rect x="2" y="10" width="9" height="1" fill="#00ff00"/>
        <rect x="11" y="10" width="1" height="1" fill="#009900"/>
        <rect x="12" y="10" width="1" height="1" fill="#00ff00"/>
        <rect x="0" y="11" width="13" height="1" fill="#00ff00"/>
        <rect x="2" y="12" width="2" height="2" fill="#00ff00"/>
        <rect x="9" y="12" width="2" height="2" fill="#00ff00"/>

        <rect x="3" y="2" width="2" height="2" fill="#ffffff"/>
        <rect x="3" y="3" width="2" height="1" fill="#00ff00"/>
        <rect x="8" y="2" width="2" height="2" fill="#ffffff"/>
        <rect x="8" y="3" width="2" height="1" fill="#00ff00"/>

        <rect x="4" y="6" width="5" height="1" fill="#007700"/>
      </svg>
    </div>
  );
}
