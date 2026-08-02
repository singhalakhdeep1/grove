# Grove - Implementation

## Overview
This document describes the ML framework integrations added to Grove.

## Technologies Added

### 1. TensorFlow
- Neural collaborative filtering model
- User and item embeddings
- Dense layers for prediction
- Training with validation
- Model save/load

### 2. scikit-learn
- Multiple model types (Random Forest, Gradient Boosting, Logistic Regression)
- Train/test split
- Metrics calculation (accuracy, precision, recall, F1)
- Feature importance extraction
- Prediction and probability prediction

### 3. LightFM
- Hybrid recommendation model
- WARP loss function
- User and item features support
- Top-k recommendations
- Evaluation metrics (precision@k, AUC)
- Model save/load

### 4. Surprise
- Multiple algorithms (KNN, SVD, NMF)
- Data loading from DataFrame
- Train/test split
- RMSE and MAE metrics
- Top-n recommendations
- Cross-validation

### 5. MLflow
- Experiment tracking
- Parameter logging
- Metric logging
- Artifact logging
- Model logging
- Best model retrieval
- Model loading

## Files Created

### ML Models
- `backend/src/ml/tensorflow/model.py` - TensorFlow recommendation model
- `backend/src/ml/sklearn/model.py` - scikit-learn model
- `backend/src/ml/lightfm/model.py` - LightFM model
- `backend/src/ml/surprise/model.py` - Surprise model

### ML Tracking
- `backend/src/ml/mlflow/tracker.py` - MLflow tracker

## Features

### TensorFlow Model
- Neural collaborative filtering architecture
- Embedding layers for users and items
- Dense layers with ReLU activation
- Sigmoid output for binary prediction
- Adam optimizer with binary cross-entropy loss
- Training with validation split
- Batch prediction for multiple items

### scikit-learn Model
- Support for Random Forest, Gradient Boosting, Logistic Regression
- Automatic train/test split (80/20)
- Comprehensive metrics (accuracy, precision, recall, F1)
- Feature importance extraction for tree-based models
- Predict and predict_proba methods

### LightFM Model
- Hybrid collaborative filtering
- WARP loss for ranking
- User and item feature support
- Top-k recommendation generation
- Precision@k and AUC evaluation
- Multi-threaded training and prediction
- Model serialization with pickle

### Surprise Model
- Support for KNN, SVD, NMF algorithms
- DataFrame-based data loading
- Rating scale configuration
- RMSE and MAE metrics
- Top-n recommendation generation
- Cross-validation support

### MLflow Tracker
- Experiment management
- Parameter and metric logging
- Artifact and model logging
- Run management
- Best model retrieval
- Model loading from runs
- Support for sklearn and TensorFlow models

## Installation Required

Add to `requirements.txt`:
```txt
tensorflow>=2.13.0
scikit-learn>=1.3.0
lightfm>=1.16
scikit-surprise>=1.1.3
mlflow>=2.7.0
```

Run:
```bash
pip install -r requirements.txt
```

## Environment Variables

```env
# MLflow
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_EXPERIMENT_NAME=grove_recommendations
```

## Notes
- All code is written but packages are not installed (per user request)
- TensorFlow requires GPU support for optimal performance
- LightFM requires compilation on some platforms
- Surprise requires pandas for data loading
- MLflow requires MLflow server for tracking
- All models support training and prediction
- MLflow supports experiment comparison and model versioning
