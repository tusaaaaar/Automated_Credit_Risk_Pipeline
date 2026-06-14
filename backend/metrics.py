"""Evaluation metrics for the Credit Risk Dashboard."""

from __future__ import annotations

from typing import Any, Sequence, TypedDict

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    cohen_kappa_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)

POSITIVE_LABEL = 1


class MetricsError(Exception):
    """Raised when metric inputs are invalid or computation fails."""


class MetricsResult(TypedDict):
    """Classification and ranking metrics for a credit-risk model."""

    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc: float
    gini: float
    kappa: float


class ConfusionMatrixResult(TypedDict):
    """Confusion-matrix counts for binary default classification."""

    tn: int
    fp: int
    fn: int
    tp: int


class ROCDataResult(TypedDict):
    """ROC curve coordinates for dashboard plotting."""

    fpr: list[float]
    tpr: list[float]
    thresholds: list[float]


class ModelSummaryResult(TypedDict):
    """Combined metrics and confusion-matrix values for dashboard KPI cards."""

    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc: float
    gini: float
    kappa: float
    tn: int
    fp: int
    fn: int
    tp: int


METRICS_RESULT_KEYS: tuple[str, ...] = (
    "accuracy",
    "precision",
    "recall",
    "f1_score",
    "auc",
    "gini",
    "kappa",
)
CONFUSION_MATRIX_RESULT_KEYS: tuple[str, ...] = ("tn", "fp", "fn", "tp")

ArrayLike = Sequence[Any] | np.ndarray | pd.Series


