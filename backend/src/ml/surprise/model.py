# Surprise model for grove

from surprise import Dataset, KNNBasic, SVD, NMF
from surprise.model_selection import train_test_split, cross_validate
import pandas as pd

class SurpriseModel:
    def __init__(self, algorithm='svd'):
        self.algorithm = algorithm
        self.model = self._create_model()

    def _create_model(self):
        if self.algorithm == 'knn':
            return KNNBasic()
        elif self.algorithm == 'svd':
            return SVD()
        elif self.algorithm == 'nmf':
            return NMF()
        else:
            raise ValueError(f"Unknown algorithm: {self.algorithm}")

    def load_data(self, ratings_df):
        reader = Reader(rating_scale=(1, 5))
        data = Dataset.load_from_df(
            ratings_df[['user_id', 'item_id', 'rating']],
            reader
        )
        return data

    def train(self, data):
        trainset, testset = train_test_split(data, test_size=0.2)
        self.model.fit(trainset)
        
        predictions = self.model.test(testset)
        
        from surprise import accuracy
        metrics = {
            'rmse': accuracy.rmse(predictions),
            'mae': accuracy.mae(predictions)
        }
        return metrics

    def predict(self, user_id, item_id):
        prediction = self.model.predict(user_id, item_id)
        return prediction.est

    def get_top_n(self, predictions, n=10):
        from collections import defaultdict
        top_n = defaultdict(list)
        
        for uid, iid, true_r, est, _ in predictions:
            top_n[uid].append((iid, est))
        
        for uid, user_ratings in top_n.items():
            user_ratings.sort(key=lambda x: x[1], reverse=True)
            top_n[uid] = user_ratings[:n]
        
        return top_n

    def cross_validate(self, data, cv=5):
        results = cross_validate(
            self.model,
            data,
            measures=['RMSE', 'MAE'],
            cv=cv,
            verbose=True
        )
        return results
