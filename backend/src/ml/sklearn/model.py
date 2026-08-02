# scikit-learn model for grove

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import numpy as np

class SklearnModel:
    def __init__(self, model_type='random_forest'):
        self.model_type = model_type
        self.model = self._create_model()

    def _create_model(self):
        if self.model_type == 'random_forest':
            return RandomForestClassifier(n_estimators=100, random_state=42)
        elif self.model_type == 'gradient_boosting':
            return GradientBoostingClassifier(n_estimators=100, random_state=42)
        elif self.model_type == 'logistic_regression':
            return LogisticRegression(random_state=42)
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")

    def train(self, X, y):
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_val)
        metrics = {
            'accuracy': accuracy_score(y_val, y_pred),
            'precision': precision_score(y_val, y_pred, average='weighted'),
            'recall': recall_score(y_val, y_pred, average='weighted'),
            'f1': f1_score(y_val, y_pred, average='weighted')
        }
        return metrics

    def predict(self, X):
        return self.model.predict(X)

    def predict_proba(self, X):
        return self.model.predict_proba(X)

    def get_feature_importance(self):
        if hasattr(self.model, 'feature_importances_'):
            return self.model.feature_importances_
        return None
