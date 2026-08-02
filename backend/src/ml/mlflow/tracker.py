# MLflow tracker for grove

import mlflow
import mlflow.sklearn
import mlflow.tensorflow
import numpy as np
from typing import Dict, Any

class MLflowTracker:
    def __init__(self, tracking_uri=None, experiment_name='grove_recommendations'):
        if tracking_uri:
            mlflow.set_tracking_uri(tracking_uri)
        
        self.experiment_name = experiment_name
        self._ensure_experiment()

    def _ensure_experiment(self):
        try:
            mlflow.create_experiment(self.experiment_name)
        except:
            pass
        mlflow.set_experiment(self.experiment_name)

    def log_params(self, params: Dict[str, Any]):
        mlflow.log_params(params)

    def log_metrics(self, metrics: Dict[str, float], step=None):
        mlflow.log_metrics(metrics, step=step)

    def log_artifact(self, file_path: str):
        mlflow.log_artifact(file_path)

    def log_model(self, model, model_type='sklearn'):
        if model_type == 'sklearn':
            mlflow.sklearn.log_model(model, 'model')
        elif model_type == 'tensorflow':
            mlflow.tensorflow.log_model(model, 'model')

    def start_run(self, run_name=None):
        return mlflow.start_run(run_name=run_name)

    def end_run(self):
        mlflow.end_run()

    def log_training_run(self, model, params, metrics, artifacts=None):
        with self.start_run() as run:
            self.log_params(params)
            self.log_metrics(metrics)
            self.log_model(model)
            
            if artifacts:
                for artifact in artifacts:
                    self.log_artifact(artifact)
            
            return run.info.run_id

    def get_best_model(self, metric_name='accuracy', order='DESC'):
        from mlflow.tracking import MlflowClient
        client = MlflowClient()
        
        experiment = client.get_experiment_by_name(self.experiment_name)
        runs = client.search_runs(
            experiment_ids=[experiment.experiment_id],
            order_by=[f"metrics.{metric_name} {order}"]
        )
        
        if runs:
            return runs[0]
        return None

    def load_model(self, run_id, model_type='sklearn'):
        if model_type == 'sklearn':
            return mlflow.sklearn.load_model(f"runs:/{run_id}/model")
        elif model_type == 'tensorflow':
            return mlflow.tensorflow.load_model(f"runs:/{run_id}/model")
