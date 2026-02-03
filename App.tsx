
import React, { useState, useRef, useEffect } from 'react';
import { Scene, ScriptRequest } from './types';
import { generateScript, generateSceneSketch, refineOutline } from './geminiService';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, ImageRun, BorderStyle, VerticalAlign } from 'docx';
import saveAs from 'file-saver';

// --- 專業影像資料庫 ---
const DIRECTORS = [
  "--- 視覺美學大師 ---",
  "魏斯·安德森 (Wes Anderson)：極致對稱、粉嫩色調、中心構圖",
  "王家衛 (Wong Kar-wai)：抽幀、光影破碎、旗袍美學、情緒流",
  "史丹利·庫柏力克 (Stanley Kubrick)：一點透視、冷冽秩序感、幾何構圖",
  "查克·史奈德 (Zack Snyder)：高反差、慢動作暴力美學、英雄氣概",
  "吉勒摩·戴托羅 (Guillermo del Toro)：奇幻怪物、暗黑童話、色彩冷暖對比",
  "--- 黑色與暴力美學 ---",
  "昆汀·塔倫提諾 (Quentin Tarantino)：非線性敘事、大量對白、暴力美學、腳部特寫",
  "馬丁·史柯西斯 (Martin Scorsese)：長鏡頭、幫派史詩、快速剪輯、快節奏對白",
  "大衛·芬奇 (David Fincher)：極致精準、數位美學、完美搖攝",
  "朴贊郁 (Park Chan-wook)：陰鬱復仇、極致構圖、符號化象絨",
  "蓋·瑞奇 (Guy Ritchie)：快節奏剪輯、多線敘事、英倫痞氣",
  "--- 心理與驚悚大師 ---",
  "亞佛烈德·希區考克 (Alfred Hitchcock)：懸念營造、心理恐懼、變焦鏡頭",
  "大衛·林區 (David Lynch)：超現實夢境、不安感、工業雜訊音效",
  "克里斯多福·諾蘭 (Christopher Nolan)：實體特效、時間概念、非線性、宏大場面",
  "丹尼·維勒納夫 (Denis Villeneuve)：巨物恐懼、極簡科幻、大氣層質感",
  "戴倫·艾洛諾夫斯基 (Darren Aronofsky)：心理壓抑、快速蒙太奇、感官特寫",
  "--- 寫實與人文主義 ---",
  "小津安二郎 (Yasujiro Ozu)：榻榻米視角(低角度)、靜止美學、家庭日常",
  "是枝裕和 (Hirokazu Kore-eda)：細膩日常、家庭羈絆、自然光影",
  "楊德昌 (Edward Yang)：都市疏離、長鏡頭剖析、理性思考",
  "侯孝賢 (Hou Hsiao-hsien)：定鏡、空鏡、自然光、長鏡頭、詩意消逝",
  "李安 (Ang Lee)：中西合璧、內斂情感、古典優雅、心理層次"
];

const VISUAL_STYLES = [
  "--- 經典與膠片 ---",
  "1. 經典黑白 (B&W)", "2. 懷舊復古 (Vintage/Retro)", "3. 褪色底片 (Faded Film)", "4. 柯達金 (Kodak Gold)", "5. 富士綠 (Fujifilm Look)",
  "--- 強烈視覺 ---",
  "6. 青橙色調 (Teal & Orange)", "7. 高飽和度 (Vibrant/Technicolor)", "8. 低飽和灰調 (Desaturated)", "9. 賽博龐克 (Cyberpunk Neon)", "10. 單色提取 (Sin City Style)",
  "--- 情緒與光影 ---",
  "11. 黑色電影 (Noir Shadow)", "12. 柔光夢幻 (Dreamy Soft)", "13. 顆粒質感 (Gritty Grain)", "14. 暖陽金輝 (Golden Hour)", "15. 冷調藍影 (Cold Blue)",
  "--- 當代美學 ---",
  "16. 極致簡約 (Minimalism White)", "17. 莫蘭迪色 (Morandi Palette)", "18. 糖粉色系 (Pastel Candy)", "19. 暗調氛圍 (Moody Dark)", "20. 泥土質感 (Earthy Tones)"
];

