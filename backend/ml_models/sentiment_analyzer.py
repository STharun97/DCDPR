"""
Sentiment-Rating Inconsistency Analyzer
Detects reviews where the sentiment of the text contradicts the star rating.

Example: A 5-star rating with text "Terrible, broke in a day" is highly suspicious.
Uses NLTK VADER for sentiment analysis.
"""
import logging

logger = logging.getLogger(__name__)

try:
    import nltk
    nltk.download('vader_lexicon', quiet=True)
    from nltk.sentiment import SentimentIntensityAnalyzer
    VADER_AVAILABLE = True
except ImportError:
    VADER_AVAILABLE = False
    logger.warning("NLTK VADER not available. Sentiment analysis will be disabled.")


class SentimentAnalyzer:
    """Analyze sentiment-rating consistency in reviews."""

    def __init__(self):
        self._sia = None

    def _get_sia(self):
        if self._sia is None and VADER_AVAILABLE:
            self._sia = SentimentIntensityAnalyzer()
        return self._sia

    def analyze(self, text: str, rating: int = None) -> dict:
        """
        Analyze the sentiment of review text and check for rating inconsistency.

        Args:
            text: The review text
            rating: Star rating (1-5), optional

        Returns dict with:
          - sentiment_score: compound score from -1 (negative) to 1 (positive)
          - sentiment_label: 'positive', 'negative', or 'neutral'
          - expected_rating_range: what rating the text sentiment implies
          - rating_mismatch: whether star rating contradicts sentiment
          - mismatch_severity: 'none', 'mild', 'strong'
          - mismatch_detail: explanation of the mismatch
        """
        if not VADER_AVAILABLE:
            return {
                'sentiment_score': 0,
                'sentiment_label': 'unknown',
                'expected_rating_range': None,
                'rating_mismatch': False,
                'mismatch_severity': 'none',
                'mismatch_detail': 'Sentiment analysis unavailable'
            }

        sia = self._get_sia()
        if sia is None:
            return {
                'sentiment_score': 0,
                'sentiment_label': 'unknown',
                'expected_rating_range': None,
                'rating_mismatch': False,
                'mismatch_severity': 'none',
                'mismatch_detail': 'Analyzer not initialized'
            }

        try:
            scores = sia.polarity_scores(text)
            compound = scores['compound']

            # Determine sentiment label
            if compound >= 0.05:
                sentiment_label = 'positive'
            elif compound <= -0.05:
                sentiment_label = 'negative'
            else:
                sentiment_label = 'neutral'

            # Map sentiment to expected rating range
            if compound >= 0.5:
                expected_range = '4-5 stars'
                expected_min, expected_max = 4, 5
            elif compound >= 0.05:
                expected_range = '3-4 stars'
                expected_min, expected_max = 3, 4
            elif compound >= -0.05:
                expected_range = '2-4 stars'
                expected_min, expected_max = 2, 4
            elif compound >= -0.5:
                expected_range = '2-3 stars'
                expected_min, expected_max = 2, 3
            else:
                expected_range = '1-2 stars'
                expected_min, expected_max = 1, 2

            # Check for mismatch with provided rating
            mismatch = False
            mismatch_severity = 'none'
            mismatch_detail = 'Rating matches text sentiment'

            if rating is not None and isinstance(rating, (int, float)):
                rating = int(rating)
                if rating >= 1 and rating <= 5:
                    # Strong mismatch: positive text + very low rating or negative text + very high rating
                    if compound >= 0.3 and rating <= 2:
                        mismatch = True
                        mismatch_severity = 'strong'
                        mismatch_detail = f'Positive text sentiment ({compound:+.2f}) contradicts {rating}-star rating'
                    elif compound <= -0.3 and rating >= 4:
                        mismatch = True
                        mismatch_severity = 'strong'
                        mismatch_detail = f'Negative text sentiment ({compound:+.2f}) contradicts {rating}-star rating'
                    # Mild mismatch
                    elif compound >= 0.2 and rating <= 2:
                        mismatch = True
                        mismatch_severity = 'mild'
                        mismatch_detail = f'Somewhat positive text ({compound:+.2f}) with {rating}-star rating'
                    elif compound <= -0.2 and rating >= 4:
                        mismatch = True
                        mismatch_severity = 'mild'
                        mismatch_detail = f'Somewhat negative text ({compound:+.2f}) with {rating}-star rating'
                    elif compound >= 0.5 and rating == 3:
                        mismatch = True
                        mismatch_severity = 'mild'
                        mismatch_detail = f'Very positive text ({compound:+.2f}) but only {rating}-star rating'
                    elif compound <= -0.5 and rating == 3:
                        mismatch = True
                        mismatch_severity = 'mild'
                        mismatch_detail = f'Very negative text ({compound:+.2f}) but {rating}-star rating'

            return {
                'sentiment_score': round(compound, 4),
                'sentiment_label': sentiment_label,
                'sentiment_details': {
                    'positive': round(scores['pos'], 3),
                    'negative': round(scores['neg'], 3),
                    'neutral': round(scores['neu'], 3),
                },
                'expected_rating_range': expected_range,
                'rating_mismatch': mismatch,
                'mismatch_severity': mismatch_severity,
                'mismatch_detail': mismatch_detail
            }

        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {
                'sentiment_score': 0,
                'sentiment_label': 'error',
                'expected_rating_range': None,
                'rating_mismatch': False,
                'mismatch_severity': 'none',
                'mismatch_detail': f'Analysis error: {str(e)}'
            }


# Singleton
sentiment_analyzer = SentimentAnalyzer()
