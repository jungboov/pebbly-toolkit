"use client";

import { useState } from 'react';
import imglyRemoveBackground from '@imgly/background-removal';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);

    try {
      // 배경 제거 처리 (WASM 라이브러리가 브라우저에서 직접 실행됩니다)
      const blob = await imglyRemoveBackground(file, {
        progress: (key, current, total) => {
          const percent = Math.round((current / total) * 100);
          setProgress(percent);
        }
      });

      const url = URL.createObjectURL(blob);
      setImage(url);
    } catch (error) {
      console.error("배경 제거 중 오류 발생:", error);
      alert("배경 제거 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-black text-blue-600 mb-2">Pebbly Easy Toolkit</h1>
          <p className="text-gray-600">누구나 쉽게 만드는 AI 배경 제거 도구</p>
        </header>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8">
            {/* 업로드 영역 */}
            <div className="relative group border-4 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
              
              {loading ? (
                <div className="space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-blue-600 font-bold text-xl">배경 제거 중... {progress}%</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-5xl">🖼️</div>
                  <p className="text-gray-500 font-medium text-lg">
                    이곳을 클릭하거나 이미지를 드래그하세요
                  </p>
                </div>
              )}
            </div>

            {/* 결과 표시 영역 */}
            {image && !loading && (
              <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">결과 이미지</h2>
                  <a 
                    href={image} 
                    download="pebbly-result.png"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:scale-105"
                  >
                    무료 다운로드
                  </a>
                </div>
                
                {/* 투명도를 시각화하기 위해 체크박스 배경 무늬 적용 */}
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')]">
                  <img src={image} alt="Background Removed" className="w-full h-auto max-h-[500px] object-contain mx-auto shadow-2xl" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}