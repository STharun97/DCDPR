from fpdf import FPDF
from datetime import datetime
import os

class ReportGenerator:
    def __init__(self):
        self.brand_color_genuine = (22, 163, 74) # Green
        self.brand_color_fake = (220, 38, 38)     # Red
        self.brand_color_neutral = (75, 85, 99)   # Gray
        self.brand_color_primary = (30, 58, 138)  # Blue

    def _s(self, text) -> str:
        """Sanitize text to only contain characters supported by the PDF font (latin-1)."""
        if text is None:
            return ''
        return str(text).encode('latin-1', errors='replace').decode('latin-1')

    def generate_single_report(self, data: dict) -> str:
        """
        Generates a PDF report for a single review analysis.
        Returns the filename of the generated PDF.
        """
        pdf = FPDF()
        pdf.add_page()
        
        # Header
        pdf.set_fill_color(*self.brand_color_primary)
        pdf.rect(0, 0, 210, 40, 'F')
        
        pdf.set_font('helvetica', 'B', 24)
        pdf.set_text_color(255, 255, 255)
        pdf.set_xy(10, 10)
        pdf.cell(0, 15, 'Fake Review Analysis Report', 0, 1, 'L')
        
        pdf.set_font('helvetica', 'I', 10)
        pdf.set_xy(10, 25)
        pdf.cell(0, 10, f'Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1, 'L')

        # Review Content Section
        pdf.set_y(50)
        pdf.set_text_color(0, 0, 0)
        pdf.set_font('helvetica', 'B', 14)
        pdf.cell(0, 10, 'Review Text:', 0, 1)
        pdf.set_font('helvetica', '', 10)
        # Multi-line review text
        review_text = self._s(data.get('original_text', 'N/A'))
        pdf.multi_cell(0, 5, review_text)
        
        pdf.ln(10)

        # Analysis Dashboard
        pdf.set_font('helvetica', 'B', 14)
        pdf.cell(0, 10, 'Analysis Dashboard', 0, 1)
        
        # Draw a box for the main result
        is_fake = data.get('is_fake', False)
        result_color = self.brand_color_fake if is_fake else self.brand_color_genuine
        
        pdf.set_draw_color(*result_color)
        pdf.set_line_width(1)
        pdf.rect(10, pdf.get_y(), 190, 40)
        
        content_y = pdf.get_y() + 5
        pdf.set_xy(15, content_y)
        pdf.set_font('helvetica', 'B', 12)
        pdf.set_text_color(*result_color)
        pdf.cell(50, 10, 'VERDICT:', 0, 0)
        pdf.set_font('helvetica', 'B', 16)
        pdf.cell(0, 10, self._s(data.get('prediction', 'UNKNOWN')).upper(), 0, 1)
        
        pdf.set_xy(15, pdf.get_y())
        pdf.set_font('helvetica', 'B', 12)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(50, 10, 'CONFIDENCE:', 0, 0)
        pdf.set_font('helvetica', '', 12)
        pdf.cell(0, 10, f"{data.get('confidence', 0)}%", 0, 1)

        # Trust Score Section
        trust_data = data.get('trust_score', {})
        trust_score = trust_data.get('trust_score', 0)
        grade = trust_data.get('grade', 'N/A')
        
        pdf.set_xy(140, content_y)
        pdf.set_font('helvetica', 'B', 10)
        pdf.cell(40, 5, 'TRUST SCORE', 0, 1, 'C')
        pdf.set_xy(140, pdf.get_y())
        pdf.set_font('helvetica', 'B', 24)
        pdf.set_text_color(*self._get_trust_color(trust_score))
        pdf.cell(40, 15, str(trust_score), 0, 1, 'C')
        pdf.set_xy(140, pdf.get_y())
        pdf.set_font('helvetica', 'B', 12)
        pdf.cell(40, 5, f'Grade: {grade}', 0, 1, 'C')

        pdf.set_y(content_y + 45)
        pdf.set_text_color(0, 0, 0)

        # Signals
        pdf.set_font('helvetica', 'B', 12)
        pdf.cell(0, 10, 'Detailed Signals:', 0, 1)
        
        # AI Detection
        ai_data = data.get('ai_detection', {})
        pdf.set_font('helvetica', 'B', 10)
        pdf.cell(40, 6, 'AI Content:', 0, 0)
        pdf.set_font('helvetica', '', 10)
        ai_prob = ai_data.get('ai_probability', 0)
        pdf.cell(0, 6, self._s(f"{ai_prob}% probability ({ai_data.get('summary', 'N/A')})"), 0, 1)
        
        # Sentiment
        sent_data = data.get('sentiment_analysis', {})
        pdf.set_font('helvetica', 'B', 10)
        pdf.cell(40, 6, 'Sentiment:', 0, 0)
        pdf.set_font('helvetica', '', 10)
        pdf.cell(0, 6, self._s(f"{sent_data.get('sentiment_label', 'N/A')} (Rating Mismatch: {'YES' if sent_data.get('rating_mismatch') else 'NO'})"), 0, 1)

        # Indicators
        pdf.ln(5)
        pdf.set_font('helvetica', 'B', 12)
        pdf.cell(0, 10, 'Detection Indicators:', 0, 1)
        pdf.set_font('helvetica', '', 9)
        
        indicators = data.get('indicators', [])
        if indicators:
            for ind in indicators:
                severity = ind.get('severity', 'low').upper()
                pdf.cell(10)
                pdf.set_font('helvetica', 'B', 9)
                pdf.cell(30, 5, f"[{severity}]", 0, 0)
                pdf.set_font('helvetica', '', 9)
                pdf.multi_cell(0, 5, self._s(f"{ind.get('name')}: {ind.get('description')}"))
        else:
            pdf.cell(0, 5, 'No major artifacts detected.', 0, 1)

        # Footer
        pdf.set_y(260)
        pdf.set_font('helvetica', 'I', 8)
        pdf.set_text_color(150, 150, 150)
        pdf.cell(0, 10, 'Fake Product Review Detection System - Enterprise Report', 0, 0, 'C')
        
        filename = f"report_single_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        output_path = os.path.join("temp", filename)
        os.makedirs("temp", exist_ok=True)
        pdf.output(output_path)
        return output_path

    def generate_url_report(self, data: dict) -> str:
        """
        Generates a PDF report for a product URL analysis.
        """
        pdf = FPDF()
        pdf.add_page()
        
        # Header
        pdf.set_fill_color(*self.brand_color_primary)
        pdf.rect(0, 0, 210, 40, 'F')
        
        pdf.set_font('helvetica', 'B', 20)
        pdf.set_text_color(255, 255, 255)
        pdf.set_xy(10, 10)
        pdf.cell(0, 15, 'Product Authenticity Audit', 0, 1, 'L')
        
        pdf.set_font('helvetica', 'I', 10)
        pdf.set_xy(10, 25)
        pdf.cell(0, 10, f'Audit Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1, 'L')

        # Product Info Section
        pdf.set_y(50)
        pdf.set_text_color(0, 0, 0)
        pdf.set_font('helvetica', 'B', 16)
        pdf.multi_cell(0, 8, self._s(data.get('product_title', 'Unknown Product')))
        
        pdf.set_font('helvetica', '', 10)
        pdf.cell(20, 10, 'Source:', 0, 0)
        pdf.set_font('helvetica', 'B', 10)
        pdf.cell(0, 10, self._s(data.get('source', 'Unknown')).upper(), 0, 1)
        
        pdf.ln(5)

        # Executive Summary Box
        pdf.set_font('helvetica', 'B', 14)
        pdf.cell(0, 10, 'Executive Summary', 0, 1)
        
        trust_data = data.get('trust_score', {})
        trust_score = trust_data.get('trust_score', 0)
        grade = trust_data.get('grade', 'N/A')
        
        pdf.set_draw_color(*self._get_trust_color(trust_score))
        pdf.set_line_width(1)
        pdf.rect(10, pdf.get_y(), 190, 45)
        
        start_y = pdf.get_y() + 5
        pdf.set_xy(15, start_y)
        pdf.set_font('helvetica', 'B', 12)
        pdf.cell(40, 10, 'OVERALL TRUST:', 0, 0)
        pdf.set_font('helvetica', 'B', 16)
        pdf.set_text_color(*self._get_trust_color(trust_score))
        pdf.cell(40, 10, f"{trust_score}/100 ({grade})", 0, 1)
        
        pdf.set_xy(15, pdf.get_y())
        pdf.set_font('helvetica', '', 11)
        pdf.set_text_color(0, 0, 0)
        pdf.multi_cell(110, 6, self._s(trust_data.get('summary', 'Analysis completed successfully.')))
        
        # Stats in the summary box
        pdf.set_xy(135, start_y)
        pdf.set_font('helvetica', 'B', 10)
        pdf.cell(30, 6, 'Total Reviews:', 0, 0)
        pdf.cell(0, 6, str(data.get('total_reviews', 0)), 0, 1)
        pdf.set_xy(135, pdf.get_y())
        pdf.cell(30, 6, 'Genuine Count:', 0, 0)
        pdf.set_text_color(*self.brand_color_genuine)
        pdf.cell(0, 6, str(data.get('genuine_count', 0)), 0, 1)
        pdf.set_xy(135, pdf.get_y())
        pdf.set_text_color(0, 0, 0)
        pdf.cell(30, 6, 'Fake Count:', 0, 0)
        pdf.set_text_color(*self.brand_color_fake)
        pdf.cell(0, 6, str(data.get('fake_count', 0)), 0, 1)
        
        pdf.set_text_color(0, 0, 0)
        pdf.set_y(start_y + 50)

        # Rating Adjustment
        pdf.set_font('helvetica', 'B', 14)
        pdf.cell(0, 10, 'Rating Correction', 0, 1)
        
        pdf.set_font('helvetica', '', 11)
        pdf.cell(50, 8, 'Original Platform Rating:', 0, 0)
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(30, 8, str(data.get('original_rating', 0)), 0, 1)
        
        pdf.set_font('helvetica', '', 11)
        pdf.cell(50, 8, 'Adjusted Genuineness Rating:', 0, 0)
        pdf.set_font('helvetica', 'B', 11)
        pdf.set_text_color(*self.brand_color_primary)
        pdf.cell(30, 8, str(data.get('real_adjusted_rating', 0)), 0, 1)
        pdf.set_text_color(0, 0, 0)

        # Breakdown table
        pdf.ln(10)
        pdf.set_font('helvetica', 'B', 14)
        pdf.cell(0, 10, 'Signal Breakdown', 0, 1)
        
        pdf.set_font('helvetica', 'B', 10)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(60, 10, 'Signal', 1, 0, 'C', True)
        pdf.cell(30, 10, 'Impact', 1, 0, 'C', True)
        pdf.cell(100, 10, 'Details', 1, 1, 'C', True)
        
        pdf.set_font('helvetica', '', 9)
        for b in trust_data.get('breakdown', []):
            pdf.cell(60, 8, self._s(b.get('signal', '')), 1)
            pdf.cell(30, 8, str(b.get('impact', '')), 1, 0, 'C')
            pdf.cell(100, 8, self._s(b.get('detail', '')), 1, 1)

        # Detailed Reviews Section
        pdf.add_page()
        pdf.set_font('helvetica', 'B', 14)
        pdf.cell(0, 10, 'Analyzed Reviews Highlight', 0, 1)
        
        reviews = data.get('reviews', [])[:10] # Show top 10 for brevity in report
        for i, rev in enumerate(reviews):
            pdf.set_font('helvetica', 'B', 10)
            pdf.set_fill_color(245, 245, 245)
            pdf.cell(0, 8, f"{i+1}. {rev.get('prediction', 'UNSURE')} Review", 0, 1, 'L', True)
            
            pdf.set_font('helvetica', 'I', 9)
            text = self._s(rev.get('original_text', '')[:200] + ('...' if len(rev.get('original_text', '')) > 200 else ''))
            pdf.multi_cell(0, 5, f'"{text}"')
            
            pdf.set_font('helvetica', '', 8)
            pdf.cell(30, 5, f"Confidence: {rev.get('confidence')}%", 0, 0)
            pdf.cell(30, 5, f"AI Prob: {rev.get('ai_detection', {}).get('ai_probability', 0)}%", 0, 1)
            pdf.ln(2)
            
            if pdf.get_y() > 250:
                pdf.add_page()

        # Footer
        pdf.set_y(260)
        pdf.set_font('helvetica', 'I', 8)
        pdf.set_text_color(150, 150, 150)
        pdf.cell(0, 10, 'Fake Product Review Detection System - Audit Certificate', 0, 0, 'C')
        
        filename = f"report_url_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        output_path = os.path.join("temp", filename)
        os.makedirs("temp", exist_ok=True)
        pdf.output(output_path)
        return output_path

    def _get_trust_color(self, score: float):
        if score >= 80: return self.brand_color_genuine
        if score >= 60: return (202, 138, 4) # Yellow
        if score >= 45: return (234, 88, 12) # Orange
        return self.brand_color_fake

report_generator = ReportGenerator()
