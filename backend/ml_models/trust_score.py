"""
Trust Score Computation Module
Aggregates all analysis signals into a single 0-100 trust score.

Signals used:
  - Fake review percentage / probability
  - AI-generated text probability
  - Sentiment-rating mismatch severity
  - Suspicious indicator count
  - Model confidence

Higher score = more trustworthy.
"""
import logging

logger = logging.getLogger(__name__)


def compute_single_review_trust(result: dict) -> dict:
    """
    Compute a trust score for a single review from all analysis signals.
    
    Args:
        result: dict with keys from predictor.predict() output:
            - confidence, is_fake, fake_probability
            - ai_detection: {ai_probability, is_ai_generated, ...}
            - sentiment_analysis: {rating_mismatch, mismatch_severity, ...}
            - indicators: [...]
    
    Returns:
        dict with trust_score (0-100), breakdown, and grade
    """
    score = 100.0
    breakdown = []

    # --- 1. Fake Detection Penalty (up to -50) ---
    is_fake = result.get('is_fake', False)
    fake_prob = result.get('fake_probability', 0)
    confidence = result.get('confidence', 50)

    if is_fake:
        # Penalty proportional to confidence
        penalty = min(50, (confidence / 100) * 50)
        score -= penalty
        breakdown.append({
            'signal': 'Fake Review Detection',
            'impact': round(-penalty, 1),
            'detail': f'Detected as fake with {confidence:.0f}% confidence'
        })
    else:
        breakdown.append({
            'signal': 'Fake Review Detection',
            'impact': 0,
            'detail': f'Classified as genuine ({confidence:.0f}% confidence)'
        })

    # --- 2. AI-Generated Text Penalty (up to -20) ---
    ai_detection = result.get('ai_detection') or {}
    ai_prob = ai_detection.get('ai_probability', 0)

    if ai_prob > 30:
        penalty = min(20, (ai_prob / 100) * 20)
        score -= penalty
        breakdown.append({
            'signal': 'AI-Generated Detection',
            'impact': round(-penalty, 1),
            'detail': f'{ai_prob}% probability of AI-generated text'
        })
    else:
        breakdown.append({
            'signal': 'AI-Generated Detection',
            'impact': 0,
            'detail': 'Text appears human-written'
        })

    # --- 3. Sentiment Mismatch Penalty (up to -15) ---
    sentiment = result.get('sentiment_analysis') or {}
    mismatch = sentiment.get('rating_mismatch', False)
    severity = sentiment.get('mismatch_severity', 'none')

    if mismatch:
        if severity == 'strong':
            penalty = 15
        else:
            penalty = 7
        score -= penalty
        breakdown.append({
            'signal': 'Sentiment-Rating Consistency',
            'impact': round(-penalty, 1),
            'detail': sentiment.get('mismatch_detail', 'Sentiment does not match rating')
        })
    else:
        breakdown.append({
            'signal': 'Sentiment-Rating Consistency',
            'impact': 0,
            'detail': 'Text sentiment matches the rating'
        })

    # --- 4. Suspicious Indicators Penalty (up to -15) ---
    indicators = result.get('indicators', [])
    high_indicators = [i for i in indicators if i.get('severity') == 'high']
    med_indicators = [i for i in indicators if i.get('severity') == 'medium']

    indicator_penalty = len(high_indicators) * 5 + len(med_indicators) * 2
    indicator_penalty = min(15, indicator_penalty)

    if indicator_penalty > 0:
        score -= indicator_penalty
        breakdown.append({
            'signal': 'Suspicious Indicators',
            'impact': round(-indicator_penalty, 1),
            'detail': f'{len(high_indicators)} high + {len(med_indicators)} medium severity indicators'
        })
    else:
        breakdown.append({
            'signal': 'Suspicious Indicators',
            'impact': 0,
            'detail': 'No suspicious patterns detected'
        })

    # Clamp
    score = max(0, min(100, score))

    return {
        'trust_score': round(score, 1),
        'grade': _get_grade(score),
        'breakdown': breakdown
    }


