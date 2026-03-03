"""
AI-Generated Text Detector
Detects whether a review was likely written by an AI (LLM) or a human.
Uses statistical and linguistic heuristics (no heavy transformer model needed).

Key signals:
- Perplexity-like metrics via vocabulary diversity
- Burstiness (variation in sentence length — humans are more variable)
- Repetitiveness and formulaic patterns
- Punctuation and contraction usage (AI tends to avoid contractions)
"""
import re
import math
import string
import logging
from collections import Counter

logger = logging.getLogger(__name__)


class AITextDetector:
    """Detect AI-generated reviews using linguistic heuristics."""

    # Common contractions humans use but AI often avoids
    CONTRACTIONS = [
        "i'm", "i've", "i'll", "i'd", "it's", "that's", "there's",
        "don't", "doesn't", "didn't", "can't", "couldn't", "won't",
        "wouldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't",
        "hasn't", "haven't", "hadn't", "we're", "they're", "you're",
        "we've", "they've", "you've", "he's", "she's", "let's",
    ]

    # Phrases that are statistically more common in AI-generated text
    AI_PHRASES = [
        "it is worth noting", "it's worth noting",
        "in conclusion", "overall,", "in summary",
        "i would recommend", "i highly recommend",
        "this product is", "the product is",
        "in terms of", "when it comes to",
        "that being said", "having said that",
        "all in all", "at the end of the day",
        "it provides", "it offers", "it delivers",
        "seamless", "versatile", "intuitive",
        "boasts", "elevate", "revolutionize",
        "delve", "tapestry", "landscape",
        "commendable", "noteworthy", "meticulous",
    ]

    def __init__(self):
        pass

    def detect(self, text: str) -> dict:
        """
        Analyze text and return an AI detection score.

        Returns dict with:
          - ai_probability: 0-100 score (higher = more likely AI)
          - is_ai_generated: bool
          - signals: list of detected signals
          - summary: human-readable verdict
        """
        if not text or len(text.strip()) < 20:
            return {
                'ai_probability': 0,
                'is_ai_generated': False,
                'signals': [],
                'summary': 'Text too short to analyze'
            }

        text_lower = text.lower()
        signals = []
        score = 0.0  # Accumulates evidence toward AI

        # --- 1. Contraction Analysis ---
        word_count = len(text.split())
        contraction_count = sum(1 for c in self.CONTRACTIONS if c in text_lower)
        contraction_rate = contraction_count / max(word_count, 1) * 100

        if word_count > 30 and contraction_count == 0:
            score += 15
            signals.append({
                'signal': 'no_contractions',
                'description': 'No contractions found (AI tends to write formally)',
                'weight': 'high'
            })
        elif contraction_rate > 3:
            score -= 10  # Humans use more contractions

        # --- 2. Sentence Length Burstiness ---
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        if len(sentences) >= 3:
            lengths = [len(s.split()) for s in sentences]
            mean_len = sum(lengths) / len(lengths)
            variance = sum((l - mean_len) ** 2 for l in lengths) / len(lengths)
            std_dev = math.sqrt(variance) if variance > 0 else 0
            cv = std_dev / mean_len if mean_len > 0 else 0  # Coefficient of variation

            if cv < 0.25:
                score += 12
                signals.append({
                    'signal': 'uniform_sentences',
                    'description': f'Very uniform sentence lengths (CV={cv:.2f}) — AI text is less bursty',
                    'weight': 'medium'
                })
            elif cv > 0.6:
                score -= 8  # High burstiness = more human-like

        # --- 3. AI Phrase Detection ---
        ai_phrases_found = [p for p in self.AI_PHRASES if p in text_lower]
        if len(ai_phrases_found) >= 2:
            score += 10 + (len(ai_phrases_found) - 2) * 5
            signals.append({
                'signal': 'ai_phrases',
                'description': f'AI-typical phrases detected: {", ".join(ai_phrases_found[:4])}',
                'weight': 'high'
            })
        elif len(ai_phrases_found) == 1:
            score += 5
            signals.append({
                'signal': 'ai_phrase',
                'description': f'AI-typical phrase: "{ai_phrases_found[0]}"',
                'weight': 'low'
            })

        # --- 4. Vocabulary Richness (Type-Token Ratio) ---
        words = re.findall(r'[a-z]+', text_lower)
        if len(words) >= 20:
            unique_words = set(words)
            ttr = len(unique_words) / len(words)

            if ttr > 0.75:
                score += 8
                signals.append({
                    'signal': 'high_vocabulary_diversity',
                    'description': f'Unusually high vocabulary diversity (TTR={ttr:.2f})',
                    'weight': 'medium'
                })

        # --- 5. Punctuation patterns ---
        exclamation_count = text.count('!')
        question_count = text.count('?')
        if word_count > 30 and exclamation_count == 0 and question_count == 0:
            score += 5
            signals.append({
                'signal': 'no_emphasis_punctuation',
                'description': 'No exclamation or question marks (overly neutral tone)',
                'weight': 'low'
            })

        # --- 6. Paragraph Structure ---
        paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
        if len(paragraphs) >= 3 and word_count > 80:
            score += 8
            signals.append({
                'signal': 'structured_paragraphs',
                'description': f'Well-structured with {len(paragraphs)} paragraphs (common in AI output)',
                'weight': 'medium'
            })

        # --- 7. Hedging Language ---
        hedging_words = ['however', 'although', 'nevertheless', 'furthermore',
                         'moreover', 'additionally', 'consequently']
        hedging_found = [w for w in hedging_words if w in text_lower]
        if len(hedging_found) >= 2:
            score += 10
            signals.append({
                'signal': 'academic_hedging',
                'description': f'Academic/formal hedging words: {", ".join(hedging_found)}',
                'weight': 'medium'
            })

        # --- 8. First-person check for reviews ---
        first_person = re.findall(r'\b(i|my|me|mine)\b', text_lower)
        if word_count > 30 and len(first_person) == 0:
            score += 8
            signals.append({
                'signal': 'no_first_person',
                'description': 'No first-person pronouns (unusual for a personal review)',
                'weight': 'medium'
            })

        # Clamp score to 0-100
        ai_probability = max(0, min(100, score))
        is_ai = ai_probability >= 40

        # Generate summary
        if ai_probability >= 60:
            summary = 'Highly likely AI-generated'
        elif ai_probability >= 40:
            summary = 'Possibly AI-generated'
        elif ai_probability >= 20:
            summary = 'Likely human-written'
        else:
            summary = 'Human-written'

        return {
            'ai_probability': round(ai_probability, 1),
            'is_ai_generated': is_ai,
            'signals': signals,
            'summary': summary
        }


# Singleton
ai_detector = AITextDetector()
