import { useState, useEffect } from "react";
import { History, Trash2, Eye, AlertTriangle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HistoryPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/predictions?limit=100`);
      setPredictions(response.data);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      toast.error("Failed to load prediction history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/predictions/${id}`);
      setPredictions(predictions.filter((p) => p.id !== id));
      toast.success("Prediction deleted");
    } catch (error) {
      console.error("Error deleting prediction:", error);
      toast.error("Failed to delete prediction");
    }
  };

  const handleViewDetails = (prediction) => {
    setSelectedPrediction(prediction);
    setDetailsOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text, maxLength = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6 mb-6 sm:mb-10 pb-6 sm:pb-8 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-blue to-purple-600 flex items-center justify-center shadow-lg shadow-brand-blue/20 flex-shrink-0">
              <History className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-heading text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Analysis History</h1>
              <p className="font-body text-xs sm:text-sm text-gray-500">View and manage previous predictions</p>
            </div>
          </div>
          <Button
            data-testid="refresh-button"
            onClick={fetchPredictions}
            variant="outline"
            className="rounded-xl border-gray-200 hover:border-brand-blue/30 hover:bg-brand-blue/5 hover:text-brand-blue transition-all group px-4 py-5 w-full sm:w-auto mt-2 sm:mt-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 text-gray-400 group-hover:text-brand-blue transition-colors ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
            <span className="font-heading font-bold text-xs tracking-widest uppercase">REFRESH</span>
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20" data-testid="loading-state">
            <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          </div>
        ) : predictions.length === 0 ? (
          <div className="card-swiss p-12 text-center shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border-white/60 animate-fade-in" data-testid="empty-state">
            <div className="w-20 h-20 rounded-full bg-gray-50 mx-auto flex items-center justify-center mb-6">
              <History className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading text-xl font-black text-gray-800 mb-2">No Predictions Yet</h3>
            <p className="text-gray-500 font-medium">
              Start analyzing reviews to build your history
            </p>
          </div>
        ) : (
          <div className="card-swiss p-0 shadow-xl border-white/60 overflow-hidden animate-slide-up" data-testid="predictions-table">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead className="font-heading font-bold uppercase text-[10px] tracking-widest text-gray-500 py-4">
                      Review Content
                    </TableHead>
                    <TableHead className="font-heading font-bold uppercase text-[10px] tracking-widest text-gray-500 py-4">
                      Result
                    </TableHead>
                    <TableHead className="font-heading font-bold uppercase text-[10px] tracking-widest text-gray-500 py-4 text-center">
                      Confidence
                    </TableHead>
                    <TableHead className="font-heading font-bold uppercase text-[10px] tracking-widest text-gray-500 py-4 hidden md:table-cell">
                      Model
                    </TableHead>
                    <TableHead className="font-heading font-bold uppercase text-[10px] tracking-widest text-gray-500 py-4 hidden sm:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="font-heading font-bold uppercase text-[10px] tracking-widest text-gray-500 py-4 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.map((prediction) => (
                    <TableRow
                      key={prediction.id}
                      className="hover:bg-blue-50/30 transition-colors border-b border-gray-100/50 group"
                      data-testid={`prediction-row-${prediction.id}`}
                    >
                      <TableCell className="max-w-xs font-medium py-4">
                        <p className="text-sm text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                          {truncateText(prediction.original_text)}
                        </p>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          className={`rounded-full px-3 py-1 font-heading text-[10px] uppercase font-bold tracking-widest border-0 shadow-sm ${prediction.is_fake ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                            }`}
                        >
                          {prediction.is_fake ? (
                            <AlertTriangle className="w-3 h-3 mr-1.5" strokeWidth={2} />
                          ) : (
                            <CheckCircle className="w-3 h-3 mr-1.5" strokeWidth={2} />
                          )}
                          {prediction.prediction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className="font-mono font-bold text-gray-900 bg-gray-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[10px] sm:text-xs">{prediction.confidence}%</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          {prediction.model_used?.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-4">
                        <span className="text-xs font-medium text-gray-500">
                          {formatDate(prediction.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            data-testid={`view-details-${prediction.id}`}
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(prediction)}
                            className="h-8 w-8 rounded-lg hover:bg-brand-blue/10 hover:text-brand-blue transition-colors text-gray-400"
                          >
                            <Eye className="w-4 h-4" strokeWidth={2} />
                          </Button>
                          <Button
                            data-testid={`delete-prediction-${prediction.id}`}
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(prediction.id)}
                            className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-colors text-gray-400"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl rounded-2xl border border-white/60 shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl" data-testid="details-dialog">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="font-heading text-lg font-black uppercase tracking-widest flex items-center gap-3 text-gray-900">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedPrediction?.is_fake ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'
                  }`}>
                  {selectedPrediction?.is_fake ? (
                    <AlertTriangle className="w-4 h-4" strokeWidth={2} />
                  ) : (
                    <CheckCircle className="w-4 h-4" strokeWidth={2} />
                  )}
                </div>
                Prediction Details
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detailed view of the review prediction analysis
              </DialogDescription>
            </DialogHeader>

            {selectedPrediction && (
              <div className="space-y-6 p-6 pt-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {/* Result Badge Base */}
                <div className={`flex items-center justify-between p-5 rounded-xl border ${selectedPrediction.is_fake ? "bg-rose-50/50 border-rose-100" : "bg-emerald-50/50 border-emerald-100"
                  }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Final Analysis Result</span>
                    <Badge
                      className={`rounded-full shadow-sm bg-gradient-to-r px-4 py-1.5 font-heading text-xs uppercase font-black tracking-widest border-0 text-white ${selectedPrediction.is_fake ? "from-rose-500 to-rose-600" : "from-emerald-500 to-emerald-600"
                        }`}
                    >
                      {selectedPrediction.prediction} DETECTED
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Confidence Score</span>
                    <span className={`font-mono text-3xl font-black ${selectedPrediction.is_fake ? "text-rose-600" : "text-emerald-600"
                      }`}>
                      {selectedPrediction.confidence}%
                    </span>
                  </div>
                </div>

                {/* Original Review */}
                <div>
                  <h4 className="font-heading text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Original Review Text
                  </h4>
                  <p className={`text-sm text-gray-700 bg-gray-50/80 p-5 rounded-xl border-l-4 ${selectedPrediction.is_fake ? "border-l-rose-500" : "border-l-emerald-500"
                    } leading-relaxed`}>
                    "{selectedPrediction.original_text}"
                  </p>
                </div>

                {/* Processed Text */}
                <div>
                  <h4 className="font-heading text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Model Entry (Processed)
                  </h4>
                  <p className="text-xs text-gray-500 font-mono bg-gray-50/80 p-4 rounded-xl border border-gray-100 break-all">
                    {selectedPrediction.processed_text}
                  </p>
                </div>

                {/* Probabilities */}
                <div className="grid grid-cols-2 gap-6 bg-white p-5 rounded-xl border border-gray-100/50 shadow-sm">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">
                        Genuine Probability
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600">
                        {selectedPrediction.genuine_probability}%
                      </span>
                    </div>
                    <div className="h-2 bg-emerald-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${selectedPrediction.genuine_probability}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600/70">
                        Fake Probability
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-600">
                        {selectedPrediction.fake_probability}%
                      </span>
                    </div>
                    <div className="h-2 bg-rose-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${selectedPrediction.fake_probability}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Indicators */}
                {selectedPrediction.indicators && selectedPrediction.indicators.length > 0 && (
                  <div>
                    <h4 className="font-heading text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block border-b border-gray-100 pb-2">
                      Key Flags & Indicators
                    </h4>
                    <div className="space-y-3">
                      {selectedPrediction.indicators.map((indicator, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-4 rounded-xl border ${indicator.severity === 'high'
                            ? 'border-rose-200 bg-rose-50/80 text-rose-800'
                            : indicator.severity === 'medium'
                              ? 'border-orange-200 bg-orange-50/80 text-orange-800'
                              : 'border-blue-200 bg-blue-50/80 text-blue-800'
                            }`}
                        >
                          {indicator.severity === 'high' ? (
                            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" strokeWidth={2} />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" strokeWidth={2} />
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium">{indicator.description}</span>
                          </div>
                          <Badge className={`text-[9px] uppercase font-bold tracking-widest border-0 shadow-sm ${indicator.severity === 'high'
                            ? 'bg-rose-500 text-white'
                            : indicator.severity === 'medium'
                              ? 'bg-orange-500 text-white'
                              : 'bg-blue-500 text-white'
                            } rounded-full px-2 py-0.5 mt-0.5`}>
                            {indicator.severity} WARNING
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-100 text-xs text-gray-500 gap-2 mt-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Analysis Engine</span>
                    <span className="font-mono font-bold text-brand-blue">{selectedPrediction.model_used?.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Timestamp</span>
                    <span className="font-medium">{formatDate(selectedPrediction.created_at)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div >
  );
};

export default HistoryPage;
