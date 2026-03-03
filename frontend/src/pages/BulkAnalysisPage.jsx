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
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
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

  const handleViewDetails = (review) => {
    setSelectedReview(review);
    setDetailsOpen(true);
  };

  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="noise-texture min-h-[calc(100vh-64px)] pb-12 w-full">
      <div className="noise-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-gray-100 font-sans">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-blue to-purple-600 flex items-center justify-center shadow-lg shadow-brand-blue/20 flex-shrink-0">
              <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-heading text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Bulk Analysis</h1>
              <p className="font-body text-xs sm:text-sm text-gray-500">Analyze multiple reviews via CSV upload</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
            <Button
              onClick={() => handleExport('csv')}
              variant="outline"
              className="rounded-xl border-gray-200 hover:border-brand-blue/30 hover:bg-brand-blue/5 hover:text-brand-blue transition-all group px-4 py-5 flex-1 sm:flex-initial shadow-sm"
            >
              <Download className="w-4 h-4 mr-2 text-gray-400 group-hover:text-brand-blue transition-colors" strokeWidth={2} />
              <span className="font-heading font-bold text-[10px] tracking-widest uppercase">CSV</span>
            </Button>
            <Button
              onClick={() => handleExport('json')}
              variant="outline"
              className="rounded-xl border-gray-200 hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-600 transition-all group px-4 py-5 flex-1 sm:flex-initial shadow-sm"
            >
              <Download className="w-4 h-4 mr-2 text-gray-400 group-hover:text-purple-600 transition-colors" strokeWidth={2} />
              <span className="font-heading font-bold text-[10px] tracking-widest uppercase">JSON</span>
            </Button>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Upload Card */}
          <div className="card-swiss p-5 sm:p-8 md:p-10 shadow-sm border-white/60 animate-slide-up" data-testid="upload-card">
            <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-4 border-b border-gray-100">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-brand-blue" strokeWidth={2} />
              </div>
              <h2 className="font-heading text-xs sm:text-sm uppercase tracking-widest font-black text-gray-800">
                Upload CSV File
              </h2>
            </div>

            <div
              className={`
                border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center cursor-pointer
                transition-all duration-300 relative overflow-hidden group
                ${file ? 'border-brand-blue bg-blue-50/50' : 'border-gray-200 hover:border-brand-blue/50 hover:bg-gray-50/50'}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-between gap-3 sm:gap-4 relative z-10 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-brand-blue/10">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue" strokeWidth={2} />
                    </div>
                    <div className="text-left">
                      <p className="font-heading text-xs sm:text-sm font-bold text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">{file.name}</p>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500 text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4 sm:mb-5 group-hover:scale-110 transition-all shadow-sm">
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-brand-blue" strokeWidth={2} />
                  </div>
                  <p className="font-heading text-sm sm:text-lg font-black text-gray-800 mb-2">Select CSV File</p>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-400 tracking-wider">Drag & drop or click to browse</p>
                </div>
              )}
            </div>

            <div className="mt-6 sm:mt-8">
              <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Detection Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-full rounded-xl sm:rounded-2xl border-gray-200 py-5 sm:py-6 text-xs sm:text-sm bg-gray-50/50 shadow-sm border-0 ring-1 ring-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                  <SelectItem value="auto" className="py-2.5">Auto (Recommended)</SelectItem>
                  <SelectItem value="traditional" className="py-2.5">Traditional ML</SelectItem>
                  <SelectItem value="lstm" className="py-2.5">Deep Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || isAnalyzing}
              className="w-full mt-6 sm:mt-8 bg-gradient-to-r from-brand-blue to-purple-600 text-white font-heading font-black text-xs sm:text-sm tracking-widest py-6 sm:py-7 rounded-xl sm:rounded-2xl shadow-xl shadow-brand-blue/20 transition-all hover:scale-[1.01]"
            >
              {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> ANALYZING...</> : <><Upload className="w-4 h-4 mr-2" /> START ANALYSIS</>}
            </Button>
          </div>

          {/* Instructions Card */}
          <div className="card-swiss p-5 sm:p-8 md:p-10 shadow-sm border-white/60 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-4 border-b border-gray-100">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-500" strokeWidth={2} />
              </div>
              <h2 className="font-heading text-xs sm:text-sm uppercase tracking-widest font-black text-gray-800">Review Guidelines</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/50">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Required</span>
                  <Badge variant="secondary" className="font-mono text-[10px] bg-white border-gray-200 text-brand-blue font-bold px-3 py-1">review_text</Badge>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/50">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Optional</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px] bg-white border-gray-200 px-3 py-1">product_name</Badge>
                    <Badge variant="secondary" className="font-mono text-[10px] bg-white border-gray-200 px-3 py-1">rating</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-[#1e1e1e] rounded-xl sm:rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
                <div className="font-mono text-[10px] sm:text-xs space-y-2 text-gray-400">
                  <p><span className="text-emerald-400">review_text</span>,product_name,rating</p>
                  <p>"Genuine quality products",Headphones,5</p>
                  <p>"Worst experience ever",Mobile,1</p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full rounded-xl py-6 border-2 border-dashed border-gray-200 hover:border-brand-blue hover:text-brand-blue hover:bg-brand-blue/5 transition-all text-xs font-bold uppercase tracking-widest text-gray-500"
              >
                <Download className="w-4 h-4 mr-3" /> Download Template
              </Button>
            </div>
          </div>
        </div>

        {/* Results Overview */}
        {results && (
          <div className="card-swiss p-6 sm:p-8 md:p-10 mb-10 shadow-2xl border-white/80 animate-slide-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-brand-blue" />
                </div>
                <h2 className="font-heading text-xs sm:text-sm uppercase tracking-widest font-black text-gray-800">Analysis Summary</h2>
              </div>
              <Button
                onClick={() => setShowResults(true)}
                className="rounded-xl px-6 font-heading font-bold text-[10px] tracking-widest uppercase transition-all bg-brand-blue hover:bg-brand-blue-dark text-white shadow-lg shadow-brand-blue/10"
              >
                View Detailed Table
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-6 text-center shadow-sm border border-gray-100/50">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Analyzed</p>
                <p className="font-heading text-5xl font-black text-gray-900 leading-none">{results.total_analyzed}</p>
              </div>
              <div className="bg-emerald-50/50 rounded-2xl sm:rounded-3xl p-6 text-center shadow-sm border border-emerald-100/50">
                <p className="text-[10px] uppercase font-bold text-emerald-600/60 mb-2">Authentic</p>
                <p className="font-heading text-5xl font-black text-emerald-600 leading-none">{results.genuine_count}</p>
              </div>
              <div className="bg-rose-50/50 rounded-2xl sm:rounded-3xl p-6 text-center shadow-sm border border-rose-100/50">
                <p className="text-[10px] uppercase font-bold text-rose-600/60 mb-2">Fake</p>
                <p className="font-heading text-5xl font-black text-rose-600 leading-none">{results.fake_count}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> GENUINE {((results.genuine_count / results.total_analyzed) * 100).toFixed(1)}%</span>
                  <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> FAKE {((results.fake_count / results.total_analyzed) * 100).toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={(results.genuine_count / results.total_analyzed) * 100} className="h-2.5 bg-gray-100 [&>div]:bg-emerald-500" />
            </div>
          </div>
        )}

        {/* Results Full List Dialog */}
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-7xl max-h-[90vh] flex flex-col overflow-hidden rounded-[2rem] p-0 border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <div className="p-4 md:p-8 pb-4 border-b border-gray-100 bg-gray-50/30 flex-shrink-0">
              <DialogHeader>
                <DialogTitle className="font-heading text-lg md:text-xl font-black uppercase tracking-widest flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-brand-blue" />
                  </div>
                  Detailed Analysis
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm font-medium text-gray-500 mt-2">
                  Showing results for {results?.total_analyzed} reviews from batch upload
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-3 md:p-8 pt-4 bg-white">
              <div className="rounded-2xl border border-gray-100 shadow-sm min-w-[600px] lg:min-w-[700px]">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="font-heading text-[10px] uppercase font-black text-gray-500 py-5 pl-6">Review Content</TableHead>
                      <TableHead className="font-heading text-[10px] uppercase font-black text-gray-500 py-5">Product</TableHead>
                      <TableHead className="font-heading text-[10px] uppercase font-black text-gray-500 py-5 text-center">Verdict</TableHead>
                      <TableHead className="font-heading text-[10px] uppercase font-black text-gray-500 py-5 text-center">Confidence</TableHead>
                      <TableHead className="font-heading text-[10px] uppercase font-black text-gray-500 py-5 text-right pr-8">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results?.results.map((item, idx) => (
                      <TableRow key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="max-w-[220px] py-4 pl-6 text-xs text-gray-700 font-medium truncate italic opacity-80 leading-relaxed capitalize">
                          "{truncateText(item.original_text, 50)}"
                        </TableCell>
                        <TableCell className="py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider truncate max-w-[120px]">
                          {item.product_name || 'GENERIC'}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <Badge className={`rounded-full px-2.5 py-0.5 font-heading text-[9px] font-black uppercase tracking-tighter border-0 ${item.is_fake ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                            {item.prediction}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <span className="font-mono text-[10px] font-black bg-gray-100 px-2 py-1 rounded shadow-inner-sm text-gray-600">{item.confidence}%</span>
                        </TableCell>
                        <TableCell className="text-right py-4 pr-8">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(item)}
                            className="h-8 w-8 hover:bg-brand-blue/5 hover:text-brand-blue rounded-lg transition-colors border-0"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detailed Individual Analysis View */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-4xl max-h-[90vh] flex flex-col rounded-[1.5rem] md:rounded-[2rem] border-0 shadow-3xl p-0 overflow-hidden bg-white">
            <div className="p-5 md:p-8 pb-4 md:pb-5 border-b border-gray-100 flex-shrink-0 flex flex-col md:flex-row items-center justify-between z-10 bg-white">
              <DialogHeader className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4 text-center md:text-left space-y-0">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${selectedReview?.is_fake ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-200' : 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-200'}`}>
                  {selectedReview?.is_fake ? <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />}
                </div>
                <div>
                  <DialogTitle className="font-heading text-base md:text-lg font-black uppercase tracking-widest text-gray-900 leading-tight md:leading-none">Review Analysis</DialogTitle>
                  <DialogDescription className="text-[10px] md:text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Analysis Report for ID: {selectedReview?.id?.substring(0, 8) || 'N/A'}</DialogDescription>
                </div>
              </DialogHeader>
            </div>

            {selectedReview && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8 space-y-6 md:space-y-8 font-sans bg-white/50">
                {/* Result Card */}
                <div className={`p-4 md:p-8 rounded-[1.5rem] md:rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 ${selectedReview.is_fake ? "bg-rose-50/30 border-rose-100" : "bg-emerald-50/30 border-emerald-100"}`}>
                  <div className="text-center md:text-left">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Verdict</span>
                    <Badge className={`text-xs md:text-sm px-4 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-2xl font-black uppercase tracking-widest border-0 shadow-lg ${selectedReview.is_fake ? "bg-red-500 text-white shadow-red-200" : "bg-emerald-500 text-white shadow-emerald-200"}`}>
                      {selectedReview.prediction}
                    </Badge>
                  </div>
                  <div className="text-center md:text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Certainty</span>
                    <div className="flex items-baseline gap-1 justify-center md:justify-end">
                      <span className={`text-4xl md:text-5xl font-black font-heading ${selectedReview.is_fake ? "text-red-600" : "text-emerald-600"}`}>{selectedReview.confidence}</span>
                      <span className="text-base md:text-xl font-bold text-gray-400">%</span>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3 md:mb-4 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                    <h4 className="text-[10px] md:text-[11px] font-black text-gray-900 uppercase tracking-widest">Original Text</h4>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem]">
                    <p className="text-sm md:text-base text-gray-700 italic font-medium leading-relaxed">"{selectedReview.original_text}"</p>
                  </div>
                </div>

                {/* Sub-panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* AI Detector */}
                  {selectedReview.ai_detection && (
                    <div className="bg-white border-2 border-purple-50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm">
                      <h5 className="text-[9px] md:text-[10px] font-black text-purple-600 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">AI Signature Detect</h5>
                      <div className="flex justify-between items-end mb-2 md:mb-3">
                        <span className="text-[11px] md:text-sm font-bold text-gray-700">{selectedReview.ai_detection.summary}</span>
                        <span className="text-lg md:text-xl font-black text-purple-600 font-mono">{selectedReview.ai_detection.ai_probability}%</span>
                      </div>
                      <Progress value={selectedReview.ai_detection.ai_probability} className="h-2 bg-purple-50 [&>div]:bg-gradient-to-r [&>div]:from-purple-400 [&>div]:to-purple-600" />
                    </div>
                  )}

                  {/* Sentiment Analyzer */}
                  {selectedReview.sentiment_analysis && (
                    <div className="bg-white border-2 border-amber-50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm">
                      <h5 className="text-[9px] md:text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">Sentiment Consistency</h5>
                      <div className="flex justify-between items-end mb-2 md:mb-3">
                        <span className="text-[11px] md:text-sm font-bold text-gray-700">{selectedReview.sentiment_analysis.sentiment_label?.toUpperCase()}</span>
                        <span className="text-lg md:text-xl font-black text-amber-600 font-mono">{selectedReview.sentiment_analysis.sentiment_score?.toFixed(1)}</span>
                      </div>
                      <div className="h-2 w-full bg-amber-50 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${((selectedReview.sentiment_analysis.sentiment_score + 1) / 2) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Specs Table */}
                <div className="bg-gray-900 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-white shadow-2xl overflow-hidden shrink-0">
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Author</p>
                    <p className="text-[10px] md:text-sm font-black truncate">{selectedReview.author || 'ANONYMOUS'}</p>
                  </div>
                  <div className="space-y-1 border-gray-800 border-l pl-3 md:pl-6">
                    <p className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Rating</p>
                    <p className="text-[10px] md:text-sm font-black">{selectedReview.rating || 'N/A'} ★</p>
                  </div>
                  <div className="space-y-1 border-gray-800 border-t md:border-t-0 md:border-l pt-3 md:pt-0 pl-0 md:pl-6 col-span-2 md:col-span-1">
                    <p className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Platform</p>
                    <p className="text-[10px] md:text-sm font-black truncate">{selectedReview.source || 'CSV_UPLOAD'}</p>
                  </div>
                  <div className="space-y-1 border-gray-800 border-l border-t md:border-t-0 pt-3 md:pt-0 pl-3 md:pl-6 hidden md:block">
                    <p className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Model</p>
                    <p className="text-[10px] md:text-sm font-black truncate">{selectedReview.model_used?.toUpperCase() || 'RF_ML'}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="p-4 md:p-6 border-t border-gray-100 bg-white flex justify-center flex-shrink-0 z-10">
              <Button onClick={() => setDetailsOpen(false)} className="rounded-xl md:rounded-2xl px-8 md:px-12 py-5 md:py-6 font-heading font-black text-[10px] md:text-xs uppercase tracking-widest bg-gray-900 text-white hover:bg-black transition-all shadow-xl">Close Report</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BulkAnalysisPage;
