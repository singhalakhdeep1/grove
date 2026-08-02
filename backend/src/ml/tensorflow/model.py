# TensorFlow model for grove

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np

class RecommendationModel:
    def __init__(self, num_users, num_items, embedding_dim=64):
        self.num_users = num_users
        self.num_items = num_items
        self.embedding_dim = embedding_dim
        self.model = self._build_model()

    def _build_model(self):
        user_input = keras.Input(shape=(1,), name='user_id')
        item_input = keras.Input(shape=(1,), name='item_id')

        user_embedding = layers.Embedding(
            input_dim=self.num_users,
            output_dim=self.embedding_dim,
            name='user_embedding'
        )(user_input)
        user_embedding = layers.Flatten()(user_embedding)

        item_embedding = layers.Embedding(
            input_dim=self.num_items,
            output_dim=self.embedding_dim,
            name='item_embedding'
        )(item_input)
        item_embedding = layers.Flatten()(item_embedding)

        concat = layers.Concatenate()([user_embedding, item_embedding])
        dense1 = layers.Dense(128, activation='relu')(concat)
        dense2 = layers.Dense(64, activation='relu')(dense1)
        output = layers.Dense(1, activation='sigmoid')(dense2)

        model = keras.Model(
            inputs=[user_input, item_input],
            outputs=output,
            name='recommendation_model'
        )

        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy']
        )

        return model

    def train(self, user_ids, item_ids, labels, epochs=10, batch_size=32):
        history = self.model.fit(
            [user_ids, item_ids],
            labels,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=1
        )
        return history

    def predict(self, user_id, item_ids):
        user_ids = np.full(len(item_ids), user_id)
        predictions = self.model.predict([user_ids, item_ids])
        return predictions.flatten()

    def save(self, path):
        self.model.save(path)

    def load(self, path):
        self.model = keras.models.load_model(path)
