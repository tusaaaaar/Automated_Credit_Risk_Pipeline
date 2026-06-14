"""End-to-end orchestration for the Credit Risk Dashboard."""

from __future__ import annotations

from pathlib import Path
from typing import Any, TypedDict

import pandas as pd

from backend.metrics import (
    ConfusionMatrixResult,
    CreditRiskMetrics,
    MetricsError,
    MetricsResult,
    ROCDataResult,
)
from backend.predictor import (
    CreditRiskPredictor,
    DEFAULT_PREDICTION_THRESHOLD,
    PredictorError,
    PROBABILITY_COLUMN,
    PREDICTION_COLUMN,
)
from backend.preprocessor import CreditRiskPreprocessor, PreprocessorError
from backend.segmentation import (
    CreditRiskSegmentation,
    DEFAULT_BAD_THRESHOLD,
    DEFAULT_GOOD_THRESHOLD,
    SegmentationError,
)
from backend.validator import ValidationResult, validate_dataset
from backend.visualizer import CreditRiskVisualizer

TARGET_COLUMN = "default.payment.next.month"
ACTUAL_DEFAULT_COLUMN = "actual_default"


class PipelineError(Exception):
    """Raised when the credit-risk pipeline fails."""


class PipelineResult(TypedDict, total=False):
    """Pipeline output consumed by the dashboard."""

    predictions: pd.DataFrame
    segmentation: pd.DataFrame
    segment_summary: pd.DataFrame
    metrics: MetricsResult
    confusion_matrix: ConfusionMatrixResult
    roc_data: ROCDataResult
    validation_report: ValidationResult


class CreditRiskPipeline:
    """
    Orchestrate validation, preprocessing, prediction, and segmentation.

    When the target column ``default.payment.next.month`` is present, the
    pipeline also computes evaluation metrics for model monitoring.
    """

    def __init__(
        self,
        model_path: str | Path,
        scaler_path: str | Path,
        feature_columns_path: str | Path,
    ) -> None:
        """
        Initialize pipeline components and load model artifacts.

        Args:
            model_path: Path to ``credit_risk_model.pkl``.
            scaler_path: Path to ``scaler.pkl``.
            feature_columns_path: Path to ``feature_columns.pkl``.

        Raises:
            PipelineError: If any artifact-backed component fails to initialize.
        """
        try:
            self.preprocessor = CreditRiskPreprocessor(
                scaler_path=scaler_path,
                feature_columns_path=feature_columns_path,
            )
            self.predictor = CreditRiskPredictor(model_path=model_path)
            self.segmentation = CreditRiskSegmentation()
            self.metrics = CreditRiskMetrics()
            self.visualizer = CreditRiskVisualizer()
        except (PreprocessorError, PredictorError) as exc:
            raise PipelineError("Failed to initialize credit-risk pipeline.") from exc

    def run(
        self,
        df: pd.DataFrame,
        prediction_threshold: float = DEFAULT_PREDICTION_THRESHOLD,
        good_threshold: float = DEFAULT_GOOD_THRESHOLD,
        bad_threshold: float = DEFAULT_BAD_THRESHOLD,
    ) -> PipelineResult:
        """
        Execute the full credit-risk inference workflow.

        Pipeline steps:
            1. Validate the input dataset
            2. Preprocess features
            3. Predict default probability and class labels
            4. Attach ground-truth labels when available
            5. Segment customers by risk category
            6. Summarize segment distribution

        When ``default.payment.next.month`` is available, the result also
        includes ``metrics``, ``confusion_matrix``, and ``roc_data``.

        Args:
            df: Raw credit-risk dataset.
            prediction_threshold: Decision threshold for binary predictions.
            good_threshold: Upper bound (exclusive) for the Good segment.
            bad_threshold: Lower bound (inclusive) for the Bad segment.

        Returns:
            A dictionary containing pipeline outputs for the dashboard.

        Raises:
            PipelineError: If validation fails or any pipeline step fails.
        """
        if not isinstance(df, pd.DataFrame):
            raise PipelineError(
                f"Input must be a pandas DataFrame, got {type(df).__name__}."
            )

        try:
            validation_result = validate_dataset(df)
            self._ensure_valid_dataset(validation_result)

            preprocessed_df = self.preprocessor.preprocess(df)

            predictions = self.predictor.predict(
                preprocessed_df,
                prediction_threshold=prediction_threshold,
            )

            # Add actual default values when target exists
            if TARGET_COLUMN in df.columns:
                predictions["actual_default"] = df[TARGET_COLUMN]

            segmentation = self.segmentation.segment_customers(
                predictions,
                good_threshold=good_threshold,
                bad_threshold=bad_threshold,
            )
            segment_summary = self.segmentation.get_segment_summary(segmentation)

            result: PipelineResult = {
                "validation_report": validation_result,
                "predictions": predictions,
                "segmentation": segmentation,
                "segment_summary": segment_summary,
            }

            if TARGET_COLUMN in df.columns:
                result.update(
                    self._calculate_evaluation_outputs(
                        df=df,
                        predictions=predictions,
                    )
                )

            return result
        except PipelineError:
            raise
        except (
            PreprocessorError,
            PredictorError,
            SegmentationError,
            MetricsError,
        ) as exc:
            raise PipelineError("Credit-risk pipeline execution failed.") from exc

    @staticmethod
    def _ensure_valid_dataset(validation_result: ValidationResult) -> None:
        """Raise when dataset validation does not pass."""
        if validation_result["validation_status"]:
            return

        raise PipelineError(
            "Dataset validation failed: "
            f"missing_columns={validation_result['missing_columns']}, "
            f"duplicate_rows={validation_result['duplicate_rows']}, "
            f"missing_values={validation_result['missing_values']}, "
            f"total_rows={validation_result['total_rows']}."
        )

    def _calculate_evaluation_outputs(
        self,
        df: pd.DataFrame,
        predictions: pd.DataFrame,
    ) -> dict[str, Any]:
        """Compute optional evaluation artifacts when ground truth is available."""
        y_true = df[TARGET_COLUMN]
        y_pred = predictions[PREDICTION_COLUMN]
        y_prob = predictions[PROBABILITY_COLUMN]

        metrics_result = self.metrics.calculate_metrics(y_true, y_pred, y_prob)
        confusion_matrix_result = self.metrics.get_confusion_matrix(y_true, y_pred)
        roc_data = self.metrics.get_roc_data(y_true, y_prob)

        return {
            "metrics": metrics_result,
            "confusion_matrix": confusion_matrix_result,
            "roc_data": roc_data,
        }