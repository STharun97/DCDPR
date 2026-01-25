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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8" data-testid="history-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue flex items-center justify-center">
              <History className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                PREDICTION HISTORY
              </h1>
              <p className="text-sm text-gray-500">
                {predictions.length} total predictions
              </p>
            </div>
          </div>
          <Button
            data-testid="refresh-button"
            onClick={fetchPredictions}
            variant="outline"
            className="rounded-none border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            REFRESH
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20" data-testid="loading-state">
            <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          </div>
        ) : predictions.length === 0 ? (
          <div className="card-swiss p-12 text-center" data-testid="empty-state">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" strokeWidth={1} />
            <h3 className="font-heading text-lg font-bold mb-2">No Predictions Yet</h3>
            <p className="text-gray-500 text-sm">
              Start analyzing reviews to build your history
            </p>
          </div>
        ) : (
          <div className="card-swiss overflow-hidden" data-testid="predictions-table">
            <Table className="table-swiss">
              <TableHeader>
                <TableRow className="border-b-2 border-gray-900">
                  <TableHead className="font-heading uppercase text-xs tracking-wider">
                    Review
                  </TableHead>
                  <TableHead className="font-heading uppercase text-xs tracking-wider">
                    Result
                  </TableHead>
                  <TableHead className="font-heading uppercase text-xs tracking-wider text-center">
                    Confidence
                  </TableHead>
                  <TableHead className="font-heading uppercase text-xs tracking-wider">
                    Model
                  </TableHead>
                  <TableHead className="font-heading uppercase text-xs tracking-wider">
                    Date
                  </TableHead>
                  <TableHead className="font-heading uppercase text-xs tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions.map((prediction) => (
                  <TableRow 
                    key={prediction.id} 
                    className="hover:bg-gray-50 transition-colors"
                    data-testid={`prediction-row-${prediction.id}`}
                  >
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-700 truncate">
                        {truncateText(prediction.original_text)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-none font-heading text-xs tracking-wider ${
                          prediction.is_fake ? "badge-fake" : "badge-genuine"
                        }`}
                      >
                        {prediction.is_fake ? (
                          <AlertTriangle className="w-3 h-3 mr-1" strokeWidth={1.5} />
                        ) : (
                          <CheckCircle className="w-3 h-3 mr-1" strokeWidth={1.5} />
                        )}
                        {prediction.prediction}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{prediction.confidence}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500 uppercase">
                        {prediction.model_used?.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDate(prediction.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          data-testid={`view-details-${prediction.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(prediction)}
                          className="h-8 w-8 p-0 hover:bg-brand-blue hover:text-white"
                        >
                          <Eye className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                        <Button
                          data-testid={`delete-prediction-${prediction.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(prediction.id)}
                          className="h-8 w-8 p-0 hover:bg-brand-fake hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl rounded-none" data-testid="details-dialog">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg uppercase tracking-wider flex items-center gap-2">
                {selectedPrediction?.is_fake ? (
                  <AlertTriangle className="w-5 h-5 text-brand-fake" strokeWidth={1.5} />
                ) : (
                  <CheckCircle className="w-5 h-5 text-brand-genuine" strokeWidth={1.5} />
                )}
                Prediction Details
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detailed view of the review prediction analysis
              </DialogDescription>
            </DialogHeader>
            
            {selectedPrediction && (
              <div className="space-y-6 pt-4">
                {/* Result Badge */}
                <div className="flex items-center justify-between">
                  <Badge
                    className={`rounded-none font-heading text-sm px-4 py-1 ${
                      selectedPrediction.is_fake ? "badge-fake" : "badge-genuine"
                    }`}
                  >
                    {selectedPrediction.prediction}
                  </Badge>
                  <span className="font-heading text-2xl font-bold">
                    {selectedPrediction.confidence}%
                  </span>
                </div>

                {/* Original Review */}
                <div>
                  <h4 className="font-heading text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Original Review
                  </h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 border-l-2 border-brand-blue">
                    {selectedPrediction.original_text}
                  </p>
                </div>

                {/* Processed Text */}
                <div>
                  <h4 className="font-heading text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Processed Text
                  </h4>
                  <p className="text-xs text-gray-500 font-mono bg-gray-50 p-4">
                    {selectedPrediction.processed_text}
                  </p>
                </div>

                {/* Probabilities */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs uppercase tracking-wider text-gray-500">
                        Genuine
                      </span>
                      <span className="text-sm font-semibold text-brand-genuine">
                        {selectedPrediction.genuine_probability}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100">
                      <div
                        className="h-full bg-brand-genuine"
                        style={{ width: `${selectedPrediction.genuine_probability}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs uppercase tracking-wider text-gray-500">
                        Fake
                      </span>
                      <span className="text-sm font-semibold text-brand-fake">
                        {selectedPrediction.fake_probability}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100">
                      <div
                        className="h-full bg-brand-fake"
                        style={{ width: `${selectedPrediction.fake_probability}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Indicators */}
                {selectedPrediction.indicators && selectedPrediction.indicators.length > 0 && (
                  <div>
                    <h4 className="font-heading text-xs uppercase tracking-wider text-gray-500 mb-2">
                      Indicators
                    </h4>
                    <div className="space-y-2">
                      {selectedPrediction.indicators.map((indicator, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 p-2 border-l-2 ${
                            indicator.severity === 'high'
                              ? 'border-brand-fake bg-red-50/50'
                              : indicator.severity === 'medium'
                              ? 'border-yellow-500 bg-yellow-50/50'
                              : 'border-gray-300 bg-gray-50/50'
                          }`}
                        >
                          <span className="text-sm">{indicator.description}</span>
                          <Badge variant="outline" className="text-[10px] uppercase rounded-none">
                            {indicator.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-400">
                  <span>Model: {selectedPrediction.model_used?.replace('_', ' ').toUpperCase()}</span>
                  <span>{formatDate(selectedPrediction.created_at)}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default HistoryPage;
