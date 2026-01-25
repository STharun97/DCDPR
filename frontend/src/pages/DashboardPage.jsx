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
        <div className="flex items-center justify-between mb-8" data-testid="dashboard-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                DASHBOARD
              </h1>
              <p className="text-sm text-gray-500">
                System performance and analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="refresh-button"
              onClick={fetchData}
              variant="outline"
              className="rounded-none border-gray-200 hover:bg-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" strokeWidth={1.5} />
              REFRESH
            </Button>
            <Button
              data-testid="retrain-button"
              onClick={handleRetrain}
              disabled={retraining}
              className="bg-brand-blue hover:bg-black text-white rounded-none"
            >
              {retraining ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Cpu className="w-4 h-4 mr-2" strokeWidth={1.5} />
              )}
              RETRAIN MODELS
            </Button>
          </div>
        </div>

        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="stats-grid">
          {/* Total Reviews */}
          <div className="card-swiss p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-gray-500">Total Reviews</span>
              <TrendingUp className="w-4 h-4 text-brand-blue" strokeWidth={1.5} />
            </div>
            <p className="font-heading text-4xl font-bold">{stats?.total_reviews || 0}</p>
          </div>

          {/* Genuine Count */}
          <div className="card-swiss p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-gray-500">Genuine</span>
              <CheckCircle className="w-4 h-4 text-brand-genuine" strokeWidth={1.5} />
            </div>
            <p className="font-heading text-4xl font-bold text-brand-genuine">
              {stats?.genuine_count || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">{stats?.genuine_percentage || 0}%</p>
          </div>

          {/* Fake Count */}
          <div className="card-swiss p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-gray-500">Fake</span>
              <AlertTriangle className="w-4 h-4 text-brand-fake" strokeWidth={1.5} />
            </div>
            <p className="font-heading text-4xl font-bold text-brand-fake">
              {stats?.fake_count || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">{stats?.fake_percentage || 0}%</p>
          </div>

          {/* Average Confidence */}
          <div className="card-swiss p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-gray-500">Avg Confidence</span>
              <BarChart3 className="w-4 h-4 text-brand-blue" strokeWidth={1.5} />
            </div>
            <p className="font-heading text-4xl font-bold">{stats?.average_confidence || 0}%</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Distribution Pie Chart */}
          <div className="card-swiss p-6" data-testid="distribution-chart">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
              <h2 className="font-heading text-sm uppercase tracking-wider font-bold">
                Review Distribution
              </h2>
            </div>
            {stats?.total_reviews > 0 ? (
              <div className="h-64" style={{ minHeight: '256px', minWidth: '100%' }}>
                <ResponsiveContainer width="100%" height={256}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-genuine" />
                    <span className="text-sm">Genuine ({stats?.genuine_count})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-fake" />
                    <span className="text-sm">Fake ({stats?.fake_count})</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data to display
              </div>
            )}
          </div>

          {/* Model Performance */}
          <div className="card-swiss p-6" data-testid="model-performance">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="font-heading text-sm uppercase tracking-wider font-bold">
                Model Performance
              </h2>
              {metrics?.best_model && (
                <Badge className="rounded-none bg-brand-blue text-white font-heading text-xs">
                  Best: {metrics.best_model.replace('_', ' ')}
                </Badge>
              )}
            </div>
            {modelMetricsData.length > 0 ? (
              <div className="h-64" style={{ minHeight: '256px', minWidth: '100%' }}>
                <ResponsiveContainer width="100%" height={256}>
                  <BarChart data={modelMetricsData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="f1" fill="#002FA7" name="F1 Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No metrics available
              </div>
            )}
          </div>
        </div>

        {/* Model Metrics Detail */}
        {modelMetricsData.length > 0 && (
          <div className="card-swiss p-6 mb-8" data-testid="metrics-detail">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
              <h2 className="font-heading text-sm uppercase tracking-wider font-bold">
                Detailed Metrics
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {modelMetricsData.map((model) => (
                <div 
                  key={model.name} 
                  className={`p-4 border ${
                    metrics?.best_model?.replace('_', ' ').toLowerCase() === model.name.toLowerCase()
                      ? 'border-brand-blue bg-blue-50/30'
                      : 'border-gray-200'
                  }`}
                >
                  <h3 className="font-heading text-sm font-bold mb-4 flex items-center gap-2">
                    {model.name}
                    {metrics?.best_model?.replace('_', ' ').toLowerCase() === model.name.toLowerCase() && (
                      <Badge className="rounded-none bg-brand-blue text-white text-[10px]">BEST</Badge>
                    )}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Accuracy</span>
                        <span className="font-semibold">{model.accuracy}%</span>
                      </div>
                      <Progress value={model.accuracy} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Precision</span>
                        <span className="font-semibold">{model.precision}%</span>
                      </div>
                      <Progress value={model.precision} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Recall</span>
                        <span className="font-semibold">{model.recall}%</span>
                      </div>
                      <Progress value={model.recall} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">F1 Score</span>
                        <span className="font-semibold">{model.f1}%</span>
                      </div>
                      <Progress value={model.f1} className="h-1.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {stats?.recent_predictions && stats.recent_predictions.length > 0 && (
          <div className="card-swiss p-6" data-testid="recent-activity">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
              <h2 className="font-heading text-sm uppercase tracking-wider font-bold">
                Recent Activity
              </h2>
            </div>
            <div className="space-y-3">
              {stats.recent_predictions.map((pred, index) => (
                <div
                  key={pred.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {pred.prediction === "FAKE" ? (
                      <AlertTriangle className="w-4 h-4 text-brand-fake" strokeWidth={1.5} />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-brand-genuine" strokeWidth={1.5} />
                    )}
                    <Badge
                      className={`rounded-none font-heading text-xs ${
                        pred.prediction === "FAKE" ? "badge-fake" : "badge-genuine"
                      }`}
                    >
                      {pred.prediction}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">{pred.confidence}%</span>
                    <span className="text-xs text-gray-400">{formatDate(pred.created_at)}</span>
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