const STRUCTURES = [
  "--- 經典好萊塢 ---",
  "1. 三幕劇結構 (Three-Act)", "2. 英雄旅程 (Hero's Journey)", "3. 五幕劇結構 (Freatag's Pyramid)", "4. 救貓咪 (Save the Cat)",
  "--- 時間操作 ---",
  "5. 非線性敘事 (Non-linear)", "6. 倒敘法 (Flashback)", "7. 環形結構 (Circular)", "8. 循環時空 (Time Loop)", "9. 反向敘事 (Reverse Chronology)",
  "--- 多線並行 ---",
  "10. 交叉敘事 (Cross-cutting)", "11. 群戲結構 (Ensemble)", "12. 羅生門結構 (Multiple Perspectives)", "13. 分段式結構 (Anthology)",
  "--- 節奏與實驗 ---",
  "14. 意識流 (Stream of Consciousness)", "15. 慢電影結構 (Slow Cinema)", "16. 蒙太奇結構 (Montage)", "17. 實時敘事 (Real-time)",
  "--- 戲劇衝突 ---",
  "18. 雙線結構", "19. 嵌套式結構 (Framing Story)", "20. 麥高芬結構 (MacGuffin Driven)", "21. 懸疑解謎結構",
  "--- 商業與類型 ---",
  "22. 公路片結構", "23. 成長小說結構 (Coming-of-age)", "24. 雙男主/女主結構", "25. 動作冒險三階段",
  "--- 現代變革 ---",
  "26. 遊戲化結構", "27. 散文電影", "28. 仿紀錄片 (Mockumentary)", "29. 桌面影院 (Screenlife)", "30. 開放式結局結構",
  "--- 其他專用模式 ---",
  "31. 溫馨", "爆款短影音模式", "廣告宣傳模式", "影片架構", "專題報導模式", "紀錄片模式", "導演風格模式", "實驗片模式", "教學片模式", "訪談式", "分鏡圖風格", "解說式", "情境劇", "廣告短片", "Vlog 日誌", "挑戰/實驗", "數據可視化", "多線敘事"
];

const TONES = [
  "溫馨", "活潑", "可愛", "感性", "知性", "衝突", "對立", "幽默", "懸疑", "勵志", 
  "奇幻", "諷刺", "驚悚", "史詩", "實驗性", "哲學", "浪漫", "熱血", "黑暗", "輕鬆", "嚴肅"
];

const AUDIENCES = [
  "兒童", "青少年", "學生", "上班族", "專業菁英", "意見領袖", "退休族", "老年", 
  "幼兒", "學齡前兒童", "中小學生", "大學生", "新創業者", "科技愛好者", "藝術創作者", 
  "家庭主婦/夫", "環保人士", "健康意識者", "旅遊愛好者", "美食家", "遊戲玩家", 
  "健身族", "寵物飼主", "財經投資者", "歷史愛好者", "科幻迷", "文藝青年", 
  "時尚追隨者", "農民", "軍人", "公務員", "企業"
];

const FEATURES = [
  "章節轉場", "快節奏敘事剪輯", "寫實模式", "科幻模式", "資訊圖表穿插", 
  "快速剪輯蒙太奇", "互動式元素", "時間加速/慢放", "反轉結局", "高潮點強調", 
  "情境鋪陳", "第一人稱視角", "劇情模式", "誇張模式", "帶貨模式", "直播模式", 
  "背景音樂引導情緒", "旁白主導", "分割畫面敘事", "色彩心理學運用", 
  "開放式結局", "訪談形式", "魔法模式", "動態文字動畫", "慢動作特寫", 
  "靜態圖像動態化", "沉浸式音效", "人物弧光描繪", "呼應式開場/結尾"
];

const SKETCH_STYLES = [
  { id: 'pencil', label: '鉛筆線稿', prompt: 'rough pencil sketch, storyboard art' },
  { id: 'asian_realistic', label: '真人亞洲風格', prompt: 'Realistic cinematic photography, featuring Asian characters, 8k' },
  { id: '2d', label: '2D 動漫風格', prompt: '2D anime style, clean lines, high quality illustration' }
];

// --- 工具組件 ---

