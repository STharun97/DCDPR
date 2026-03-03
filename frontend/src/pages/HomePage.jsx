import { useState } from "react";
import { Search, AlertTriangle, CheckCircle, Loader2, Sparkles, Info, Brain, ChevronDown, ChevronUp, Bot, HeartCrack, Star, ShieldCheck, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Renders the original review text with SHAP-flagged words highlighted.
 * fakeWords and genuineWords are arrays of {word, score}.
 */
const HighlightedText = ({ text, fakeWords = [], genuineWords = [] }) => {
  if (!text) return null;
  const fakeSet = new Set(fakeWords.map(w => w.word.toLowerCase()));
  const genuineSet = new Set(genuineWords.map(w => w.word.toLowerCase()));

  const tokens = text.split(/(\s+)/);
  return (
    <span className="leading-7 text-base">
      {tokens.map((token, i) => {
        const clean = token.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (fakeSet.has(clean)) {
          return (
            <span
              key={i}
              className="relative inline-block"
              title={`Contributes to FAKE: ${fakeWords.find(w => w.word === clean)?.score}`}
            >
              <span className="bg-red-200 text-red-900 font-semibold px-0.5 rounded cursor-help">
                {token}
              </span>
            </span>
          );
        }
        if (genuineSet.has(clean)) {
          return (
            <span
              key={i}
              className="relative inline-block"
              title={`Contributes to GENUINE: ${genuineWords.find(w => w.word === clean)?.score}`}
            >
              <span className="bg-green-100 text-green-900 font-semibold px-0.5 rounded cursor-help">
                {token}
              </span>
            </span>
          );
        }
        return <span key={i}>{token}</span>;
      })}
    </span>
  );
};

const XAIPanel = ({ explanation, originalText }) => {
  const [expanded, setExpanded] = useState(true);
  if (!explanation || explanation.error) return null;

  const { top_fake_tokens = [], top_genuine_tokens = [] } = explanation;
  if (top_fake_tokens.length === 0 && top_genuine_tokens.length === 0) return null;

  return (
    <div className="mt-6 border border-gray-200 rounded-none" data-testid="xai-panel">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 px-5 py-4 bg-gradient-to-r from-gray-50 to-white hover:from-brand-blue/5 hover:to-white transition-all group"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
            <Brain className="w-4 h-4 text-brand-blue" strokeWidth={2} />
          </div>
          <h3 className="font-heading text-sm uppercase tracking-widest font-bold text-gray-800 text-center sm:text-left mt-1 sm:mt-0">
            Why was this flagged? <span className="text-brand-blue/60 font-medium block sm:inline mt-1 sm:mt-0">(XAI Explanation)</span>
          </h3>
        </div>
        <div className="flex-shrink-0">
          {expanded
            ? <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-brand-blue transition-colors" />
            : <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-brand-blue transition-colors" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-5">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-red-200" />
              Words pushing toward FAKE
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-green-100" />
              Words pushing toward GENUINE
            </span>
          </div>

          {/* Highlighted Review Text */}
          <div className="p-3 bg-white border border-gray-100 text-sm text-gray-800">
            <HighlightedText
              text={originalText}
              fakeWords={top_fake_tokens}
              genuineWords={top_genuine_tokens}
            />
          </div>

          {/* Top Token Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fake tokens */}
            {top_fake_tokens.length > 0 && (
              <div className="bg-red-50/30 p-4 rounded-2xl border border-red-100">
                <p className="text-xs font-heading uppercase tracking-widest font-bold text-brand-fake mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-fake" />
                  Top Fake Indicators
                </p>
                <div className="space-y-1">
                  {top_fake_tokens.slice(0, 6).map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-red-50 text-red-800 px-2 py-0.5 rounded flex-1 truncate">
                        {t.word}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded"
                          style={{ width: `${Math.min(100, t.score * 1000)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Genuine tokens */}
            {top_genuine_tokens.length > 0 && (
              <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">
                <p className="text-xs font-heading uppercase tracking-widest font-bold text-brand-genuine mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-genuine" />
                  Top Genuine Indicators
                </p>
                <div className="space-y-1">
                  {top_genuine_tokens.slice(0, 6).map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-green-50 text-green-800 px-2 py-0.5 rounded flex-1 truncate">
                        {t.word}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-green-400 rounded"
                          style={{ width: `${Math.min(100, t.score * 1000)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400">
            Explanation powered by SHAP (SHapley Additive exPlanations) — values indicate each word&apos;s contribution to the prediction.
          </p>
        </div>
      )}
    </div>
  );
};

const AIDetectionPanel = ({ detection }) => {
  const [expanded, setExpanded] = useState(true);
  if (!detection) return null;

  const { ai_probability = 0, is_ai_generated, signals = [], summary } = detection;

  const barColor =
    ai_probability >= 60 ? 'bg-red-500' :
      ai_probability >= 40 ? 'bg-yellow-500' :
        'bg-green-500';

  const labelColor =
    ai_probability >= 60 ? 'text-red-700' :
      ai_probability >= 40 ? 'text-yellow-700' :
        'text-green-700';

  return (
    <div className="mt-4 border border-gray-200 rounded-none" data-testid="ai-detection-panel">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-gray-50 to-white hover:from-purple-500/5 hover:to-white transition-all group"
      >
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
            <Bot className="w-4 h-4 text-purple-600" strokeWidth={2} />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 mt-1 sm:mt-0 text-center sm:text-left">
            <h3 className="font-heading text-sm uppercase tracking-widest font-bold text-gray-800">
              AI-Generated Detection
            </h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${is_ai_generated ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
              {summary || (is_ai_generated ? 'AI Detected' : 'Human')}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {expanded
            ? <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
            : <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Probability Gauge */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Human</span>
              <span className={`text-sm font-bold ${labelColor}`}>{ai_probability}%</span>
              <span className="text-xs text-gray-500">AI</span>
            </div>
            <div className="h-3 bg-gray-100 rounded overflow-hidden">
              <div className={`h-full ${barColor} rounded transition-all duration-500`} style={{ width: `${ai_probability}%` }} />
            </div>
          </div>

          {/* Signals */}
          {signals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-heading uppercase tracking-wider text-gray-500">Detected Signals</p>
              {signals.map((sig, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${sig.weight === 'high' ? 'bg-red-400' :
                    sig.weight === 'medium' ? 'bg-yellow-400' :
                      'bg-gray-300'
                    }`} />
                  <span className="text-gray-700">{sig.description}</span>
                </div>
              ))}
            </div>
          )}

          {signals.length === 0 && (
            <p className="text-sm text-gray-500">No AI-generation signals detected.</p>
          )}
          <p className="text-[10px] text-gray-400">
            Uses linguistic analysis: contraction usage, sentence burstiness, vocabulary diversity, and AI-typical phrasing patterns.
          </p>
        </div>
      )}
    </div>
  );
};

const SentimentPanel = ({ analysis }) => {
  const [expanded, setExpanded] = useState(true);
  if (!analysis || analysis.sentiment_label === 'unknown') return null;

  const {
    sentiment_score = 0,
    sentiment_label,
    sentiment_details,
    expected_rating_range,
    rating_mismatch,
    mismatch_severity,
    mismatch_detail
  } = analysis;

  // Map -1..1 to 0..100 for the bar
  const barPercent = ((sentiment_score + 1) / 2) * 100;
  const barColor =
    sentiment_score >= 0.3 ? 'bg-green-500' :
      sentiment_score >= -0.3 ? 'bg-yellow-500' :
        'bg-red-500';

  return (
    <div className={`mt-4 border rounded-none ${rating_mismatch && mismatch_severity === 'strong' ? 'border-red-300 bg-red-50/30' :
      rating_mismatch ? 'border-yellow-300 bg-yellow-50/30' :
        'border-gray-200'
      }`} data-testid="sentiment-panel">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 px-5 py-4 bg-gradient-to-r from-gray-50 to-white hover:from-rose-500/5 hover:to-white transition-all group"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
            <HeartCrack className="w-4 h-4 text-rose-500" strokeWidth={2} />
          </div>
          <h3 className="font-heading text-sm uppercase tracking-widest font-bold text-gray-800 text-center sm:text-left mt-1 sm:mt-0">
            Sentiment-Rating Analysis
          </h3>
          {rating_mismatch && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm sm:ml-2 mt-2 sm:mt-0 ${mismatch_severity === 'strong' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
              ⚠ {mismatch_severity === 'strong' ? 'MISMATCH' : 'Mild Mismatch'}
            </span>
          )}
        </div>
        <div className="flex-shrink-0">
          {expanded
            ? <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
            : <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-rose-500 transition-colors" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Sentiment Bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Negative</span>
              <span className="text-sm font-bold text-gray-700">
                {sentiment_label.charAt(0).toUpperCase() + sentiment_label.slice(1)} ({sentiment_score >= 0 ? '+' : ''}{sentiment_score.toFixed(2)})
              </span>
              <span className="text-xs text-gray-500">Positive</span>
            </div>
            <div className="h-3 bg-gray-100 rounded overflow-hidden relative">
              <div className="absolute left-1/2 top-0 w-px h-full bg-gray-300 z-10" />
              <div className={`h-full ${barColor} rounded transition-all duration-500`} style={{ width: `${barPercent}%` }} />
            </div>
          </div>

          {/* Sentiment Breakdown */}
          {sentiment_details && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 p-2 rounded">
                <p className="text-xs text-gray-500">Positive</p>
                <p className="text-sm font-bold text-green-700">{(sentiment_details.positive * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Neutral</p>
                <p className="text-sm font-bold text-gray-600">{(sentiment_details.neutral * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <p className="text-xs text-gray-500">Negative</p>
                <p className="text-sm font-bold text-red-700">{(sentiment_details.negative * 100).toFixed(0)}%</p>
              </div>
            </div>
          )}

          {/* Expected Rating + Mismatch */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-gray-600">Expected rating based on text: <strong>{expected_rating_range}</strong></span>
            </div>
            {rating_mismatch && (
              <div className={`p-3 rounded text-sm ${mismatch_severity === 'strong' ? 'bg-red-100 text-red-800 border border-red-200' :
                'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                {mismatch_detail}
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-400">
            Sentiment powered by NLTK VADER — compares text emotion with the provided star rating.
          </p>
        </div>
      )}
    </div>
  );
};

const TrustScoreGauge = ({ trustData }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  if (!trustData) return null;

  const { trust_score = 50, grade = 'C', breakdown = [] } = trustData;

  // SVG arc gauge
  const radius = 54;
  const stroke = 8;
  const circumference = Math.PI * radius; // half circle
  const progress = (trust_score / 100) * circumference;

  const gradeColor =
    trust_score >= 80 ? '#16a34a' :
      trust_score >= 60 ? '#ca8a04' :
        trust_score >= 45 ? '#ea580c' : '#dc2626';

  const bgGrade =
    trust_score >= 80 ? 'from-green-50 to-emerald-50 border-green-200' :
      trust_score >= 60 ? 'from-yellow-50 to-amber-50 border-yellow-200' :
        trust_score >= 45 ? 'from-orange-50 to-red-50 border-orange-200' :
          'from-red-50 to-rose-50 border-red-200';

  return (
    <div className={`mb-8 border rounded-3xl bg-gradient-to-br ${bgGrade} p-6 shadow-sm`} data-testid="trust-score-gauge">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-4 h-4" style={{ color: gradeColor }} strokeWidth={2} />
        </div>
        <h3 className="font-heading text-sm uppercase tracking-widest font-bold text-gray-800">
          Trust Score
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        {/* Gauge */}
        <div className="relative flex-shrink-0" style={{ width: 120, height: 70 }}>
          <svg width="120" height="70" viewBox="0 0 120 70">
            {/* Background arc */}
            <path
              d="M 6 66 A 54 54 0 0 1 114 66"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d="M 6 66 A 54 54 0 0 1 114 66"
              fill="none"
              stroke={gradeColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
              style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
            />
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="font-heading text-2xl font-black" style={{ color: gradeColor }}>
              {trust_score}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-gray-500">/ 100</span>
          </div>
        </div>

        {/* Grade + label */}
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
            <span className="font-heading text-4xl sm:text-3xl font-black" style={{ color: gradeColor }}>
              {grade}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {trust_score >= 80 ? 'Highly Trustworthy' :
                trust_score >= 60 ? 'Mostly Trustworthy' :
                  trust_score >= 45 ? 'Mixed Trust' : 'Low Trust'}
            </span>
          </div>
          <button
            onClick={() => setShowBreakdown(b => !b)}
            className="text-xs text-gray-500 hover:text-gray-700 mt-2 sm:mt-1 flex items-center justify-center sm:justify-start gap-1 w-full sm:w-auto"
          >
            {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Score breakdown
          </button>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && breakdown.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-gray-200/60 pt-3">
          {breakdown.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{item.signal}</span>
              <span className={`font-mono text-xs font-bold ${item.impact === 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                {item.impact === 0 ? '✓ OK' : `${item.impact}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HomePage = () => {
  const [reviewText, setReviewText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const downloadReport = async () => {
    try {
      const response = await axios.post(`${API_URL}/report/single`, result, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Analysis_Report_${result.id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("Report download failed:", error);
      toast.error("Failed to generate PDF report.");
    }
  };

  const handleAnalyze = async () => {
    if (!reviewText.trim() || reviewText.trim().length < 5) {
      toast.error("Please enter a review with at least 5 characters");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/analyze`, {
        text: reviewText,
      });
      setResult(response.data);
      toast.success(`Analysis complete: ${response.data.prediction}`);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error.response?.data?.detail || "Failed to analyze review");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sampleReviews = [
    {
      label: "Likely Genuine",
      text: "I bought this phone case last month and it's been holding up well. The fit is snug and the buttons are easy to press. Only minor complaint is the color is slightly different from the photos.",
    },
    {
      label: "Likely Fake",
      text: "AMAZING!!! BEST PRODUCT EVER!!! Everyone MUST buy this!!! Changed my life completely!!! 5 STARS is not enough!!! BUY NOW!!!",
    },
  ];

  return (
    <div className="noise-texture min-h-[calc(100vh-64px)] overflow-x-hidden">
      <div className="relative z-10 w-full">
        {/* Dynamic Abstract Background Art */}
        <div className="absolute top-20 right-0 w-[200px] sm:w-[500px] h-[200px] sm:h-[500px] bg-gradient-to-tr from-brand-blue/20 to-purple-500/20 rounded-full blur-[60px] sm:blur-[100px] -z-10 mix-blend-multiply opacity-70 animate-pulse" />
        <div className="absolute top-40 left-0 w-[150px] sm:w-[400px] h-[150px] sm:h-[400px] bg-gradient-to-bl from-emerald-400/20 to-brand-blue/20 rounded-full blur-[80px] sm:blur-[120px] -z-10 mix-blend-multiply opacity-60" />

        {/* Hero Section */}
        <section className="py-8 sm:py-16 md:py-24 px-3 sm:px-4 relative" data-testid="hero-section">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 sm:mb-6 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 rounded-full px-2 sm:px-4 py-1 sm:py-1.5 border border-brand-blue/20 font-bold tracking-widest text-[8px] sm:text-[10px] animate-fade-in shadow-sm backdrop-blur-md">
              POWERED BY ADVANCED ML
            </Badge>
            <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tight text-gray-900 mb-4 sm:mb-6 animate-fade-in delay-100 leading-[1.2] sm:leading-[1.1]">
              Detect <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-purple-600">Fake</span> Reviews
            </h1>
            <p className="font-body text-base md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10 animate-fade-in delay-200 leading-relaxed">
              Our ML-powered system analyzes product reviews using NLP and multiple
              classification models to identify authenticity with high accuracy.
            </p>
          </div>
        </section>

        {/* Main Analysis Section */}
        <section className="pb-20 px-2 sm:px-4" data-testid="analysis-section">
          <div className="max-w-4xl mx-auto">
            {/* Input Card */}
            <div className="card-swiss p-3 sm:p-8 md:p-10 mb-6 sm:mb-8 animate-slide-up hover-lift shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border-white/60">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-gray-100 w-full">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center shadow-lg shadow-brand-blue/20 flex-shrink-0">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
                </div>
                <h2 className="font-heading text-sm sm:text-base uppercase tracking-widest font-black text-gray-800 text-center sm:text-left mt-1 sm:mt-0">
                  Review Analysis
                </h2>
              </div>

              <Textarea
                data-testid="review-input"
                placeholder="Paste a product review here..."
                className="input-swiss min-h-[140px] sm:min-h-[180px] text-base sm:text-lg resize-none w-full mb-6 sm:mb-8 font-body leading-relaxed"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="text-[10px] sm:text-xs font-semibold text-gray-400 flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 w-full sm:w-auto justify-center">
                  <Info className="w-3.5 h-3.5 text-brand-blue" />
                  {reviewText.length} chars <span className="text-gray-300">|</span> Min 5 req
                </div>
                <Button
                  data-testid="analyze-button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || reviewText.length < 5}
                  className="w-full sm:w-auto bg-gradient-to-r from-brand-blue to-blue-700 text-white font-heading font-black text-xs sm:text-sm tracking-widest py-5 sm:py-6 px-8 sm:px-10 rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      ANALYZING...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" strokeWidth={2} />
                      CHECK REVIEW
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Result Card */}
            {result && (
              <div
                className="card-swiss p-3 sm:p-8 md:p-10 mb-12 animate-slide-up shadow-[0_20px_80px_-15px_rgba(0,0,0,0.1)] border-white/80 ring-1 ring-black/5"
                data-testid="result-card"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 pb-6 border-b border-gray-100 text-center sm:text-left">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 mx-auto sm:mx-0
                    ${result.is_fake ? 'bg-gradient-to-br from-brand-fake to-red-700 shadow-brand-fake/20' : 'bg-gradient-to-br from-brand-genuine to-emerald-600 shadow-brand-genuine/20'}
                  `}>
                    {result.is_fake ? (
                      <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2} />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-white" strokeWidth={2} />
                    )}
                  </div>
                  <h2 className="font-heading text-base uppercase tracking-widest font-black text-gray-800 mt-2 sm:mt-0">
                    Analysis Result
                  </h2>
                </div>

                {/* PDF Report Download Button - Quick Action */}
                <div className="mb-8">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-3 border-brand-blue/20 text-brand-blue hover:bg-brand-blue hover:text-white font-heading font-bold text-xs tracking-widest py-6 rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-brand-blue/20"
                    onClick={downloadReport}
                  >
                    <FileText className="w-5 h-5" strokeWidth={2} />
                    DOWNLOAD PDF REPORT
                  </Button>
                </div>

                {/* Main Result */}
                <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4 sm:gap-8 mb-6 sm:mb-10 p-3 sm:p-8 rounded-xl sm:rounded-3xl bg-gray-50 border border-gray-100 text-center md:text-left">
                  <div className="w-full md:w-auto">
                    <Badge
                      data-testid="prediction-badge"
                      className={`
                        text-sm sm:text-xl px-4 sm:px-8 py-2.5 sm:py-3 font-heading tracking-widest font-black uppercase shadow-lg
                        ${result.is_fake ? "badge-fake ring-4 ring-rose-500/20" : "badge-genuine ring-4 ring-emerald-500/20"}
                      `}
                    >
                      {result.prediction}
                    </Badge>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-3 sm:mt-4">
                      Model: <span className="text-gray-600">{result.model_used?.replace('_', ' ').toUpperCase()}</span>
                    </p>
                  </div>

                  {/* Confidence Meter */}
                  <div className="w-full md:w-72 mt-2 md:mt-0" data-testid="confidence-meter">
                    <div className="flex justify-between items-end mb-1 sm:mb-3">
                      <span className="text-[9px] sm:text-[10px] sm:text-xs font-heading uppercase tracking-widest font-bold text-gray-500">
                        Confidence
                      </span>
                      <span className="font-heading text-xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500">
                        {result.confidence}%
                      </span>
                    </div>
                    <div className="h-3 sm:h-4 bg-gray-200/50 w-full rounded-full overflow-hidden shadow-inner p-0.5">
                      <div
                        className={`h-full animate-fill-meter rounded-full shadow-sm ${result.is_fake ? "bg-gradient-to-r from-rose-400 to-brand-fake" : "bg-gradient-to-r from-emerald-400 to-brand-genuine"
                          }`}
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Probability Bars */}
                <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-10 px-4">
                  <div data-testid="genuine-probability">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-heading uppercase tracking-widest font-bold text-gray-400">
                        Genuine Score
                      </span>
                      <span className="text-base font-black text-emerald-600">
                        {result.genuine_probability}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-brand-genuine rounded-full"
                        style={{ width: `${result.genuine_probability}%` }}
                      />
                    </div>
                  </div>
                  <div data-testid="fake-probability">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-heading uppercase tracking-widest font-bold text-gray-400">
                        Fake Score
                      </span>
                      <span className="text-base font-black text-rose-600">
                        {result.fake_probability}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-400 to-brand-fake rounded-full"
                        style={{ width: `${result.fake_probability}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Trust Score Gauge */}
                <TrustScoreGauge trustData={result.trust_score} />

                {/* Indicators */}
                {result.indicators && result.indicators.length > 0 && (
                  <div data-testid="indicators-section" className="mb-8">
                    <h3 className="font-heading text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-4 px-2">
                      Detection Indicators
                    </h3>
                    <div className="space-y-3">
                      {result.indicators.map((indicator, index) => (
                        <div
                          key={index}
                          className={`
                            flex items-center gap-4 p-4 rounded-2xl border
                            ${indicator.severity === 'high'
                              ? 'border-brand-fake/20 bg-rose-50/50 shadow-sm shadow-rose-100'
                              : indicator.severity === 'medium'
                                ? 'border-amber-500/20 bg-amber-50/50 shadow-sm shadow-amber-100'
                                : 'border-gray-200 bg-gray-50 shadow-sm'
                            }
                          `}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                              ${indicator.severity === 'high' ? 'bg-rose-100' :
                              indicator.severity === 'medium' ? 'bg-amber-100' : 'bg-gray-200'}
                            `}>
                            <AlertTriangle
                              className={`w-4 h-4 
                                ${indicator.severity === 'high'
                                  ? 'text-brand-fake'
                                  : indicator.severity === 'medium'
                                    ? 'text-amber-600'
                                    : 'text-gray-500'
                                }
                              `}
                              strokeWidth={2}
                            />
                          </div>
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-800">
                              {indicator.description}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border-2 
                                ${indicator.severity === 'high' ? 'border-rose-200 text-rose-700 bg-white' :
                                  indicator.severity === 'medium' ? 'border-amber-200 text-amber-700 bg-white' : 'border-gray-200 text-gray-600 bg-white'}
                              `}
                            >
                              {indicator.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.indicators && result.indicators.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm" data-testid="no-indicators">
                    No suspicious indicators detected
                  </div>
                )}

                {/* XAI Explanation Panel */}
                <XAIPanel
                  explanation={result.shap_explanation}
                  originalText={result.original_text}
                />

                {/* AI-Generated Review Detection Panel */}
                <AIDetectionPanel detection={result.ai_detection} />

                {/* Sentiment-Rating Analysis Panel */}
                <SentimentPanel analysis={result.sentiment_analysis} />
              </div>
            )}

            {/* Sample Reviews */}
            <div className="mt-16" data-testid="sample-reviews">
              <h3 className="font-heading text-xs uppercase tracking-widest font-bold text-gray-400 mb-6 text-center">
                Try Sample Reviews
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {sampleReviews.map((sample, index) => (
                  <button
                    key={index}
                    data-testid={`sample-review-${index}`}
                    onClick={() => setReviewText(sample.text)}
                    className="card-swiss p-6 text-left hover:border-brand-blue/30 hover:shadow-brand-blue/5 hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <Badge
                      className={`mb-4 text-[9px] font-bold uppercase tracking-widest rounded-full px-3 py-1 border 
                        ${sample.label.includes('Genuine') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}
                      `}
                    >
                      {sample.label}
                    </Badge>
                    <p className="text-sm text-gray-500 font-body leading-relaxed line-clamp-3 group-hover:text-gray-800 transition-colors">
                      "{sample.text}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
