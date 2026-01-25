import { useState, useRef } from "react";
import { Upload, FileText, Download, Loader2, CheckCircle, AlertTriangle, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "sonner";
import axios from "axios";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BulkAnalysisPage = () => {
  const [file, setFile] = useState(null);
  const [model, setModel] = useState("auto");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${API_URL}/analyze/csv?model=${model}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      setResults(response.data);
      setShowResults(true);
      toast.success(`Analyzed ${response.data.total_analyzed} reviews`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.detail || "Failed to analyze CSV");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`${API_URL}/export/${format}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `predictions_export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const downloadTemplate = () => {
    const template = "review_text,product_name,rating\n\"Your review text here\",\"Product Name\",5\n\"Another review\",\"Another Product\",4";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'review_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8" data-testid="bulk-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                BULK ANALYSIS
              </h1>
              <p className="text-sm text-gray-500">
                Upload CSV to analyze multiple reviews
              </p>
            </div>
          </div>
          
          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <Button
              data-testid="export-csv-btn"
              onClick={() => handleExport('csv')}
              variant="outline"
              className="rounded-none border-gray-200"
            >
              <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
              CSV
            </Button>
            <Button
              data-testid="export-json-btn"
              onClick={() => handleExport('json')}
              variant="outline"
              className="rounded-none border-gray-200"
            >
              <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
              JSON
            </Button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Upload Card */}
          <div className="card-swiss p-6" data-testid="upload-card">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
              <FileText className="w-5 h-5 text-brand-blue" strokeWidth={1.5} />
              <h2 className="font-heading text-sm uppercase tracking-wider font-bold">
                Upload CSV
              </h2>
            </div>
            
            {/* Drop Zone */}
            <div
              className={`
                border-2 border-dashed p-8 text-center cursor-pointer
                transition-colors duration-200
                ${file ? 'border-brand-blue bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}
              `}
              onClick={() => fileInputRef.current?.click()}
              data-testid="drop-zone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                data-testid="file-input"
              />
              
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-brand-blue" strokeWidth={1.5} />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="ml-4"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" strokeWidth={1} />
                  <p className="text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">CSV file (max 1000 reviews)</p>
                </>
              )}
            </div>
            
            {/* Model Selection */}
            <div className="mt-6">
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Model Selection
              </label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="rounded-none" data-testid="model-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Best Available)</SelectItem>
                  <SelectItem value="traditional">Traditional ML (TF-IDF)</SelectItem>
                  <SelectItem value="lstm">LSTM (Deep Learning)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Upload Button */}
            <Button
              data-testid="analyze-csv-btn"
              onClick={handleUpload}
              disabled={!file || isAnalyzing}
              className="w-full mt-6 bg-brand-blue hover:bg-black text-white rounded-none"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ANALYZING...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  ANALYZE CSV
                </>
              )}
            </Button>
          </div>
          
          {/* Instructions Card */}
          <div className="card-swiss p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
              <h2 className="font-heading text-sm uppercase tracking-wider font-bold">
                CSV Format
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Required Column:</h3>
                <code className="text-sm bg-gray-100 px-2 py-1">review_text</code>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Optional Columns:</h3>
                <div className="flex gap-2">
                  <code className="text-sm bg-gray-100 px-2 py-1">product_name</code>
                  <code className="text-sm bg-gray-100 px-2 py-1">rating</code>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 font-mono text-xs">
                <p className="text-gray-500 mb-2"># Example CSV:</p>
                <p>review_text,product_name,rating</p>
                <p>"Great product!",Phone Case,5</p>
                <p>"Average quality",Charger,3</p>
              </div>
              
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full rounded-none"
                data-testid="download-template-btn"
              >
                <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Download Template
              </Button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {results && (
          <div className="card-swiss p-6 mb-6 animate-slide-up" data-testid="results-summary">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="font-heading text-sm uppercase tracking-wider font-bold">
                Analysis Results
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResults(true)}
                className="rounded-none"
              >
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="font-heading text-4xl font-bold">{results.total_analyzed}</p>
                <p className="text-xs uppercase tracking-wider text-gray-500">Total Analyzed</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-4xl font-bold text-brand-genuine">{results.genuine_count}</p>
                <p className="text-xs uppercase tracking-wider text-gray-500">Genuine</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-4xl font-bold text-brand-fake">{results.fake_count}</p>
                <p className="text-xs uppercase tracking-wider text-gray-500">Fake</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Genuine: {((results.genuine_count / results.total_analyzed) * 100).toFixed(1)}%</span>
                <span>Fake: {((results.fake_count / results.total_analyzed) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-100 flex overflow-hidden">
                <div 
                  className="bg-brand-genuine"
                  style={{ width: `${(results.genuine_count / results.total_analyzed) * 100}%` }}
                />
                <div 
                  className="bg-brand-fake"
                  style={{ width: `${(results.fake_count / results.total_analyzed) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Dialog */}
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden rounded-none" data-testid="results-dialog">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg uppercase tracking-wider">
                Bulk Analysis Results
              </DialogTitle>
              <DialogDescription>
                {results?.total_analyzed} reviews analyzed
              </DialogDescription>
            </DialogHeader>
            
            {results && (
              <div className="overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-heading text-xs uppercase">Review</TableHead>
                      <TableHead className="font-heading text-xs uppercase">Product</TableHead>
                      <TableHead className="font-heading text-xs uppercase">Rating</TableHead>
                      <TableHead className="font-heading text-xs uppercase">Result</TableHead>
                      <TableHead className="font-heading text-xs uppercase text-right">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.results.map((result, index) => (
                      <TableRow key={result.id || index}>
                        <TableCell className="max-w-xs">
                          <p className="text-sm truncate">{truncateText(result.original_text)}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">{result.product_name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{result.rating || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`rounded-none font-heading text-xs ${
                              result.is_fake ? 'badge-fake' : 'badge-genuine'
                            }`}
                          >
                            {result.is_fake ? (
                              <AlertTriangle className="w-3 h-3 mr-1" />
                            ) : (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {result.prediction}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold">{result.confidence}%</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BulkAnalysisPage;
