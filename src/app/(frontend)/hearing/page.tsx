"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";

type QuestionType = "radio" | "checkbox";

interface Option {
  label: string;
  value: string;
  hasInput?: boolean;
  inputPlaceholder?: string;
}

interface Question {
  id: string;
  cat: string;
  title: string;
  desc?: string;
  type: QuestionType;
  options: Option[];
}

const questions: Question[] = [
  { id: 'q1', cat: 'Category 1', title: 'あなたのビジネスジャンルは？', type: 'radio', options: [{ label: '個人クリエイター / フリーランス', value: '個人クリエイター / フリーランス' }, { label: '実店舗', value: '実店舗' }, { label: '小規模事業', value: '小規模事業' }, { label: '中小企業', value: '中小企業' }, { label: 'NPO / コミュニティ', value: 'NPO / コミュニティ' }, { label: 'その他', value: 'その他', hasInput: true, inputPlaceholder: '業種・ビジネス内容を入力' }] },
  { id: 'q2', cat: 'Category 1', title: 'Webサイトを作る一番の目的は？', type: 'radio', options: [{ label: '問い合わせ増加', value: '問い合わせ増加' }, { label: 'EC・販売', value: 'EC・販売' }, { label: '採用', value: '採用' }, { label: '信頼感向上', value: '信頼感向上（名刺代わり）' }, { label: '世界観・ポートフォリオ', value: '世界観・ポートフォリオ' }, { label: 'リニューアル', value: 'リニューアル' }] },
  { id: 'q3', cat: 'Category 2', title: '主なターゲットは？', desc: '※複数選択可', type: 'checkbox', options: [{ label: '一般消費者（BtoC）', value: 'BtoC' }, { label: '企業・法人（BtoB）', value: 'BtoB' }] },
  { id: 'q4', cat: 'Category 2', title: '競合と比べて、自分のサイトに欲しいのは？', desc: '※複数選択可', type: 'checkbox', options: [{ label: 'デザイン性', value: 'デザイン性' }, { label: '信頼感', value: '信頼感' }, { label: '使いやすさ', value: '使いやすさ' }, { label: 'ユニークさ', value: 'ユニークさ' }, { label: 'コスパ', value: 'コスパ' }] },
  { id: 'q5', cat: 'Category 3', title: 'サイトの雰囲気として近いのは？', desc: '※複数選択可', type: 'checkbox', options: [{ label: 'ダーク・スタイリッシュ', value: 'ダーク・スタイリッシュ' }, { label: 'ミニマル・シンプル', value: 'ミニマル・シンプル' }, { label: 'ポップ・カラフル', value: 'ポップ・カラフル' }, { label: '高級感・上品', value: '高級感・上品' }, { label: '提案希望', value: '提案希望' }] },
  { id: 'q6', cat: 'Category 3', title: 'サイトに載せたいビジュアルのメインは？', type: 'radio', options: [{ label: '写真', value: '写真' }, { label: 'イラスト', value: 'イラスト' }, { label: '動画', value: '動画' }, { label: 'テキスト中心', value: 'テキスト中心' }, { label: '素材なし・相談', value: '素材なし・相談' }] },
  { id: 'q7', cat: 'Category 3', title: '参考にしたいサイトのイメージはある？', desc: '※複数選択可', type: 'checkbox', options: [{ label: '国内サイト', value: '国内サイト', hasInput: true, inputPlaceholder: 'URLを貼り付け' }, { label: '海外サイト', value: '海外サイト', hasInput: true, inputPlaceholder: 'URLを貼り付け' }, { label: 'SNSデザイン', value: 'SNSデザイン', hasInput: true, inputPlaceholder: 'リンクを貼り付け' }, { label: 'おまかせ', value: 'おまかせ' }] },
  { id: 'q8', cat: 'Category 4', title: 'サイトのページ数のイメージは？', type: 'radio', options: [{ label: '1ページ', value: '1ページ' }, { label: '3〜5ページ', value: '3〜5ページ' }, { label: '10ページ以上', value: '10ページ以上' }, { label: '未定', value: '未定' }] },
  { id: 'q9', cat: 'Category 4', title: '自分でコンテンツを更新したい？', type: 'radio', options: [{ label: '定期更新', value: '定期更新' }, { label: 'たまに更新', value: 'たまに更新' }, { label: '更新しない', value: '更新しない' }] },
  { id: 'q10', cat: 'Category 4', title: 'サイトに必要な機能は？', desc: '※複数選択可', type: 'checkbox', options: [{ label: 'フォーム', value: 'フォーム' }, { label: '予約システム', value: '予約システム' }, { label: 'EC決済', value: 'EC決済' }, { label: '会員ページ', value: '会員ページ' }, { label: '動画埋め込み', value: '動画埋め込み' }, { label: 'SNS連携', value: 'SNS連携' }, { label: '多言語', value: '多言語' }, { label: 'なし・不明', value: 'なし・不明' }] },
  { id: 'q11', cat: 'Category 4', title: 'ドメイン・サーバーの準備は？', type: 'radio', options: [{ label: '既存あり', value: '既存あり' }, { label: '自分で手配可', value: '自分で手配可' }, { label: 'おまかせ', value: 'おまかせ' }] },
  { id: 'q12', cat: 'Category 5', title: '制作予算のイメージは？', type: 'radio', options: [{ label: '〜15万', value: '〜15万' }, { label: '15〜35万', value: '15〜35万' }, { label: '35万〜', value: '35万〜' }, { label: '未定', value: '未定' }] },
  { id: 'q13', cat: 'Category 5', title: '公開希望の時期は？', type: 'radio', options: [{ label: '1ヶ月以内', value: '1ヶ月以内' }, { label: '2〜3ヶ月以内', value: '2〜3ヶ月以内' }, { label: '半年以内', value: '半年以内' }, { label: '未定', value: '未定' }] },
  { id: 'q14', cat: 'Category 5', title: '今、素材（ロゴ・写真・文章）は揃っている？', type: 'radio', options: [{ label: '揃っている', value: '揃っている' }, { label: 'ロゴのみ', value: 'ロゴのみ' }, { label: '一緒に作りたい', value: '一緒に作りたい' }, { label: '全部おまかせ', value: '全部おまかせ' }] }
];

