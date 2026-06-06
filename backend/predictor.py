"""Model inference for the Credit Risk Dashboard."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

DEFAULT_CLASS_LABEL = 1
DEFAULT_PREDICTION_THRESHOLD = 0.50
PREDICTION_COLUMN = "prediction"
PROBABILITY_COLUMN = "probability_of_default"


class PredictorError(Exception):
    """Base exception for predictor failures."""


class ModelLoadError(PredictorError):
    """Raised when the model artifact cannot be loaded."""


class InvalidModelError(PredictorError):
    """Raised when the loaded artifact is not a valid classifier."""


class PredictionError(PredictorError):
    """Raised when inference fails."""


class InvalidThresholdError(PredictorError):
    """Raised when the prediction threshold is outside the valid range."""


class CreditRiskPredictor:
    """
    Load a persisted credit-risk model and run batch inference.

    The model artifact is expected to be a joblib-serialized classifier
    (``credit_risk_model.pkl``) that exposes ``predict_proba``.
    """

    def __init__(self, model_path: str | Path) -> None:
        """
        Initialize the predictor and load the trained model.

        Args:
            model_path: Filesystem path to the fitted classifier
                (``credit_risk_model.pkl``).

        Raises:
            ModelLoadError: If the model file is missing or cannot be loaded.
            InvalidModelError: If the loaded artifact is not a valid classifier.
        """
        self._model_path = Path(model_path)
        self.model = self._load_model(self._model_path)

    def predict(
        self,
        df: pd.DataFrame,
        prediction_threshold: float = DEFAULT_PREDICTION_THRESHOLD,
    ) -> pd.DataFrame:
        """
        Generate default predictions and probabilities for preprocessed data.

        Predictions are derived from ``probability_of_default`` using the
        supplied threshold: a sample is classified as default when its
        probability is greater than or equal to ``prediction_threshold``.

        Args:
            df: Preprocessed feature dataframe produced by
                :class:`~backend.preprocessor.CreditRiskPreprocessor`.
            prediction_threshold: Decision threshold in ``[0, 1]``. Defaults
                to ``0.50``.

        Returns:
            A dataframe with columns ``prediction`` and
            ``probability_of_default``, aligned to the input index.

        Raises:
            TypeError: If ``df`` is not a pandas DataFrame.
            InvalidThresholdError: If ``prediction_threshold`` is not in
                ``[0, 1]``.
            PredictionError: If ``predict_proba`` fails.
        """
        if not isinstance(df, pd.DataFrame):
            raise TypeError(
                f"Expected a pandas DataFrame, got {type(df).__name__}."
            )

        self._validate_threshold(prediction_threshold)

        if df.empty:
            return pd.DataFrame(
                columns=[PREDICTION_COLUMN, PROBABILITY_COLUMN],
                index=df.index,
            )

        features = np.asarray(df)

        try:
            probabilities = self.model.predict_proba(features)
        except Exception as exc:
            raise PredictionError(
                f"Failed to generate predictions using '{self._model_path}'."
            ) from exc

        default_probability = self._extract_default_probability(probabilities)
        predictions = np.where(
            default_probability >= prediction_threshold,
            DEFAULT_CLASS_LABEL,
            0,
        )

        return pd.DataFrame(
            {
                PREDICTION_COLUMN: predictions,
                PROBABILITY_COLUMN: default_probability,
            },
            index=df.index,
        )

    @staticmethod
    def _load_model(path: Path) -> Any:
        """Load and validate a fitted classifier from disk."""
        if not path.is_file():
            raise ModelLoadError(f"Model file not found: '{path}'.")

        try:
            model = joblib.load(path)
        except Exception as exc:
            raise ModelLoadError(
                f"Unable to load model from '{path}'."
            ) from exc

        if not hasattr(model, "predict_proba") or not callable(model.predict_proba):
            raise InvalidModelError(
                f"Artifact at '{path}' does not expose a callable predict_proba method."
            )

        return model

    def _extract_default_probability(self, probabilities: np.ndarray) -> np.ndarray:
        """
        Return the probability of default (positive class) for each sample.

        Uses ``model.classes_`` when available to locate the default label.
        Falls back to class index ``1`` for binary classifiers.
        """
        proba = np.asarray(probabilities)
        if proba.ndim != 2:
            raise PredictionError(
                "predict_proba must return a 2D array of shape (n_samples, n_classes)."
            )

        default_index = self._default_class_index(proba.shape[1])
        return proba[:, default_index]

    def _default_class_index(self, n_classes: int) -> int:
        """Resolve the column index that corresponds to the default class."""
        classes = getattr(self.model, "classes_", None)
        if classes is not None:
            class_labels = list(classes)
            if DEFAULT_CLASS_LABEL in class_labels:
                return class_labels.index(DEFAULT_CLASS_LABEL)

        if n_classes == 1:
            return 0

        if n_classes >= 2:
            return min(DEFAULT_CLASS_LABEL, n_classes - 1)

        raise PredictionError("Model does not expose any probability classes.")

    @staticmethod
    def _validate_threshold(prediction_threshold: float) -> None:
        """Ensure the decision threshold lies within the unit interval."""
        if not isinstance(prediction_threshold, (int, float)):
            raise InvalidThresholdError(
                "prediction_threshold must be a number between 0 and 1, "
                f"got {type(prediction_threshold).__name__}."
            )

        if not 0.0 <= float(prediction_threshold) <= 1.0:
            raise InvalidThresholdError(
                "prediction_threshold must be between 0 and 1, "
                f"got {prediction_threshold}."
            )
