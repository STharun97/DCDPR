# Fake Product Review Detection System - PRD

## Original Problem Statement
Design and develop a Fake Product Review Detection System that classifies reviews as Fake or Genuine using Natural Language Processing (NLP) and Machine Learning.

## User Choices (Phase 2)
- LSTM deep learning model (faster, good accuracy)
- Bulk CSV upload with columns: review_text, product_name, rating
- Export in both CSV and JSON formats
- Kaggle Amazon Reviews dataset (6000 synthetic Amazon-style reviews)
- Emergent LLM key for integrations

## What's Been Implemented

### Phase 1 (Jan 22, 2026)
- [x] Text preprocessing pipeline (lowercasing, tokenization, stop-word removal, lemmatization)
- [x] TF-IDF Vectorizer with n-grams (1-3)
- [x] ML model training (Logistic Regression, Naive Bayes, SVM)
- [x] Auto model selection based on F1-score
- [x] Fake review indicators analysis
- [x] Full UI with Swiss design aesthetic

### Phase 2 (Jan 22, 2026) - NEW FEATURES
- [x] **LSTM Deep Learning Model**: TensorFlow/Keras bidirectional LSTM with embeddings
- [x] **Bulk CSV Upload**: Upload CSV files with up to 1000 reviews, supports product_name and rating columns
- [x] **Export Functionality**: Export predictions to CSV or JSON
- [x] **Enhanced Dataset**: 6000 Amazon-style synthetic reviews for training
- [x] **Model Selection**: Choose between auto, traditional ML, or LSTM
- [x] **Background Training**: LSTM trains in background without blocking API
- [x] **Dataset Statistics**: API endpoint for viewing training data stats

### API Endpoints (v2.0)
- POST /api/analyze - Single review analysis (model selection supported)
- POST /api/analyze/bulk - Bulk analysis via JSON
- POST /api/analyze/csv - Bulk analysis via CSV upload
- GET /api/export/csv - Export predictions to CSV
- GET /api/export/json - Export predictions to JSON
- GET /api/lstm/status - LSTM model status
- POST /api/lstm/train - Train LSTM model
- GET /api/dataset/stats - Training dataset statistics

## Architecture
```
Frontend (React)
├── Analyze Page (single review)
├── Bulk Upload Page (CSV)
├── History Page
└── Dashboard

Backend (FastAPI)
├── Traditional ML (TF-IDF + LR/NB/SVM)
├── LSTM Deep Learning
├── Text Preprocessing
└── MongoDB Storage

Training Data: 6000 Amazon-style synthetic reviews
```

## Prioritized Backlog

### P0 - Done
- [x] Core ML pipeline
- [x] LSTM model
- [x] Bulk upload
- [x] Export (CSV/JSON)

### P1 - Future
- [ ] Real Amazon/Yelp API integration
- [ ] User authentication
- [ ] API rate limiting

### P2 - Nice to Have
- [ ] Multilingual support
- [ ] Browser extension
- [ ] SHAP/LIME explainability

## Next Tasks
1. Integrate real Amazon review dataset via Kaggle API
2. Add user authentication
3. Implement API rate limiting
