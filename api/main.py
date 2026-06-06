"""FastAPI application for the Credit Risk Dashboard."""

from __future__ import annotations

from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.pipeline import CreditRiskPipeline, PipelineError

# Application and artifact paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "models" / "credit_risk_model.pkl"
SCALER_PATH = PROJECT_ROOT / "models" / "scaler.pkl"
FEATURE_COLUMNS_PATH = PROJECT_ROOT / "models" / "feature_columns.pkl"

ALLOWED_EXTENSIONS = {".csv", ".xlsx"}

app = FastAPI(
    title="Credit Risk Dashboard API",
    description="API for credit-risk validation, prediction, and segmentation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    # allow_origins=[
    #     "http://127.0.0.1:5173",
    #     "http://localhost:5173",
    # ],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def get_pipeline() -> CreditRiskPipeline:
    """
    Return a singleton ``CreditRiskPipeline`` instance.

    The pipeline is created on first access and reused for subsequent requests.
    """
    return CreditRiskPipeline(
        model_path=MODEL_PATH,
        scaler_path=SCALER_PATH,
        feature_columns_path=FEATURE_COLUMNS_PATH,
    )


@app.get("/")
def root() -> dict[str, str]:
    """Health-check endpoint."""
    return {"message": "Credit Risk Dashboard API Running"}


@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)) -> JSONResponse:
    """
    Upload a credit-risk dataset and run the inference pipeline.

    Accepts ``.csv`` and ``.xlsx`` files. Returns validation results, optional
    model metrics (when the target column is present), and segment summary.
    """
    try:
        dataframe = await _read_uploaded_dataframe(file)
        result = get_pipeline().run(dataframe)
        response_body = _build_response(result)
        return JSONResponse(content=response_body)
    except HTTPException:
        raise
    except PipelineError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    # except Exception as exc:
    #     raise HTTPException(
    #         status_code=500,
    #         detail="An unexpected error occurred while processing the upload.",
    #     ) from exc
    except Exception as exc:
        print("ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc  

async def _read_uploaded_dataframe(file: UploadFile) -> pd.DataFrame:
    """
    Validate and parse an uploaded CSV or Excel file into a dataframe.

    Raises:
        HTTPException: With status 400 when the file is invalid or unreadable.
    """
    filename = file.filename or ""
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only CSV and XLSX files are supported.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    buffer = BytesIO(content)

    try:
        if extension == ".csv":
            dataframe = pd.read_csv(buffer)
        else:
            dataframe = pd.read_excel(buffer)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read uploaded file: {exc}",
        ) from exc

    if dataframe.empty:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file does not contain any data rows.",
        )

    return dataframe


def _build_response(result: dict[str, Any]) -> dict[str, Any]:
    """Serialize pipeline output for JSON responses."""
    segment_summary = result["segment_summary"]
    segment_summary_payload = (
        segment_summary.to_dict(orient="records")
        if isinstance(segment_summary, pd.DataFrame)
        else segment_summary
    )

    return {
    "validation_report": result["validation_report"],
    "metrics": result.get("metrics"),
    "roc_data": result.get("roc_data"),
    "segment_summary": segment_summary_payload,
    "sample_predictions": (
        result["predictions"]
        .head(20)
        .to_dict(orient="records")
    )
}
