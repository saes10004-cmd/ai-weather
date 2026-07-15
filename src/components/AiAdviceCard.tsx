import React from "react";
import { Sparkles, Shirt, PartyPopper, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { AdviceData } from "../types";

interface AiAdviceCardProps {
  advice: AdviceData | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function AiAdviceCard({ advice, isLoading, onRefresh }: AiAdviceCardProps) {
  return (
    <div
      className="bg-slate-900 text-slate-100 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden h-full flex flex-col justify-between"
      id="ai-advice-card"
    >
      {/* Absolute Decorative Glow element */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div>
        {/* Header with Sparkle and Refresh Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-white tracking-tight text-base sm:text-lg">AI 코디 & 코칭 조언</h3>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-white/5 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "조언 갱신"}
          </button>
        </div>

        {/* Dynamic Loading Panel */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
              <Sparkles className="w-5 h-5 text-amber-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-amber-200">Gemini가 오늘의 코디 추천 중...</p>
              <p className="text-xs text-slate-400">날씨 기온과 상태를 매칭하고 있습니다.</p>
            </div>
          </div>
        ) : advice ? (
          <div className="space-y-6" id="ai-advice-content">
            {/* 1. Summary Block */}
            <blockquote className="border-l-4 border-amber-400 pl-4 text-sm sm:text-base italic font-bold text-amber-100/90 leading-relaxed">
              "{advice.summary}"
            </blockquote>

            {/* 2. Style & Clothes */}
            <div className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                <Shirt className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">오늘의 코디 추천</h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{advice.outfit}</p>
              </div>
            </div>

            {/* 3. Action recommendations */}
            <div className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <PartyPopper className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">추천 활동</h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {Array.isArray(advice.activities) ? advice.activities.join(", ") : advice.activities}
                </p>
              </div>
            </div>

            {/* 4. Precautions */}
            {advice.precaution && (
              <div className="flex gap-4 items-start bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">주의 및 대비</h4>
                  <p className="text-xs sm:text-sm text-rose-200 leading-relaxed">{advice.precaution}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 space-y-3">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold">날씨 정보를 조회하면 맞춤형 조언을 생성합니다.</p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      {!isLoading && advice && (
        <div className="mt-8 pt-4 border-t border-white/5 text-[10px] text-slate-500 flex justify-between items-center">
          <span>Aura Weather AI Co-pilot</span>
          <span>Google Gemini 3.5 Flash</span>
        </div>
      )}
    </div>
  );
}
