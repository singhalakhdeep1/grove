# LightFM model for grove

import numpy as np
from lightfm import LightFM
from lightfm.data import Dataset
from lightfm.evaluation import precision_at_k, auc_score

class LightFMModel:
    def __init__(self, no_components=30, learning_rate=0.05, loss='warp'):
        self.no_components = no_components
        self.learning_rate = learning_rate
        self.loss = loss
        self.model = LightFM(
            no_components=no_components,
            learning_rate=learning_rate,
            loss=loss
        )
        self.dataset = Dataset()

    def fit(self, interactions, user_features=None, item_features=None, epochs=20):
        self.dataset.fit(users=interactions['user_id'], items=interactions['item_id'])
        
        (interactions_matrix, weights) = self.dataset.build_interactions(
            zip(interactions['user_id'], interactions['item_id'])
        )

        self.model.fit(
            interactions_matrix,
            user_features=user_features,
            item_features=item_features,
            epochs=epochs,
            num_threads=4
        )

        return interactions_matrix

    def recommend(self, user_id, item_ids, k=10):
        scores = self.model.predict(
            user_id,
            item_ids,
            num_threads=4
        )
        top_items = np.argsort(-scores)[:k]
        return top_items, scores[top_items]

    def evaluate(self, test_interactions, k=10):
        test_matrix, _ = self.dataset.build_interactions(
            zip(test_interactions['user_id'], test_interactions['item_id'])
        )
        
        precision = precision_at_k(self.model, test_matrix, k=k).mean()
        auc = auc_score(self.model, test_matrix).mean()
        
        return {
            'precision_at_k': precision,
            'auc': auc
        }

    def save_model(self, path):
        import pickle
        with open(path, 'wb') as f:
            pickle.dump(self.model, f)

    def load_model(self, path):
        import pickle
        with open(path, 'rb') as f:
            self.model = pickle.load(f)