class CreditRiskMetrics:
    """Compute classification and ranking metrics for credit-risk models."""

    def calculate_metrics(
        self,
        y_true: ArrayLike,
        y_pred: ArrayLike,
        y_prob: ArrayLike,
    ) -> MetricsResult:
        """
        Calculate standard performance metrics for binary default prediction.

        Args:
            y_true: Ground-truth labels (0 = no default, 1 = default).
            y_pred: Predicted class labels.
            y_prob: Predicted probability of the positive (default) class.

        Returns:
            A dictionary containing ``accuracy``, ``precision``, ``recall``,
            ``f1_score``, ``auc``, ``gini`` (where ``gini = (2 * auc) - 1``),
            and ``kappa`` (Cohen's Kappa Statistic).

        Raises:
            MetricsError: If inputs are empty, lengths differ, or computation
                fails.
        """
        true_labels, predicted_labels, predicted_probabilities = self._validate_triplet(
            y_true,
            y_pred,
            y_prob,
            names=("y_true", "y_pred", "y_prob"),
        )

        try:
            accuracy = float(accuracy_score(true_labels, predicted_labels))
            precision = float(
                precision_score(
                    true_labels,
                    predicted_labels,
                    pos_label=POSITIVE_LABEL,
                    zero_division=0,
                )
            )
            recall = float(
                recall_score(
                    true_labels,
                    predicted_labels,
                    pos_label=POSITIVE_LABEL,
                    zero_division=0,
                )
            )
            f1 = float(
                f1_score(
                    true_labels,
                    predicted_labels,
                    pos_label=POSITIVE_LABEL,
                    zero_division=0,
                )
            )
            auc = float(roc_auc_score(true_labels, predicted_probabilities))
            gini = float((2.0 * auc) - 1.0)
            kappa = float(cohen_kappa_score(true_labels, predicted_labels))
        except Exception as exc:
            raise MetricsError("Failed to calculate performance metrics.") from exc

        return {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "auc": auc,
            "gini": gini,
            "kappa": kappa,
        }

    def get_confusion_matrix(
        self,
        y_true: ArrayLike,
        y_pred: ArrayLike,
    ) -> ConfusionMatrixResult:
        """
        Compute confusion-matrix counts for binary predictions.

        Args:
            y_true: Ground-truth labels.
            y_pred: Predicted class labels.

        Returns:
            A dictionary with keys ``tn``, ``fp``, ``fn``, and ``tp``.

        Raises:
            MetricsError: If inputs are empty, lengths differ, or computation
                fails.
        """
        true_labels, predicted_labels = self._validate_pair(
            y_true,
            y_pred,
            names=("y_true", "y_pred"),
        )

        try:
            matrix = confusion_matrix(
                true_labels,
                predicted_labels,
                labels=[0, POSITIVE_LABEL],
            )
            tn, fp, fn, tp = (int(value) for value in matrix.ravel())
        except Exception as exc:
            raise MetricsError("Failed to calculate confusion matrix.") from exc

        return {
            "tn": tn,
            "fp": fp,
            "fn": fn,
            "tp": tp,
        }

    def get_roc_data(
        self,
        y_true: ArrayLike,
        y_prob: ArrayLike,
    ) -> ROCDataResult:
        """
        Generate ROC curve data for visualization.

        Args:
            y_true: Ground-truth labels.
            y_prob: Predicted probability of the positive (default) class.

        Returns:
            A dictionary with ``fpr``, ``tpr``, and ``thresholds`` as lists.

        Raises:
            MetricsError: If inputs are empty, lengths differ, or computation
                fails.
        """
        true_labels, predicted_probabilities = self._validate_pair(
            y_true,
            y_prob,
            names=("y_true", "y_prob"),
        )

        try:
            fpr, tpr, thresholds = roc_curve(true_labels, predicted_probabilities)
        except Exception as exc:
            raise MetricsError("Failed to calculate ROC curve data.") from exc

        clean_thresholds = np.where(
            np.isinf(thresholds),
            -1.0,
            thresholds,
        )

        return {
            "fpr": np.asarray(fpr, dtype=float).tolist(),
            "tpr": np.asarray(tpr, dtype=float).tolist(),
            "thresholds": np.asarray(clean_thresholds, dtype=float).tolist(),
        }

    def get_model_summary(
        self,
        metrics_result: MetricsResult | dict[str, Any],
        confusion_matrix_result: ConfusionMatrixResult | dict[str, Any],
    ) -> ModelSummaryResult:
        """
        Combine classification metrics and confusion-matrix counts for KPI cards.

        Args:
            metrics_result: Output from :meth:`calculate_metrics`.
            confusion_matrix_result: Output from :meth:`get_confusion_matrix`.

        Returns:
            A single dictionary containing all dashboard KPI fields.

        Raises:
            MetricsError: If either input is invalid or missing required keys.
        """
        validated_metrics = self._validate_result_dict(
            metrics_result,
            required_keys=METRICS_RESULT_KEYS,
            name="metrics_result",
        )
        validated_confusion_matrix = self._validate_result_dict(
            confusion_matrix_result,
            required_keys=CONFUSION_MATRIX_RESULT_KEYS,
            name="confusion_matrix_result",
        )

        return {
            "accuracy": float(validated_metrics["accuracy"]),
            "precision": float(validated_metrics["precision"]),
            "recall": float(validated_metrics["recall"]),
            "f1_score": float(validated_metrics["f1_score"]),
            "auc": float(validated_metrics["auc"]),
            "gini": float(validated_metrics["gini"]),
            "kappa": float(validated_metrics["kappa"]),
            "tn": int(validated_confusion_matrix["tn"]),
            "fp": int(validated_confusion_matrix["fp"]),
            "fn": int(validated_confusion_matrix["fn"]),
            "tp": int(validated_confusion_matrix["tp"]),
        }

    @staticmethod
    def _validate_result_dict(
        result: dict[str, Any],
        *,
        required_keys: tuple[str, ...],
        name: str,
    ) -> dict[str, Any]:
        """Ensure a result dictionary exposes all required keys."""
        if not isinstance(result, dict):
            raise MetricsError(
                f"{name} must be a dictionary, got {type(result).__name__}."
            )

        missing_keys = [key for key in required_keys if key not in result]
        if missing_keys:
            raise MetricsError(
                f"{name} is missing required keys: {missing_keys}."
            )

        return result

    @staticmethod
    def _to_numpy_array(values: ArrayLike, name: str) -> np.ndarray:
        """Convert supported array-like inputs to a 1D numpy array."""
        if isinstance(values, pd.Series):
            array = values.to_numpy()
        else:
            array = np.asarray(values)

        if array.ndim != 1:
            raise MetricsError(f"{name} must be a 1D array-like input.")

        return array

    @classmethod
    def _validate_pair(
        cls,
        first: ArrayLike,
        second: ArrayLike,
        *,
        names: tuple[str, str],
    ) -> tuple[np.ndarray, np.ndarray]:
        """Validate two equally sized, non-empty inputs."""
        first_array = cls._to_numpy_array(first, names[0])
        second_array = cls._to_numpy_array(second, names[1])

        if first_array.size == 0:
            raise MetricsError(f"{names[0]} must not be empty.")

        if first_array.shape[0] != second_array.shape[0]:
            raise MetricsError(
                f"{names[0]} and {names[1]} must have the same length; "
                f"got {first_array.shape[0]} and {second_array.shape[0]}."
            )

        return first_array, second_array

    @classmethod
    def _validate_triplet(
        cls,
        y_true: ArrayLike,
        y_pred: ArrayLike,
        y_prob: ArrayLike,
        *,
        names: tuple[str, str, str],
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Validate three equally sized, non-empty inputs."""
        true_labels, predicted_labels = cls._validate_pair(
            y_true,
            y_pred,
            names=(names[0], names[1]),
        )
        predicted_probabilities = cls._to_numpy_array(y_prob, names[2])

        if predicted_probabilities.size == 0:
            raise MetricsError(f"{names[2]} must not be empty.")

        if true_labels.shape[0] != predicted_probabilities.shape[0]:
            raise MetricsError(
                f"{names[0]} and {names[2]} must have the same length; "
                f"got {true_labels.shape[0]} and {predicted_probabilities.shape[0]}."
            )

        return true_labels, predicted_labels, predicted_probabilities