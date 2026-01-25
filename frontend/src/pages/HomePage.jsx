import { useState } from "react";
import { Search, AlertTriangle, CheckCircle, Loader2, Sparkles, Info } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const [reviewText, setReviewText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

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
    <div className="noise-texture min-h-[calc(100vh-64px)]">
      <div className="noise-content">
        {/* Hero Section */}
        <section className="py-12 md:py-20 px-4" data-testid="hero-section">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 mb-4 animate-fade-in">
              DETECT <span className="text-brand-blue">FAKE</span> REVIEWS
            </h1>
            <p className="font-body text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8 animate-fade-in delay-100">
              Our ML-powered system analyzes product reviews using NLP and multiple 
              classification models to identify authenticity with high accuracy.
            </p>
          </div>
        </section>

        {/* Main Analysis Section */}
        <section className="pb-20 px-4" data-testid="analysis-section">
          <div className="max-w-4xl mx-auto">
            {/* Input Card */}
            <div className="card-swiss p-6 md:p-8 mb-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <Search className="w-5 h-5 text-brand-blue" strokeWidth={1.5} />
                <h2 className="font-heading text-sm uppercase tracking-wider font-bold">
                  Review Analysis
                </h2>
              </div>
              
              <Textarea
                data-testid="review-input"
                placeholder="Paste a product review here to analyze its authenticity..."
                className="input-swiss min-h-[160px] text-base resize-none w-full mb-6"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {reviewText.length} characters • Min 5 required
                </div>
                <Button
                  data-testid="analyze-button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || reviewText.length < 5}
                  className="bg-brand-blue hover:bg-black text-white font-heading text-sm tracking-wider px-8 py-3 rounded-none transition-colors duration-200"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ANALYZING...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      CHECK REVIEW
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Result Card */}
            {result && (
              <div 
                className="card-swiss p-6 md:p-8 animate-slide-up"
                data-testid="result-card"
              >
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                  {result.is_fake ? (
                    <AlertTriangle className="w-5 h-5 text-brand-fake" strokeWidth={1.5} />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-brand-genuine" strokeWidth={1.5} />
                  )}
                  <h2 className="font-heading text-sm uppercase tracking-wider font-bold">
                    Analysis Result
                  </h2>
                </div>

                {/* Main Result */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                  <div>
                    <Badge
                      data-testid="prediction-badge"
                      className={`
                        text-lg px-6 py-2 font-heading tracking-wider rounded-none
                        ${result.is_fake ? "badge-fake" : "badge-genuine"}
                      `}
                    >
                      {result.prediction}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-2">
                      Model: {result.model_used?.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  
                  {/* Confidence Meter */}
                  <div className="w-full md:w-64" data-testid="confidence-meter">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-xs uppercase tracking-wider text-gray-500">
                        Confidence
                      </span>
                      <span className="font-heading text-2xl font-bold">
                        {result.confidence}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 w-full">
                      <div
                        className={`h-full animate-fill-meter ${
                          result.is_fake ? "bg-brand-fake" : "bg-brand-genuine"
                        }`}
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Probability Bars */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div data-testid="genuine-probability">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs uppercase tracking-wider text-gray-500">
                        Genuine
                      </span>
                      <span className="text-sm font-semibold text-brand-genuine">
                        {result.genuine_probability}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100">
                      <div
                        className="h-full bg-brand-genuine"
                        style={{ width: `${result.genuine_probability}%` }}
                      />
                    </div>
                  </div>
                  <div data-testid="fake-probability">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs uppercase tracking-wider text-gray-500">
                        Fake
                      </span>
                      <span className="text-sm font-semibold text-brand-fake">
                        {result.fake_probability}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100">
                      <div
                        className="h-full bg-brand-fake"
                        style={{ width: `${result.fake_probability}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Indicators */}
                {result.indicators && result.indicators.length > 0 && (
                  <div data-testid="indicators-section">
                    <h3 className="font-heading text-xs uppercase tracking-wider text-gray-500 mb-3">
                      Detection Indicators
                    </h3>
                    <div className="space-y-2">
                      {result.indicators.map((indicator, index) => (
                        <div
                          key={index}
                          className={`
                            flex items-start gap-3 p-3 border-l-2
                            ${indicator.severity === 'high' 
                              ? 'border-brand-fake bg-red-50/50' 
                              : indicator.severity === 'medium'
                              ? 'border-yellow-500 bg-yellow-50/50'
                              : 'border-gray-300 bg-gray-50/50'
                            }
                          `}
                        >
                          <AlertTriangle 
                            className={`w-4 h-4 mt-0.5 flex-shrink-0
                              ${indicator.severity === 'high' 
                                ? 'text-brand-fake' 
                                : indicator.severity === 'medium'
                                ? 'text-yellow-600'
                                : 'text-gray-400'
                              }
                            `} 
                            strokeWidth={1.5} 
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {indicator.description}
                            </span>
                            <Badge 
                              variant="outline" 
                              className="ml-2 text-[10px] uppercase rounded-none"
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
              </div>
            )}

            {/* Sample Reviews */}
            <div className="mt-12" data-testid="sample-reviews">
              <h3 className="font-heading text-xs uppercase tracking-wider text-gray-400 mb-4 text-center">
                Try Sample Reviews
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {sampleReviews.map((sample, index) => (
                  <button
                    key={index}
                    data-testid={`sample-review-${index}`}
                    onClick={() => setReviewText(sample.text)}
                    className="card-swiss p-4 text-left hover:border-brand-blue transition-colors duration-200 group"
                  >
                    <Badge 
                      variant="outline" 
                      className="mb-2 text-[10px] uppercase tracking-wider rounded-none"
                    >
                      {sample.label}
                    </Badge>
                    <p className="text-sm text-gray-600 line-clamp-3 group-hover:text-gray-900 transition-colors">
                      {sample.text}
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