const STORAGE_KEY = 'noeShiftica_Hearing_Data';
const EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000;

export default function HearingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [savedData, setSavedData] = useState<Record<string, string[]>>({});
  const [subData, setSubData] = useState<Record<string, Record<string, string>>>({});
  const [isEditingFromSummary, setIsEditingFromSummary] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isRestoredRef = useRef(false);

  const getStepFromUrl = () => {
    if (typeof window === 'undefined') return 0;
    const params = new URLSearchParams(window.location.search);
    const step = params.get('step');
    if (step === 'summary') return questions.length;
    const stepNum = parseInt(step || '1');
    return Math.max(0, Math.min(stepNum - 1, questions.length));
  };

  useEffect(() => {
    setIsMounted(true);
    let initialStep = 0;
    
    try {
      const itemStr = localStorage.getItem(STORAGE_KEY);
      if (itemStr) {
        const item = JSON.parse(itemStr);
        if (Date.now() - item.timestamp > EXPIRE_TIME) {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          const data = item.data || {};
          setSavedData(data);
          setSubData(item.subData || {});

          // すべての質問に回答済みの場合は確認画面、それ以外は保存されていたステップまたは最後に回答した次の質問から再開する
          const allAnswered = questions.every(q => data[q.id] && data[q.id].length > 0);
          if (allAnswered) {
            initialStep = questions.length;
          } else if (typeof item.step === 'number') {
            initialStep = Math.max(0, Math.min(item.step, questions.length));
          } else {
            const firstUnansweredIdx = questions.findIndex(q => !data[q.id] || data[q.id].length === 0);
            if (firstUnansweredIdx > 0) {
              initialStep = firstUnansweredIdx;
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    
    // URLパラメータの優先順位
    const urlStep = getStepFromUrl();
    const params = new URLSearchParams(window.location.search);
    if (params.has('step') || params.get('view') === 'summary') {
      initialStep = urlStep;
    }

    setCurrentStep(initialStep);
    isRestoredRef.current = true;

    // Initial state setup to handle the first back button
    const stepParam = initialStep === questions.length ? 'summary' : (initialStep + 1).toString();
    window.history.replaceState({ step: initialStep }, "", `?step=${stepParam}`);

    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        if (typeof event.state.step === 'number') {
          setCurrentStep(event.state.step);
        }
        setIsEditingFromSummary(!!event.state.isEditingFromSummary);
      } else {
        // Fallback for popstate without state (initial load etc)
        setCurrentStep(getStepFromUrl());
        setIsEditingFromSummary(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const saveToLocal = (dataToSave: Record<string, string[]>, subsToSave: Record<string, Record<string, string>>, stepToSave?: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: dataToSave,
        subData: subsToSave,
        step: typeof stepToSave === 'number' ? stepToSave : currentStep,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error(e);
    }
  };

  // ステップが変更されたらローカルストレージを更新する
  useEffect(() => {
    if (isMounted && isRestoredRef.current) {
      saveToLocal(savedData, subData, currentStep);
    }
  }, [currentStep, isMounted, savedData, subData]);

  const handleOptionClick = (qId: string, val: string, type: QuestionType) => {
    let newData = { ...savedData };
    if (type === 'radio') {
      newData[qId] = [val];
      setSavedData(newData);
      saveToLocal(newData, subData);

      const q = questions.find(q => q.id === qId);
      const option = q?.options.find(o => o.value === val);
      if (!option?.hasInput) {
        // Pass the latest data to changeStep to avoid stale closure issue
        setTimeout(() => changeStep(1, newData), 400);
      }
    } else {
      if (!newData[qId]) newData[qId] = [];
      if (newData[qId].includes(val)) {
        newData[qId] = newData[qId].filter(v => v !== val);
      } else {
        newData[qId].push(val);
      }
      setSavedData(newData);
      saveToLocal(newData, subData);
    }
  };

  const handleSubInput = (qId: string, val: string, text: string) => {
    const newSubData = { ...subData };
    if (!newSubData[qId]) newSubData[qId] = {};
    newSubData[qId][val] = text;
    setSubData(newSubData);
    saveToLocal(savedData, newSubData);
  };

  const changeStep = (dir: number, dataToValidate?: Record<string, string[]>) => {
    if (dir === -1) {
      window.history.back();
      return;
    }

    if (isEditingFromSummary) {
      setIsEditingFromSummary(false);
      const nextStep = questions.length;
      const stepParam = 'summary';
      window.history.pushState({ step: nextStep, isEditingFromSummary: false }, "", `?step=${stepParam}`);
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const currentData = dataToValidate || savedData;

    if (dir === 1 && currentStep < questions.length) {
      const qId = questions[currentStep].id;
      if (!currentData[qId] || currentData[qId].length === 0) {
        alert("選択肢を選んでから次に進んでください。");
        return;
      }
    }

    const nextStep = Math.min(Math.max(currentStep + dir, 0), questions.length);
    const stepParam = nextStep === questions.length ? 'summary' : (nextStep + 1).toString();
    
    window.history.pushState({ step: nextStep, isEditingFromSummary: false }, "", `?step=${stepParam}`);
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitFinal = () => {
    // 最終的にcontactページへリダイレクト
    router.push('/#contact');
  };

  if (!isMounted) return null;

  const progressPercentage = Math.min(100, Math.round((currentStep / questions.length) * 100));

  return (
    <div className="min-h-screen bg-[#08080A] text-[#F4F4F5] font-sans overflow-x-hidden selection:bg-[#E2FF3D]/30 flex flex-col">
      {/* ProgressBar */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-white/5 z-101">
        <div
          className="h-full bg-[#E2FF3D] transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercentage}%`, boxShadow: '0 0 12px rgba(226, 255, 61, 0.4)' }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: currentStep === 0 ? 0 : -100, opacity: currentStep === 0 ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 w-full p-6 lg:p-8 flex justify-between items-center z-100 backdrop-blur-md bg-linear-to-b from-[#08080A]/80 to-transparent"
      >
        <Link href="/" className="text-lg font-black tracking-widest uppercase hover:opacity-80 transition-opacity">
          NOE <em className="text-[#E2FF3D] not-italic">SHIFTICA</em>
        </Link>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 pt-24 pb-20 w-full max-w-3xl mx-auto relative">
        <AnimatePresence mode="wait">
          {currentStep < questions.length ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <span className="text-[11px] text-[#E2FF3D] tracking-[0.15em] uppercase mb-3 inline-block px-3 py-1 border border-[#E2FF3D]/30 rounded-full">
                {questions[currentStep].cat}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-snug">
                {questions[currentStep].title}
              </h2>
              {questions[currentStep].desc && (
                <p className="text-[13px] text-[#8A8A93] mb-8">
                  {questions[currentStep].desc}
                </p>
              )}
              {!questions[currentStep].desc && <div className="mb-8" />}

              <div className="flex flex-col gap-3">
                {questions[currentStep].options.map((opt) => {
                  const isSelected = savedData[questions[currentStep].id]?.includes(opt.value);
                  const qType = questions[currentStep].type;
                  const subValue = subData[questions[currentStep].id]?.[opt.value] || "";

                  return (
                    <div key={opt.value} className="flex flex-col">
                      <div
                        onClick={() => handleOptionClick(questions[currentStep].id, opt.value, qType)}
                        className={`bg-[#121216] border ${isSelected ? 'border-[#E2FF3D] bg-[#E2FF3D]/5' : 'border-white/10'} rounded-xl p-4 md:p-5 cursor-pointer flex items-center gap-4 transition-all duration-200 hover:bg-[#1A1A20] hover:border-white/20 select-none`}
                      >
                        <div className={`w-5 h-5 flex items-center justify-center border-2 ${qType === 'checkbox' ? 'rounded-md' : 'rounded-full'} ${isSelected ? 'border-[#E2FF3D] bg-[#E2FF3D]' : 'border-[#8A8A93]'} transition-all`}>
                          {isSelected && qType === 'checkbox' && <Check size={14} strokeWidth={3} className="text-[#08080A]" />}
                          {isSelected && qType === 'radio' && <div className="w-2 h-2 rounded-full bg-[#08080A]" />}
                        </div>
                        <span className="text-[15px] font-medium flex-1 text-white">
                          {opt.label}
                        </span>
                      </div>
                      
                      {/* Sub-input field */}
                      <AnimatePresence>
                        {isSelected && opt.hasInput && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="pl-9 overflow-hidden"
                          >
                            <input
                              type="text"
                              value={subValue}
                              onChange={(e) => handleSubInput(questions[currentStep].id, opt.value, e.target.value)}
                              placeholder={opt.inputPlaceholder}
                              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#E2FF3D]/50 transition-colors"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-10 relative">
                {currentStep > 0 ? (
                  <button
                    onClick={() => changeStep(-1)}
                    className="px-6 py-3 rounded-full text-sm font-semibold text-[#8A8A93] bg-transparent border border-white/10 hover:bg-white/5 transition-all z-10"
                  >
                    ← BACK
                  </button>
                ) : <div />}
                
                <div className="absolute left-1/2 -translate-x-1/2 text-[12px] text-[#8A8A93] tracking-widest font-semibold pointer-events-none">
                  Q{currentStep + 1} / {questions.length}
                </div>

                <button
                  onClick={() => changeStep(1)}
                  className="px-6 py-3 rounded-full text-sm font-semibold text-[#08080A] bg-white hover:bg-[#E2FF3D] hover:-translate-y-0.5 transition-all z-10"
                >
                  NEXT →
                </button>
              </div>
            </motion.div>
          ) : (
            // Summary Step
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <span className="text-[11px] text-[#E2FF3D] tracking-[0.15em] uppercase mb-3 inline-block px-3 py-1 border border-[#E2FF3D]/30 rounded-full">
                CONFIRMATION
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-snug">
                自分の整理内容を確認する
              </h2>
              
              <div className="bg-[#121216] border border-white/10 rounded-xl p-6 mb-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {questions.map((q, idx) => {
                  const ans = savedData[q.id] || [];
                  const text = ans.length ? ans.map(a => {
                    const subText = subData[q.id]?.[a];
                    return `・${a}${subText ? ` (${subText})` : ''}`;
                  }) : ['未回答'];
                  
                  return (
                    <div key={q.id} className="py-4 border-b border-white/5 last:border-0 flex justify-between items-start gap-4">
                      <div>
                        <div className="text-[12px] text-[#8A8A93] mb-1">
                          Q{idx + 1}. {q.title}
                        </div>
                        <div className={`text-[15px] font-medium leading-relaxed ${ans.length ? 'text-white' : 'text-[#8A8A93]'}`}>
                          {text.map((t, i) => <div key={i}>{t}</div>)}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const nextStep = idx;
                          const stepParam = (nextStep + 1).toString();
                          window.history.pushState({ step: nextStep, isEditingFromSummary: true }, "", `?step=${stepParam}`);
                          setIsEditingFromSummary(true);
                          setCurrentStep(nextStep);
                        }}
                        className="bg-transparent text-[11px] text-[#E2FF3D] border border-[#E2FF3D]/50 px-3 py-1 rounded hover:bg-[#E2FF3D] hover:text-[#08080A] transition-colors whitespace-nowrap shrink-0"
                      >
                        編集
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center mt-10 relative">
                <button
                  onClick={() => changeStep(-1)}
                  className="px-6 py-3 rounded-full text-sm font-semibold text-[#8A8A93] bg-transparent border border-white/10 hover:bg-white/5 transition-all z-10"
                >
                  ← BACK
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 text-[12px] text-[#8A8A93] tracking-widest font-semibold pointer-events-none">
                  REVIEW
                </div>
                <div className="w-[88px]" />
              </div>

              <div className="mt-8 flex flex-col gap-4">
                <button
                  onClick={submitFinal}
                  className="w-full bg-[#E2FF3D] hover:bg-[#c9e62f] text-[#08080A] py-5 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(226,255,61,0.3)] hover:shadow-[0_0_30px_rgba(226,255,61,0.5)] transition-all hover:-translate-y-1"
                >
                  この整理内容で無料相談する
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-semibold text-sm transition-all border border-white/10"
                >
                  この状態で保存してホームへ戻る
                </button>
                <p className="text-center text-xs text-[#8A8A93] mt-2">
                  ※回答内容はブラウザに自動保存されています。<br/>
                  ※いきなり送信されることはありません。
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
