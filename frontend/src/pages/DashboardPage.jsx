import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Loader2, RefreshCw, Cpu } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, metricsRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`),
        axios.get(`${API_URL}/metrics`),
      ]);
      setStats(statsRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await axios.post(`${API_URL}/retrain`);
      toast.success("Models retrained successfully");
      fetchData();
    } catch (error) {
      console.error("Error retraining:", error);
      toast.error("Failed to retrain models");
    } finally {
      setRetraining(false);
    }
  };

  const pieData = stats ? [
    { name: "Genuine", value: stats.genuine_count, color: "#059669" },
    { name: "Fake", value: stats.fake_count, color: "#DC2626" },
  ] : [];

  const modelMetricsData = metrics?.metrics ? Object.entries(metrics.metrics).map(([name, data]) => ({
    name: name.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    accuracy: Math.round(data.accuracy * 100),
    precision: Math.round(data.precision * 100),
    recall: Math.round(data.recall * 100),
    f1: Math.round(data.f1_score * 100),
  })) : [];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center" data-testid="loading-state">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8" data-testid="dashboard-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue flex items-center justify-center rounded-xl">
              <BarChart3 className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-heading text-lg sm:text-xl uppercase tracking-widest font-black text-gray-900 leading-none mb-1">
                DASHBOARD
              </h1>
              <p className="text-xs sm:text-sm font-medium text-gray-500">
                System performance & analytics
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 mt-4 md:mt-0 w-full sm:w-auto">
            <Button
              data-testid="refresh-button"
              onClick={fetchData}
              variant="outline"
              className="rounded-xl border-gray-200 hover:border-brand-blue/30 hover:bg-brand-blue/5 hover:text-brand-blue transition-all group px-4 py-5 flex-1 sm:flex-initial"
            >
              <RefreshCw className="w-4 h-4 mr-2 text-gray-400 group-hover:text-brand-blue transition-colors" strokeWidth={2} />
              <span className="font-heading font-bold text-xs tracking-widest uppercase">REFRESH</span>
            </Button>
            <Button
              data-testid="retrain-button"
              onClick={handleRetrain}
              disabled={retraining}
              className="bg-gradient-to-r from-brand-blue to-purple-600 hover:opacity-90 text-white rounded-xl shadow-lg shadow-brand-blue/20 transition-all duration-300 px-6 py-5 flex-1 sm:flex-initial"
            >
              {retraining ? (
                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
              ) : (
                <Cpu className="w-4 h-4 mr-3" strokeWidth={2} />
              )}
              <span className="font-heading font-bold text-xs tracking-widest uppercase">RETRAIN MODELS</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10" data-testid="stats-grid">
          {/* Total Reviews */}
          <div className="card-swiss p-6 sm:p-8 shadow-sm border-white/60 animate-slide-up bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500">Total Reviews</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-brand-blue" strokeWidth={2} />
              </div>
            </div>
            <p className="font-heading text-4xl sm:text-5xl font-black text-gray-900">{stats?.total_reviews || 0}</p>
          </div>

          {/* Genuine Count */}
          <div className="card-swiss p-6 sm:p-8 shadow-sm border-white/60 animate-slide-up bg-gradient-to-br from-emerald-50 to-white" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-emerald-700/60">Genuine</span>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" strokeWidth={2} />
              </div>
            </div>
            <p className="font-heading text-4xl sm:text-5xl font-black text-emerald-600">
              {stats?.genuine_count || 0}
            </p>
            <p className="font-mono text-xs sm:text-sm font-bold text-emerald-700/60 mt-2">{stats?.genuine_percentage || 0}%</p>
          </div>

          {/* Fake Count */}
          <div className="card-swiss p-6 sm:p-8 shadow-sm border-white/60 animate-slide-up bg-gradient-to-br from-rose-50 to-white" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-rose-700/60">Fake</span>
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-600" strokeWidth={2} />
              </div>
            </div>
            <p className="font-heading text-4xl sm:text-5xl font-black text-rose-600">
              {stats?.fake_count || 0}
            </p>
            <p className="font-mono text-xs sm:text-sm font-bold text-rose-700/60 mt-2">{stats?.fake_percentage || 0}%</p>
          </div>

          {/* Average Confidence */}
          <div className="card-swiss p-6 sm:p-8 shadow-sm border-white/60 animate-slide-up bg-gradient-to-br from-purple-50 to-white" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-purple-700/60">Avg Conf</span>
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-600" strokeWidth={2} />
              </div>
            </div>
            <p className="font-heading text-4xl sm:text-5xl font-black text-purple-600">{stats?.average_confidence || 0}%</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Distribution Pie Chart */}
          <div className="card-swiss p-8 md:p-10 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border-white/60 animate-slide-up" data-testid="distribution-chart">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-brand-blue" strokeWidth={2} />
              </div>
              <h2 className="font-heading text-sm uppercase tracking-widest font-black text-gray-800">
                Review Distribution
              </h2>
            </div>
            {stats?.total_reviews > 0 ? (
              <div className="h-72" style={{ minHeight: '288px', minWidth: '100%' }}>
                <ResponsiveContainer width="100%" height={288}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '1rem',
                        border: 'none',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        fontWeight: 'bold'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm" />
                    <span className="font-heading font-bold text-sm text-gray-700">Genuine ({stats?.genuine_count})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm" />
                    <span className="font-heading font-bold text-sm text-gray-700">Fake ({stats?.fake_count})</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-gray-400">
                <AlertTriangle className="w-8 h-8 mb-3 opacity-50" />
                <span className="font-heading font-bold text-sm uppercase tracking-widest">No data to display</span>
              </div>
            )}
          </div>

          {/* Model Performance */}
          <div className="card-swiss p-8 md:p-10 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border-white/60 animate-slide-up" style={{ animationDelay: '100ms' }} data-testid="model-performance">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-600" strokeWidth={2} />
                </div>
                <h2 className="font-heading text-sm uppercase tracking-widest font-black text-gray-800">
                  Model Performance
                </h2>
              </div>
              {metrics?.best_model && (
                <Badge className="rounded-full px-4 py-1.5 bg-gradient-to-r from-brand-blue to-purple-600 border-0 shadow-sm text-white font-heading font-bold tracking-widest text-[10px] uppercase">
                  Best Engine: {metrics.best_model.replace('_', ' ')}
                </Badge>
              )}
            </div>
            {modelMetricsData.length > 0 ? (
              <div className="h-72" style={{ minHeight: '288px', minWidth: '100%' }}>
                <ResponsiveContainer width="100%" height={288}>
                  <BarChart data={modelMetricsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis type="category" dataKey="name" width={110} axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 13, fontWeight: 'bold' }} />
                    <Tooltip
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{
                        borderRadius: '1rem',
                        border: 'none',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar dataKey="f1" fill="#4B6BFB" name="F1 Score" radius={[0, 12, 12, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="w-8 h-8 mb-3 opacity-50" />
                <span className="font-heading font-bold text-sm uppercase tracking-widest">No metrics available</span>
              </div>
            )}
          </div>
        </div>

        {/* Model Metrics Detail */}
        <div className="mt-10 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-brand-blue" strokeWidth={2} />
            </div>
            <h2 className="font-heading text-sm uppercase tracking-widest font-black text-gray-800">
              Detailed Engine Metrics
            </h2>
          </div>

          {modelMetricsData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modelMetricsData.map((model) => {
                const isBest = metrics?.best_model?.replace('_', ' ').toLowerCase() === model.name.toLowerCase();
                return (
                  <div
                    key={model.name}
                    className={`card-swiss p-8 transition-all duration-300 ${isBest
                      ? 'bg-gradient-to-br from-brand-blue/5 to-purple-500/5 border-2 border-brand-blue/30 shadow-lg shadow-brand-blue/10 scale-[1.02]'
                      : 'bg-white border hover:shadow-lg'
                      }`}
                  >
                    <h3 className="font-heading text-lg font-black mb-6 flex items-center justify-between text-gray-900 border-b border-gray-100 pb-4">
                      {model.name}
                      {isBest && (
                        <Badge className="bg-gradient-to-r from-brand-blue to-purple-600 text-white font-heading font-bold shadow-sm border-0 uppercase tracking-widest text-[10px] px-3 py-1">
                          BEST ENGINE
                        </Badge>
                      )}
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Accuracy</span>
                          <span className="font-mono font-bold text-gray-900">{model.accuracy}%</span>
                        </div>
                        <Progress value={model.accuracy} className="h-2 bg-gray-100" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Precision</span>
                          <span className="font-mono font-bold text-gray-900">{model.precision}%</span>
                        </div>
                        <Progress value={model.precision} className="h-2 bg-gray-100" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Recall</span>
                          <span className="font-mono font-bold text-gray-900">{model.recall}%</span>
                        </div>
                        <Progress value={model.recall} className="h-2 bg-gray-100" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="font-bold text-brand-blue uppercase tracking-widest text-[10px]">F1 Score</span>
                          <span className="font-mono font-bold text-brand-blue">{model.f1}%</span>
                        </div>
                        <Progress value={model.f1} className="h-2.5 bg-brand-blue/10 [&>div]:bg-brand-blue" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {stats?.recent_predictions && stats.recent_predictions.length > 0 && (
          <div className="mt-10 animate-slide-up" style={{ animationDelay: '300ms' }} data-testid="recent-activity">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-orange-500" strokeWidth={2} />
              </div>
              <h2 className="font-heading text-sm uppercase tracking-widest font-black text-gray-800">
                Recent Activity Log
              </h2>
            </div>
            <div className="space-y-4">
              {stats.recent_predictions.map((pred, index) => (
                <div
                  key={pred.id || index}
                  className="card-swiss p-5 bg-white/40 border border-gray-100/50 hover:bg-white/80 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${pred.prediction === "FAKE" ? "bg-rose-100 text-rose-500" : "bg-emerald-100 text-emerald-500"
                      }`}>
                      {pred.prediction === "FAKE" ? (
                        <AlertTriangle className="w-5 h-5" strokeWidth={2} />
                      ) : (
                        <CheckCircle className="w-5 h-5" strokeWidth={2} />
                      )}
                    </div>
                    <div>
                      <Badge
                        className={`rounded-full px-3 py-1 font-heading text-[10px] uppercase font-bold tracking-widest border-0 shadow-sm ${pred.prediction === "FAKE" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                          }`}
                      >
                        {pred.prediction} DETECTED
                      </Badge>
                      <p className="mt-2 text-sm text-gray-600 truncate max-w-md">"{pred.original_text || 'Review content hidden'}"</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Confidence</span>
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{pred.confidence}%</span>
                    </div>
                    <span className="text-xs font-medium text-gray-400 sm:mt-1">{formatDate(pred.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