const Header = ({ 
  showExport, 
  onExportWord, 
  onExportPDF 
}: { 
  showExport: boolean; 
  onExportWord: () => void; 
  onExportPDF: () => void;
}) => (
  <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl no-print">
    <div className="container mx-auto px-4 h-20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
          <i className="fas fa-clapperboard text-slate-900 text-xl"></i>
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tighter uppercase">導演我最行 加強版 App <span className="text-yellow-500">(InspoDirector AI)</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">導演我最行 · 專業分鏡系統</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {showExport ? (
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700 shadow-inner">
            <button 
              onClick={onExportPDF}
              className="group flex items-center gap-2 px-5 py-2.5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
              title="導出為 PDF (列印模式)"
            >
              <i className="fas fa-file-pdf text-red-500 group-hover:scale-110 transition-transform"></i>
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <div className="w-px h-5 bg-slate-700"></div>
            <button 
              onClick={onExportWord}
              className="group flex items-center gap-2 px-5 py-2.5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
              title="導出為 Word (包含圖片)"
            >
              <i className="fas fa-file-word text-blue-500 group-hover:scale-110 transition-transform"></i>
              <span className="hidden sm:inline">Export Word</span>
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-full text-[10px] font-bold text-slate-400">
             <i className="fas fa-bolt text-yellow-500 animate-pulse"></i> Gemini 3 Pro Engine
          </div>
        )}
      </div>
    </div>
  </header>
);

const Toast = ({ message, isVisible }: { message: string, isVisible: boolean }) => (
  <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-slate-800 text-yellow-500 border border-yellow-500/30 rounded-full text-xs font-bold shadow-2xl transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
    <i className="fas fa-check-circle mr-2"></i> {message}
  </div>
);

