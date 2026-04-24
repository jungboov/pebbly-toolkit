import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-[#00ff00] flex flex-col items-center justify-center p-6 font-mono">
      <div className="max-w-[500px] w-full flex flex-col items-center gap-8">
        <svg
          viewBox="-1 -1 15 16"
          className="w-[200px] h-[200px]"
          style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
        >
          <rect x="2" y="0" width="9" height="1" fill="#00aaff"/>
          <rect x="1" y="1" width="11" height="1" fill="#00aaff"/>
          <rect x="1" y="2" width="11" height="1" fill="#00aaff"/>
          <rect x="1" y="3" width="11" height="1" fill="#00aaff"/>
          <rect x="1" y="4" width="11" height="1" fill="#00aaff"/>
          <rect x="1" y="5" width="11" height="1" fill="#00aaff"/>
          <rect x="0" y="6" width="13" height="1" fill="#00aaff"/>
          <rect x="0" y="7" width="1" height="1" fill="#00aaff"/>
          <rect x="1" y="7" width="1" height="1" fill="#006699"/>
          <rect x="2" y="7" width="9" height="1" fill="#00aaff"/>
          <rect x="11" y="7" width="1" height="1" fill="#006699"/>
          <rect x="12" y="7" width="1" height="1" fill="#00aaff"/>
          <rect x="0" y="8" width="1" height="1" fill="#00aaff"/>
          <rect x="1" y="8" width="1" height="1" fill="#006699"/>
          <rect x="2" y="8" width="9" height="1" fill="#00aaff"/>
          <rect x="11" y="8" width="1" height="1" fill="#006699"/>
          <rect x="12" y="8" width="1" height="1" fill="#00aaff"/>
          <rect x="0" y="9" width="1" height="1" fill="#00aaff"/>
          <rect x="1" y="9" width="1" height="1" fill="#006699"/>
          <rect x="2" y="9" width="9" height="1" fill="#00aaff"/>
          <rect x="11" y="9" width="1" height="1" fill="#006699"/>
          <rect x="12" y="9" width="1" height="1" fill="#00aaff"/>
          <rect x="0" y="10" width="1" height="1" fill="#00aaff"/>
          <rect x="1" y="10" width="1" height="1" fill="#006699"/>
          <rect x="2" y="10" width="9" height="1" fill="#00aaff"/>
          <rect x="11" y="10" width="1" height="1" fill="#006699"/>
          <rect x="12" y="10" width="1" height="1" fill="#00aaff"/>
          <rect x="0" y="11" width="13" height="1" fill="#00aaff"/>
          <rect x="2" y="12" width="2" height="2" fill="#00aaff"/>
          <rect x="9" y="12" width="2" height="2" fill="#00aaff"/>

          <rect x="3" y="2" width="2" height="1" fill="#000000"/>
          <rect x="3" y="3" width="2" height="1" fill="#ffffff"/>
          <rect x="8" y="2" width="2" height="1" fill="#000000"/>
          <rect x="8" y="3" width="2" height="1" fill="#ffffff"/>

          <rect x="4" y="6" width="5" height="1" fill="#004466"/>
          <rect x="3" y="5" width="1" height="1" fill="#004466"/>
          <rect x="9" y="5" width="1" height="1" fill="#004466"/>

          <rect x="14" y="2" width="1" height="1" fill="#00aaff"/>
          <rect x="14" y="3" width="2" height="1" fill="#00aaff"/>
        </svg>

        <div className="text-center space-y-4">
          <div className="text-xs tracking-[0.3em] opacity-60 font-black">// ERROR_404</div>
          <h1 className="text-6xl font-black italic tracking-tight">PAGE_NOT_FOUND</h1>
          <p className="text-sm opacity-75 tracking-wider leading-relaxed">
            The pixels you&apos;re looking for<br />
            have been removed from existence.
          </p>
        </div>

        <Link
          href="/"
          className="group inline-flex items-center gap-3 px-6 py-3 border-2 border-[#00ff00] text-[#00ff00] font-black tracking-[0.2em] text-sm hover:bg-[#00ff00] hover:text-black transition-all"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>RETURN_HOME</span>
        </Link>
      </div>
    </div>
  );
}