def compute_product_trust(reviews_data: list, fake_count: int, genuine_count: int) -> dict:
    """
    Compute an aggregated trust score for a product from all its reviews.
    
    Args:
        reviews_data: list of dicts, each with ai_detection, sentiment_analysis, is_fake, confidence
        fake_count: number of fake reviews
        genuine_count: number of genuine reviews
    
    Returns:
        dict with trust_score, grade, breakdown, and summary
    """
    total = len(reviews_data)
    if total == 0:
        return {
            'trust_score': 50,
            'grade': 'C',
            'breakdown': [],
            'summary': 'No reviews to analyze'
        }

    score = 100.0
    breakdown = []

    # --- 1. Fake Review Ratio (up to -40) ---
    fake_ratio = fake_count / total
    penalty = fake_ratio * 40
    score -= penalty
    breakdown.append({
        'signal': 'Fake Review Ratio',
        'impact': round(-penalty, 1),
        'detail': f'{fake_count}/{total} reviews ({fake_ratio*100:.0f}%) detected as fake'
    })

    # --- 2. AI-Generated Review Ratio (up to -20) ---
    ai_reviews = sum(1 for r in reviews_data
                     if r.get('ai_detection') and r['ai_detection'].get('ai_probability', 0) >= 50)
    ai_ratio = ai_reviews / total
    penalty = ai_ratio * 20
    score -= penalty
    breakdown.append({
        'signal': 'AI-Generated Reviews',
        'impact': round(-penalty, 1),
        'detail': f'{ai_reviews}/{total} reviews likely AI-generated'
    })

    # --- 3. Sentiment Mismatch Ratio (up to -20) ---
    mismatch_reviews = sum(1 for r in reviews_data
                          if r.get('sentiment_analysis') and r['sentiment_analysis'].get('rating_mismatch', False))
    strong_mismatches = sum(1 for r in reviews_data
                           if r.get('sentiment_analysis') and r['sentiment_analysis'].get('mismatch_severity') == 'strong')
    mismatch_ratio = mismatch_reviews / total
    penalty = mismatch_ratio * 15 + (strong_mismatches / total) * 5
    penalty = min(20, penalty)
    score -= penalty
    breakdown.append({
        'signal': 'Sentiment Consistency',
        'impact': round(-penalty, 1),
        'detail': f'{mismatch_reviews} reviews with rating-sentiment mismatch ({strong_mismatches} strong)'
    })

    # --- 4. Confidence Consistency Bonus (up to -10) ---
    avg_confidence = sum(r.get('confidence', 50) for r in reviews_data) / total
    # Low average confidence = uncertain predictions = slight penalty
    if avg_confidence < 60:
        penalty = (60 - avg_confidence) / 60 * 10
        score -= penalty
        breakdown.append({
            'signal': 'Model Confidence',
            'impact': round(-penalty, 1),
            'detail': f'Average prediction confidence is {avg_confidence:.0f}%'
        })
    else:
        breakdown.append({
            'signal': 'Model Confidence',
            'impact': 0,
            'detail': f'Strong prediction confidence ({avg_confidence:.0f}% average)'
        })

    # Clamp
    score = max(0, min(100, score))
    grade = _get_grade(score)

    return {
        'trust_score': round(score, 1),
        'grade': grade,
        'breakdown': breakdown,
        'summary': _get_summary(score, grade, fake_count, total)
    }


def _get_grade(score: float) -> str:
    if score >= 90:
        return 'A+'
    elif score >= 80:
        return 'A'
    elif score >= 70:
        return 'B'
    elif score >= 60:
        return 'C'
    elif score >= 45:
        return 'D'
    else:
        return 'F'


def _get_summary(score: float, grade: str, fake_count: int, total: int) -> str:
    if score >= 85:
        return f'This product has highly trustworthy reviews. Only {fake_count} out of {total} reviews appear suspicious.'
    elif score >= 70:
        return f'Reviews are mostly trustworthy with some concerns. {fake_count} out of {total} reviews flagged.'
    elif score >= 55:
        return f'Mixed trustworthiness — a significant portion of reviews may be unreliable.'
    else:
        return f'Low trust — {fake_count} out of {total} reviews appear fake. Exercise caution.'