const SuggestionDropdown = ({ label, value, options, onSelect }: { label: string, value: string, options: string[], onSelect: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="space-y-2 relative" ref={ref}>
      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> {label}
      </label>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-left flex justify-between items-center hover:border-yellow-500/50 hover:bg-slate-900 transition-all focus:ring-1 focus:ring-yellow-500/50 outline-none"
      >
        <span className="truncate text-sm">{value}</span>
        <i className={`fas fa-chevron-down text-[10px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>
      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl custom-scrollbar animate-fade-in">
          {options.map((opt, i) => (
            <button 
              key={i} 
              type="button" 
              disabled={opt.startsWith('---')} 
              className={`w-full text-left px-4 py-3 text-sm transition-all ${opt.startsWith('---') ? 'bg-slate-950 text-slate-600 font-bold border-b border-slate-800 cursor-default' : 'hover:bg-yellow-500/10 hover:text-yellow-500 text-slate-400'}`} 
              onClick={() => { if (!opt.startsWith('---')) { onSelect(opt); setIsOpen(false); } }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 主應用 ---

export default function App() {
  const [step, setStep] = useState(1);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [formData, setFormData] = useState<ScriptRequest>({
    outline: '',
    refinedOutline: '',
    style: VISUAL_STYLES[1],
    directorStyle: DIRECTORS[1],
    duration: '60',
    sceneCount: '6',
    structureType: STRUCTURES[1],
    tone: TONES[0],
    targetAudience: AUDIENCES[3],
    sketchStyle: SKETCH_STYLES[0].prompt,
    features: ['高潮點強調', '旁白主導']
  });

  const showToast = (msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
  };

  const handleRefine = async () => {
    if (!formData.outline) return;
    setIsRefining(true);
    try {
      const refined = await refineOutline(formData.outline, formData.tone, formData.directorStyle);
      setFormData(prev => ({ ...prev, refinedOutline: refined }));
      showToast("大綱優化成功");
    } catch (e) {
      alert("優化大綱時發生錯誤，請稍後再試。");
    } finally {
      setIsRefining(false);
    }
  };

  const handleToggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature) 
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleGenerateScript = async () => {
    setIsLoading(true);
    try {
      const result = await generateScript(formData);
      setScenes(result);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      alert("生成腳本失敗，請確認 API 狀態。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async (idx: number) => {
    if (scenes[idx].isGeneratingImage) return;
    const nextScenes = [...scenes];
    nextScenes[idx].isGeneratingImage = true;
    setScenes(nextScenes);

    try {
      const url = await generateSceneSketch(
        scenes[idx].imagePrompt, 
        formData.sketchStyle, 
        scenes[idx].visualConsistencyTag
      );
      const updated = [...scenes];
      updated[idx].imageUrl = url;
      updated[idx].isGeneratingImage = false;
      setScenes(updated);
    } catch (e) {
      const updated = [...scenes];
      updated[idx].isGeneratingImage = false;
      setScenes(updated);
      alert("草圖生成失敗。");
    }
  };

  const onUpdateScene = (idx: number, field: keyof Scene, val: any) => {
    const next = [...scenes];
    (next[idx] as any)[field] = val;
    setScenes(next);
  };

  const exportPDF = () => {
    showToast("正在啟動 PDF 導出...");
    setTimeout(() => {
        window.print();
    }, 500);
  };

  const exportDocx = async () => {
    try {
      const dataUrlToBuffer = (dataUrl: string) => {
        const base64 = dataUrl.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ 
                shading: { fill: "f3f4f6" },
                children: [new Paragraph({ children: [new TextRun({ text: "鏡頭", bold: true, color: "111827" })], alignment: AlignmentType.CENTER })] 
            }),
            new TableCell({ 
                shading: { fill: "f3f4f6" },
                children: [new Paragraph({ children: [new TextRun({ text: "分鏡參考圖 (AI Sketch)", bold: true, color: "111827" })], alignment: AlignmentType.CENTER })] 
            }),
            new TableCell({ 
                shading: { fill: "f3f4f6" },
                children: [new Paragraph({ children: [new TextRun({ text: "內容詳情 (Script Details)", bold: true, color: "111827" })], alignment: AlignmentType.CENTER })] 
            }),
          ],
        }),
      ];

      for (const s of scenes) {
        const imageCellContent = s.imageUrl ? [
          new Paragraph({
            children: [
              new ImageRun({
                data: dataUrlToBuffer(s.imageUrl),
                transformation: { width: 300, height: 169 },
              } as any),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 }
          }),
        ] : [new Paragraph({ text: "[尚未繪製分鏡圖]", alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 } })];

        tableRows.push(new TableRow({
          children: [
            new TableCell({ 
                width: { size: 10, type: WidthType.PERCENTAGE }, 
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ text: `${s.sceneNumber}`, alignment: AlignmentType.CENTER })] 
            }),
            new TableCell({ 
                width: { size: 45, type: WidthType.PERCENTAGE }, 
                verticalAlign: VerticalAlign.CENTER,
                children: imageCellContent 
            }),
            new TableCell({ 
              width: { size: 45, type: WidthType.PERCENTAGE }, 
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({ children: [new TextRun({ text: "鏡位指令 (Director Instructions):", bold: true, size: 20, color: "3b82f6" })], spacing: { after: 100 } }),
                new Paragraph({ text: s.cameraDirection, spacing: { after: 200 } }),
                new Paragraph({ children: [new TextRun({ text: "旁白 (Voiceover):", bold: true, size: 20, color: "f97316" })], spacing: { after: 100 } }),
                new Paragraph({ children: [new TextRun({ text: s.voiceover || "(無台詞)", italics: true, color: "4b5563" })] }),
                new Paragraph({ children: [new TextRun({ text: `預計時長: ${s.estimatedDuration} 秒`, size: 16, color: "9ca3af" })], spacing: { before: 200 } }),
              ],
              margins: { top: 200, bottom: 200, left: 200, right: 200 }
            }),
          ],
        }));
      }

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ 
                children: [new TextRun({ text: "導演我最行 加強版 App (InspoDirector AI)", bold: true, size: 36 })], 
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            new Paragraph({ 
                children: [new TextRun({ text: "專業拍攝分鏡腳本 / Production Storyboard", bold: true, size: 24, color: "6b7280" })], 
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
            }),
            new Paragraph({ 
                children: [new TextRun({ text: "專案概況", bold: true, size: 28 })],
                spacing: { after: 200 }
            }),
            new Paragraph({ 
                children: [
                    new TextRun({ text: "導演風格: ", bold: true }),
                    new TextRun({ text: formData.directorStyle }),
                ],
                spacing: { after: 100 }
            }),
            new Paragraph({ 
                children: [
                    new TextRun({ text: "視覺色調: ", bold: true }),
                    new TextRun({ text: formData.style }),
                ],
                spacing: { after: 100 }
            }),
            new Paragraph({ 
                children: [
                    new TextRun({ text: "劇本大綱: ", bold: true }),
                    new TextRun({ text: formData.refinedOutline || formData.outline }),
                ],
                spacing: { after: 600 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `InspoDirector_Script_${Date.now()}.docx`);
      showToast("Word 導出成功");
    } catch (e) {
      console.error(e);
      alert("導出 Word 失敗，請確認是否所有分鏡圖已正確生成。");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 selection:bg-yellow-500/30">
      <Header 
        showExport={step === 2} 
        onExportWord={exportDocx} 
        onExportPDF={exportPDF}
      />
      <Toast message={toast.message} isVisible={toast.visible} />
      
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        {step === 1 ? (
          <div className="animate-fade-in space-y-10">
            {/* 輸入區域 */}
            <section className="bg-slate-900/40 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -z-10 group-hover:bg-yellow-500/10 transition-colors duration-700"></div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <label className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                      <i className="fas fa-magic text-yellow-500 text-xl"></i> 影片創意核心
                    </label>
                    <p className="text-slate-500 text-xs font-medium">輸入您的初步構想，讓 AI 為您擴展細節。</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleRefine}
                    disabled={isRefining || !formData.outline}
                    className="group relative px-5 py-2 bg-yellow-500/10 text-yellow-500 rounded-full text-[11px] font-black border border-yellow-500/20 hover:bg-yellow-500 hover:text-slate-950 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {isRefining ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : <i className="fas fa-wand-magic-sparkles mr-2 group-hover:rotate-12 transition-transform"></i>}
                    {formData.refinedOutline ? "再次優化 (動態刷新)" : "AI 創意優化"}
                  </button>
                </div>
                <textarea
                  required
                  placeholder="例如：一個關於未來台北的賽博龐克愛情故事，主角是一位修理老舊機器人的工程師..."
                  className="w-full h-36 bg-slate-950/60 border border-slate-800 rounded-3xl px-6 py-5 text-slate-200 text-base leading-relaxed outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500/30 shadow-inner transition-all placeholder:text-slate-700"
                  value={formData.outline}
                  onChange={(e) => setFormData({ ...formData, outline: e.target.value })}
                />
                
                {formData.refinedOutline && (
                  <div className="p-7 bg-slate-950/50 border border-yellow-500/10 rounded-3xl animate-fade-in relative group/ref">
                    <div className="absolute top-4 right-4 text-[9px] font-black text-yellow-500/40 uppercase tracking-widest">AI Refined Outline</div>
                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">{formData.refinedOutline}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <SuggestionDropdown label="導演視覺風格" value={formData.directorStyle} options={DIRECTORS} onSelect={(v) => setFormData({...formData, directorStyle: v})} />
                <SuggestionDropdown label="影像色調風格" value={formData.style} options={VISUAL_STYLES} onSelect={(v) => setFormData({...formData, style: v})} />
                <SuggestionDropdown label="影片結構模式" value={formData.structureType} options={STRUCTURES} onSelect={(v) => setFormData({...formData, structureType: v})} />
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> 鏡頭數量
                  </label>
                  <input type="number" min="1" max="30" className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:ring-1 focus:ring-yellow-500/50" value={formData.sceneCount} onChange={(e) => setFormData({ ...formData, sceneCount: e.target.value })} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> 預計總時長 (秒)
                  </label>
                  <input type="number" min="1" className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:ring-1 focus:ring-yellow-500/50" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                </div>
                
                <SuggestionDropdown label="故事調性" value={formData.tone} options={TONES} onSelect={(v) => setFormData({...formData, tone: v})} />
              </div>

              <div className="space-y-2">
                <SuggestionDropdown label="訴求對象" value={formData.targetAudience} options={AUDIENCES} onSelect={(v) => setFormData({...formData, targetAudience: v})} />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">專業製作選項 (複選)</label>
                <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto p-4 bg-slate-950/40 border border-slate-800 rounded-3xl custom-scrollbar">
                  {FEATURES.map(f => (
                    <button 
                      key={f} 
                      type="button" 
                      onClick={() => handleToggleFeature(f)} 
                      className={`px-4 py-2 rounded-full text-[10px] font-black border transition-all duration-300 ${formData.features.includes(f) ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-lg shadow-yellow-500/20' : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:border-slate-600'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerateScript} 
                disabled={isLoading || !formData.outline} 
                className="group w-full py-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-slate-950 font-black rounded-3xl flex items-center justify-center gap-4 text-xl shadow-2xl active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all hover:brightness-110"
              >
                {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-clapperboard group-hover:scale-110 transition-transform"></i>}
                {isLoading ? "大師深度模擬中..." : "開始製作專業分鏡腳本"}
              </button>
            </section>
          </div>
        ) : (
          <div className="animate-fade-in space-y-10">
            {/* 控制項 */}
            <div className="flex flex-col md:flex-row justify-between items-center no-print gap-6 bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl">
               <div className="space-y-1">
                 <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Production <span className="text-yellow-500">Preview</span></h2>
                 <p className="text-slate-500 text-xs font-medium">風格模擬: {formData.directorStyle.split('：')[0]}</p>
               </div>
               <div className="flex flex-wrap justify-center gap-3">
                 <button onClick={() => setStep(1)} className="px-6 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-[11px] font-black uppercase hover:bg-slate-800 transition-all flex items-center gap-2">
                   <i className="fas fa-rotate-left"></i> 重新規劃
                 </button>
               </div>
            </div>

            {/* 腳本列表 */}
            <div className="space-y-6">
              {scenes.map((s, i) => (
                <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:border-slate-700 group scene-card">
                  <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[320px]">
                    <div className="lg:col-span-5 relative bg-slate-950 flex items-center justify-center border-r border-slate-800 scene-image-container">
                      {s.imageUrl ? (
                        <img src={s.imageUrl} className="w-full h-full object-cover" alt={`Scene ${s.sceneNumber}`} />
                      ) : (
                        <div className="flex flex-col items-center gap-6 p-10">
                           <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-slate-700 group-hover:text-yellow-500/50 transition-colors">
                             <i className="fas fa-image text-3xl"></i>
                           </div>
                           <button 
                             onClick={() => handleGenerateImage(i)} 
                             disabled={s.isGeneratingImage} 
                             className="px-8 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-slate-950 hover:border-yellow-400 transition-all no-print"
                           >
                             {s.isGeneratingImage ? <><i className="fas fa-paint-brush animate-pulse mr-2"></i>繪製中...</> : "繪製分鏡草圖"}
                           </button>
                        </div>
                      )}
                      <div className="absolute top-6 left-6 flex items-center gap-3">
                        <div className="bg-yellow-500 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-950 shadow-xl border border-yellow-400 uppercase tracking-tighter">Shot {s.sceneNumber}</div>
                        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold text-slate-400 border border-slate-700 uppercase tracking-widest">{s.estimatedDuration}s</div>
                      </div>
                    </div>
                    <div className="lg:col-span-7 p-8 md:p-10 space-y-8 flex flex-col justify-between">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            <i className="fas fa-video text-blue-500"></i> 導演鏡位指令
                          </label>
                          <textarea 
                            className="w-full bg-slate-950/40 border border-slate-800/50 rounded-2xl p-4 text-slate-200 text-sm leading-relaxed outline-none focus:border-yellow-500/30 transition-all custom-scrollbar" 
                            rows={3} 
                            value={s.cameraDirection} 
                            onChange={(e) => onUpdateScene(i, 'cameraDirection', e.target.value)} 
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            <i className="fas fa-microphone text-orange-500"></i> 旁白配音 (VO)
                          </label>
                          <textarea 
                            className="w-full bg-slate-950/40 border border-slate-800/50 rounded-2xl p-4 text-slate-300 italic text-sm leading-relaxed outline-none focus:border-yellow-500/30 transition-all custom-scrollbar" 
                            rows={2} 
                            value={s.voiceover} 
                            onChange={(e) => onUpdateScene(i, 'voiceover', e.target.value)} 
                          />
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-800 no-print">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <i className="fas fa-robot text-purple-500"></i> Kling Video Prompt
                          </span>
                          <button onClick={() => { navigator.clipboard.writeText(s.klingPrompt); showToast("Prompt Copied"); }} className="text-[9px] font-black text-yellow-500/60 hover:text-yellow-500 transition-colors uppercase tracking-widest">
                            <i className="fas fa-copy mr-1"></i> Copy
                          </button>
                        </div>
                        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-[10px] text-slate-500 font-mono leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                          {s.klingPrompt}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="py-20 text-center no-print space-y-4">
               <h4 className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">導演我最行 加強版 App (InspoDirector AI) End of Script</h4>
               <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-8 py-3 rounded-full border border-slate-800 text-[10px] font-bold text-slate-500 hover:text-yellow-500 hover:border-yellow-500/30 transition-all uppercase tracking-widest">
                 <i className="fas fa-arrow-up mr-2"></i> Back to Top
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
