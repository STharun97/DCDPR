import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AlertCircle, CheckCircle, Search, ShoppingBag, Star, TrendingUp, AlertTriangle, LogIn, Loader2, ShieldCheck, ChevronDown, ChevronUp, FileText, Brain, HeartCrack } from 'lucide-react';
import { toast } from "sonner";


const ProductTrustCard = ({ trustData, onExport }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [expandedSentiment, setExpandedSentiment] = useState(false);
    if (!trustData) return null;

    const { trust_score, grade, breakdown, summary } = trustData;
    const rating_mismatch = trustData.rating_mismatch || false;
    const mismatch_severity = trustData.mismatch_severity || 'mild';

    const getGradeColor = (score) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        if (score >= 45) return "text-orange-600";
        return "text-red-600";
    };

    const getGradeBg = (score) => {
        if (score >= 80) return "bg-green-50 border-green-200";
        if (score >= 60) return "bg-yellow-50 border-yellow-200";
        if (score >= 45) return "bg-orange-50 border-orange-200";
        return "bg-red-50 border-red-200";
    };

    // SVG arc gauge logic
    const radius = 60;
    const stroke = 10;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (trust_score / 100) * circumference;

    return (
        <Card className={`overflow-hidden border-2 ${getGradeBg(trust_score)}`}>
            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Visual Gauge */}
                    <div className="relative flex flex-col items-center flex-shrink-0">
                        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                            <circle
                                stroke="#e5e7eb"
                                fill="transparent"
                                strokeWidth={stroke}
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                            />
                            <circle
                                stroke="currentColor"
                                fill="transparent"
                                strokeWidth={stroke}
                                strokeDasharray={circumference + ' ' + circumference}
                                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-out' }}
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                                className={getGradeColor(trust_score)}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-black ${getGradeColor(trust_score)}`}>{grade}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Grade</span>
                        </div>
                        <div className="mt-2 text-center">
                            <span className={`text-2xl font-black ${getGradeColor(trust_score)}`}>{trust_score}</span>
                            <span className="text-xs text-gray-500 font-bold">/100</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck className={`h-5 w-5 ${getGradeColor(trust_score)}`} />
                                <h2 className="text-xl font-bold tracking-tight text-gray-900">Product Authenticity Score</h2>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                                {summary}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] uppercase font-bold tracking-widest h-10 px-4 bg-white border-gray-200 hover:border-brand-blue/30"
                                onClick={() => setShowBreakdown(!showBreakdown)}
                            >
                                {showBreakdown ? (
                                    <><ChevronUp className="h-3.5 w-3.5 mr-2" /> Hide Details</>
                                ) : (
                                    <><ChevronDown className="h-3.5 w-3.5 mr-2" /> View Details</>
                                )}
                            </Button>

                            <Button
                                variant="default"
                                size="sm"
                                className="text-[10px] uppercase font-bold tracking-widest h-10 px-6 bg-gradient-to-r from-brand-blue to-blue-700 text-white shadow-xl shadow-brand-blue/20 hover:scale-[1.02] transition-all rounded-xl"
                                onClick={onExport}
                            >
                                <FileText className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Export Audit Report</span><span className="sm:hidden">Export PDF</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Breakdown Section */}
                {showBreakdown && (
                    <div className="mt-6 pt-6 border-t border-gray-200/60 animate-in slide-in-from-top-2 duration-300">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Calculation Signals</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                            {breakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-700">{item.signal}</span>
                                        <span className="text-[10px] text-gray-500">{item.detail}</span>
                                    </div>
                                    <span className={`font-mono font-bold ${item.impact === 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {item.impact === 0 ? "✓ OK" : item.impact}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-[10px] text-gray-400 italic">
                            The trust score is computed by weighing the percentage of fake reviews, AI detection signatures, and sentiment consistency across all analyzed text.
                        </p>
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200/60">
                    <button
                        onClick={() => setExpandedSentiment(e => !e)}
                        className="w-full flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 px-5 py-4 bg-gradient-to-r from-gray-50 to-white hover:from-rose-500/5 hover:to-white transition-all group lg:rounded-xl"
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
                            {expandedSentiment
                                ? <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
                                : <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-rose-500 transition-colors" />}
                        </div>
                    </button>
                    {expandedSentiment && (() => {
                        // Aggregate sentiment from breakdown data
                        const breakdownSentiment = breakdown?.filter(b => b.signal?.toLowerCase().includes('sentiment')) || [];

                        // Calculate counts from breakdown data if available
                        const posCount = breakdown?.find(b => b.signal?.toLowerCase().includes('positive'))?.impact || 0;
                        const negCount = breakdown?.find(b => b.signal?.toLowerCase().includes('negative'))?.impact || 0;
                        const mismatchCount = breakdown?.find(b => b.signal?.toLowerCase().includes('mismatch'))?.impact || 0;

                        return (
                            <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300 space-y-5">
                                {/* Sentiment Overview */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={`rounded-2xl p-5 border ${rating_mismatch
                                        ? 'bg-rose-50/80 border-rose-100'
                                        : 'bg-emerald-50/80 border-emerald-100'
                                        }`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${rating_mismatch ? 'text-rose-400' : 'text-emerald-400'
                                            }`}>Sentiment vs Star Rating</p>
                                        <p className={`text-xl font-black mt-2 ${rating_mismatch ? 'text-rose-600' : 'text-emerald-600'
                                            }`}>
                                            {rating_mismatch
                                                ? mismatch_severity === 'strong' ? '⚠ Strong Mismatch' : '⚠ Mild Mismatch'
                                                : '✓ Consistent'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                            {rating_mismatch
                                                ? 'Review sentiment does not align with the star rating given — a common pattern in fake reviews.'
                                                : 'Review text sentiment aligns with the star rating — indicates authentic reviews.'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Trust Score Contribution</p>
                                        <p className="text-4xl font-black text-gray-800 mt-2">{trust_score}<span className="text-lg text-gray-400">/100</span></p>
                                        <p className="text-xs text-gray-500 mt-2">Overall product trust based on all sentiment, AI, and ML signals.</p>
                                    </div>
                                </div>

                                {/* Breakdown signals */}
                                {breakdown && breakdown.length > 0 && (
                                    <div>
                                        <h4 className="font-heading font-bold text-xs uppercase tracking-widest text-gray-500 mb-3">Signal Breakdown</h4>
                                        <div className="space-y-2">
                                            {breakdown.map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.impact === 0 ? 'bg-emerald-400' : 'bg-rose-400'
                                                        }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-heading font-bold text-xs text-gray-700">{item.signal}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                                                    </div>
                                                    <span className={`font-mono text-sm font-black flex-shrink-0 ${item.impact === 0 ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}>
                                                        {item.impact === 0 ? '✓ OK' : item.impact}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Download Full Report Button */}
                <div className="mb-10 mt-6 pt-6 border-t border-gray-200/60">
                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-3 border-brand-blue/20 text-brand-blue hover:bg-brand-blue hover:text-white font-heading font-bold text-xs tracking-widest py-6 rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-brand-blue/20"
                        onClick={onExport} // Use onExport prop
                    >
                        <FileText className="w-5 h-5" strokeWidth={2} />
                        DOWNLOAD COMPREHENSIVE PDF REPORT
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


const UrlAnalysisPage = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [expandedXAI, setExpandedXAI] = useState(false); // New state for XAI explanation

    const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8002';

    const exportReport = async () => {
        try {
            toast.info("Generating PDF report...");
            const response = await fetch(`${BACKEND}/api/report/url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server error ${response.status}: ${errText}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const safeTitle = (result.product_title || 'Report').slice(0, 15).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            link.setAttribute('download', `Audit_Report_${safeTitle}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Audit report exported successfully!");
        } catch (error) {
            console.error("Report export failed:", error);
            toast.error("Failed to generate audit report. " + error.message);
        }
    };

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setIsAnalyzing(true);
        try {
            const response = await fetch(`${BACKEND}/api/analyze/url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            setResult(data);
            toast.success("Analysis complete!");
        } catch (error) {
            console.error('Error:', error);
            toast.error("Failed to analyze URL. Please try again.");
        } finally {
            setLoading(false);
            setIsAnalyzing(false);
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 80) return "text-green-600";
        if (confidence >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
            <div className="flex flex-col gap-1 sm:gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Product URL Analysis</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    Analyze product reviews directly from Amazon or Flipkart links to find the true rating.
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Paste Amazon product URL..."
                                className="pl-12 py-7 rounded-2xl border-gray-200 focus:ring-brand-blue/20 focus:border-brand-blue text-base"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading || !url}
                            className="bg-brand-blue hover:bg-blue-700 px-10 py-7 rounded-2xl font-heading font-black text-[11px] tracking-widest uppercase shadow-xl shadow-brand-blue/20 hover:scale-[1.02] transition-all w-full md:w-auto"
                        >
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...</>
                            ) : (
                                "Analyze Product"
                            )}
                        </Button>
                    </form>
                    <div className="mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Analysis uses ScraperAPI to fetch real reviews. May take 1–2 minutes for products with many reviews.
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Loading State Skeleton */}
            {isAnalyzing && (
                <div className="card-swiss p-8 sm:p-12 text-center animate-pulse shadow-sm">
                    <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-brand-blue/30 mx-auto mb-4 sm:mb-6 animate-spin" />
                    <h3 className="font-heading text-sm sm:text-base uppercase tracking-widest font-black text-gray-800 mb-2 sm:mb-3">
                        Scraping & Analyzing
                    </h3>
                    <p className="text-[11px] sm:text-sm text-gray-500 font-body max-w-md mx-auto leading-relaxed">
                        This process usually takes 20-30 seconds depending on the number of reviews and pagination structure.
                    </p>
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Product Trust Score */}
                    {result.trust_score && (
                        <ProductTrustCard trustData={result.trust_score} onExport={exportReport} />
                    )}

                    {/* Summary Cards */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                                <CardTitle className="text-xs sm:text-sm font-medium text-blue-900">
                                    {result.rating_summary?.overall_rating ? "Product Rating" : "Original Rating"}
                                </CardTitle>
                                <Star className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                <div className="text-xl sm:text-2xl font-bold text-blue-700">
                                    {result.rating_summary?.overall_rating || result.original_rating} / 5.0
                                </div>
                                <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
                                    {result.rating_summary?.total_ratings
                                        ? `Based on ${result.rating_summary.total_ratings.toLocaleString()} total ratings`
                                        : `Based on ${result.total_reviews} analyzed reviews`}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className={`bg-gradient-to-br border-opacity-50 ${result.real_adjusted_rating < result.original_rating ? 'from-orange-50 to-red-50 border-red-100' : 'from-green-50 to-emerald-50 border-green-100'}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                                <CardTitle className="text-xs sm:text-sm font-medium text-gray-900">Real Adjusted Rating</CardTitle>
                                <TrendingUp className={`h-4 w-4 ${result.real_adjusted_rating < result.original_rating ? 'text-red-600' : 'text-green-600'}`} />
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                <div className={`text-xl sm:text-2xl font-bold ${result.real_adjusted_rating < result.original_rating ? 'text-red-700' : 'text-green-700'}`}>
                                    {result.real_adjusted_rating} / 5.0
                                </div>
                                <p className={`text-[10px] sm:text-xs mt-1 ${result.real_adjusted_rating < result.original_rating ? 'text-red-600' : 'text-green-600'}`}>
                                    {result.real_adjusted_rating < result.original_rating
                                        ? `Dropped by ${(result.original_rating - result.real_adjusted_rating).toFixed(1)}`
                                        : "Verified Authentic"}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                                <CardTitle className="text-xs sm:text-sm font-medium">Fake Reviews</CardTitle>
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                <div className="text-xl sm:text-2xl font-bold text-red-600">{result.fake_count}</div>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                    {result.total_reviews > 0 ? ((result.fake_count / result.total_reviews) * 100).toFixed(1) : 0}% of analyzed
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                                <CardTitle className="text-xs sm:text-sm font-medium">Product Info</CardTitle>
                                <ShoppingBag className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                <div className="text-xs sm:text-sm font-medium truncate" title={result.product_title}>
                                    {result.product_title}
                                </div>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Source: {result.source}</p>
                                {result.total_product_reviews && (
                                    <p className="text-[10px] sm:text-blue-600 mt-1 font-medium">
                                        Analyzed {result.analyzed_reviews} of {result.total_product_reviews.toLocaleString()} total reviews
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Fake tokens */}
                    {result.top_fake_tokens && result.top_fake_tokens.length > 0 && (
                        <div className="bg-red-50/30 p-4 rounded-2xl border border-red-100">
                            <p className="text-xs font-heading uppercase tracking-widest font-bold text-brand-fake mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-fake" />
                                Top Fake Indicators
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {result.top_fake_tokens.map((token, idx) => (
                                    <Badge key={idx} variant="destructive" className="bg-red-200 text-red-800">
                                        {token}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* XAI Explanation */}
                    <div className="card-swiss p-0 border border-gray-100/50 overflow-hidden">
                        <button
                            onClick={() => setExpandedXAI(e => !e)}
                            className="w-full flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 px-5 py-4 bg-gradient-to-r from-gray-50 to-white hover:from-brand-blue/5 hover:to-white transition-all group lg:rounded-xl"
                        >
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full sm:w-auto">
                                <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Brain className="w-4 h-4 text-brand-blue" strokeWidth={2} />
                                </div>
                                <h3 className="font-heading text-sm uppercase tracking-widest font-bold text-gray-800 text-center sm:text-left mt-1 sm:mt-0">
                                    Why were reviews flagged? <span className="text-brand-blue/60 font-medium block sm:inline mt-1 sm:mt-0">(XAI Explanation)</span>
                                </h3>
                            </div>
                            <div className="flex-shrink-0">
                                {expandedXAI
                                    ? <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-brand-blue transition-colors" />
                                    : <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-brand-blue transition-colors" />}
                            </div>
                        </button>
                        {expandedXAI && (() => {
                            // Aggregate all indicators across all fake reviews
                            const allIndicators = result.reviews
                                .filter(r => r.is_fake)
                                .flatMap(r => r.ai_detection ? [{
                                    description: r.ai_detection.summary || 'AI-generated patterns detected',
                                    severity: r.ai_detection.ai_probability > 70 ? 'high' : r.ai_detection.ai_probability > 40 ? 'medium' : 'low',
                                    source: r.original_text?.slice(0, 40) + '...'
                                }] : []);

                            const sentimentMismatches = result.reviews
                                .filter(r => r.is_fake && r.sentiment_analysis?.rating_mismatch)
                                .length;

                            const aiGeneratedCount = result.reviews
                                .filter(r => r.is_fake && r.ai_detection?.ai_probability > 50)
                                .length;

                            return (
                                <div className="p-5 pt-2 animate-in slide-in-from-top-2 duration-300 space-y-5">
                                    {/* Key Findings Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="bg-rose-50/80 border border-rose-100 rounded-2xl p-4 text-center">
                                            <p className="font-mono text-3xl font-black text-rose-600">{result.fake_count}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mt-1">Fake Reviews</p>
                                        </div>
                                        <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-4 text-center">
                                            <p className="font-mono text-3xl font-black text-amber-600">{sentimentMismatches}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mt-1">Rating Mismatches</p>
                                        </div>
                                        <div className="bg-purple-50/80 border border-purple-100 rounded-2xl p-4 text-center sm:col-span-2 md:col-span-1">
                                            <p className="font-mono text-3xl font-black text-purple-600">{aiGeneratedCount}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mt-1">AI-Generated Likely</p>
                                        </div>
                                    </div>

                                    {/* Explanation */}
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3">
                                        <h4 className="font-heading font-bold text-xs uppercase tracking-widest text-brand-blue">Why were these flagged?</h4>
                                        <div className="space-y-2 text-sm text-gray-700">
                                            {result.fake_count > 0 && (
                                                <p>• <strong>{result.fake_count} reviews</strong> were classified as fake by the ML model based on linguistic patterns, repetitive phrasing, and unnatural sentence structure.</p>
                                            )}
                                            {sentimentMismatches > 0 && (
                                                <p>• <strong>{sentimentMismatches} reviews</strong> showed a mismatch between expressed sentiment and the given star rating — a key indicator of inauthentic reviews.</p>
                                            )}
                                            {aiGeneratedCount > 0 && (
                                                <p>• <strong>{aiGeneratedCount} reviews</strong> showed high probability of being AI-generated based on entropy and vocabulary analysis.</p>
                                            )}
                                            {result.top_fake_tokens?.length > 0 && (
                                                <p>• Common suspicious tokens detected: <span className="font-mono text-brand-blue">{result.top_fake_tokens.slice(0, 5).join(', ')}</span>.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Per-review AI detection */}
                                    {result.reviews.filter(r => r.is_fake).slice(0, 5).some(r => r.ai_detection) && (
                                        <div>
                                            <h4 className="font-heading font-bold text-xs uppercase tracking-widest text-gray-500 mb-3">Top Flagged Reviews — AI Detection Detail</h4>
                                            <div className="space-y-3">
                                                {result.reviews.filter(r => r.is_fake && r.ai_detection).slice(0, 4).map((r, i) => (
                                                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <Badge className={`text-[10px] font-bold uppercase tracking-widest border-0 rounded-full px-3 ${r.ai_detection.ai_probability > 70 ? 'bg-rose-100 text-rose-700' :
                                                                r.ai_detection.ai_probability > 40 ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>{r.ai_detection.ai_probability}% AI probability</Badge>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{r.ai_detection.summary}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 italic truncate">"{r.original_text}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Star Distribution */}
                    {result.rating_summary?.star_distribution && Object.keys(result.rating_summary.star_distribution).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
                                <CardDescription>
                                    Star rating breakdown from {result.rating_summary?.total_ratings?.toLocaleString() || 'all'} ratings
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const pct = result.rating_summary.star_distribution[String(star)] || 0;
                                        return (
                                            <div key={star} className="flex items-center gap-2 text-sm">
                                                <span className="w-12 text-right font-medium">{star} star</span>
                                                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="w-10 text-muted-foreground">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Verdict Card */}
                    {result.summary && (
                        <div className="card-swiss p-5 sm:p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-white/80 ring-1 ring-black/5">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 mb-6 sm:mb-10 pb-6 sm:pb-8 border-b border-gray-100">
                                <div className="text-center md:text-left w-full md:w-auto">
                                    <h2 className="font-heading text-[10px] sm:text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 sm:mb-4 flex items-center justify-center md:justify-start gap-2">
                                        <BarChart3 className="w-4 h-4" />
                                        Overall Verdict
                                    </h2>
                                    <Badge
                                        className={`
                                            text-sm sm:text-xl px-4 sm:px-8 py-2 sm:py-3 font-heading tracking-widest font-black uppercase shadow-lg
                                            ${result.summary.overall_verdict === 'Mostly Genuine' ? 'badge-genuine ring-4 ring-emerald-500/20' :
                                                result.summary.overall_verdict === 'Suspicious / Mostly Fake' ? 'badge-fake ring-4 ring-rose-500/20' :
                                                    'bg-amber-100/80 text-amber-800 border border-amber-200/50 shadow-sm ring-4 ring-amber-500/20'}
                                        `}
                                    >
                                        {result.summary.overall_verdict}
                                    </Badge>
                                </div>

                                <div className="w-full md:w-72">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
                                            Fake Ratio
                                        </span>
                                        <span className="font-heading text-2xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500">
                                            {(result.summary.fake_percentage).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-3 sm:h-4 bg-gray-200/50 w-full rounded-full overflow-hidden shadow-inner p-0.5">
                                        <div
                                            className="h-full bg-gradient-to-r from-rose-400 to-brand-fake rounded-full shadow-sm"
                                            style={{ width: `${result.summary.fake_percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <Tabs defaultValue="all" className="w-full">
                        <TabsList>
                            <TabsTrigger value="all">All Reviews ({result.total_reviews})</TabsTrigger>
                            <TabsTrigger value="fake" className="text-red-600">Fake ({result.fake_count})</TabsTrigger>
                            <TabsTrigger value="genuine" className="text-green-600">Genuine ({result.genuine_count})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="mt-4 space-y-4">
                            <div className="mt-10">
                                <h3 className="font-heading text-sm uppercase tracking-widest font-black text-gray-800 mb-6 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-brand-blue" />
                                    Detailed Individual Reviews
                                </h3>
                                <div className="space-y-4">
                                    {result.reviews.map((review, idx) => (
                                        <ReviewCard key={idx} review={review} />
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="fake" className="mt-4 space-y-4">
                            <div className="mt-10">
                                <h3 className="font-heading text-sm uppercase tracking-widest font-black text-gray-800 mb-6 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-brand-blue" />
                                    Detailed Individual Reviews
                                </h3>
                                <div className="space-y-4">
                                    {result.reviews.filter(r => r.is_fake).map((review, idx) => (
                                        <ReviewCard key={idx} review={review} />
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="genuine" className="mt-4 space-y-4">
                            <div className="mt-10">
                                <h3 className="font-heading text-sm uppercase tracking-widest font-black text-gray-800 mb-6 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-brand-blue" />
                                    Detailed Individual Reviews
                                </h3>
                                <div className="space-y-4">
                                    {result.reviews.filter(r => !r.is_fake).map((review, idx) => (
                                        <ReviewCard key={idx} review={review} />
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
};

const ReviewCard = ({ review }) => {
    return (
        <Card className={`border-l-4 ${review.is_fake ? 'border-l-red-500' : 'border-l-green-500'} card-swiss`}>
            <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                    <Badge variant={review.is_fake ? "destructive" : "secondary"} className={!review.is_fake ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                        {review.is_fake ? "Detected Fake" : "Genuine"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Confidence: {review.confidence?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                    {review.rating && (
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                            ))}
                        </div>
                    )}
                </div>
                <p className="text-sm text-gray-700">{review.original_text}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground border-t pt-2">
                    <span className="flex items-center gap-1 font-medium text-gray-900">
                        {review.author || "Unknown"}
                    </span>
                    {review.date && (
                        <span className="flex items-center gap-1">
                            • {review.date}
                        </span>
                    )}
                    {review.source && (
                        <span className="flex items-center gap-1">
                            • via {review.source}
                        </span>
                    )}
                    <span className="ml-auto">Model: {review.model_used}</span>
                </div>
            </CardContent>
        </Card>
    );
};

export default UrlAnalysisPage;
