import { useRef, useState } from 'react'
import { uploadDataset } from '../services/api'

import RocChart from '../components/RocChart'
import RiskDistributionChart from '../components/RiskDistributionChart'
import ConfusionMatrix from '../components/ConfusionMatrix'
import PlaceholderCard from '../components/PlaceholderCard'
import ScoreDistributionChart from "../components/ScoreDistributionChart"

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(1)}%`
}

function formatMetric(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(3)
}

function formatCount(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString()
}

export default function Dashboard() {
  const fileInputRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // ── Threshold state ──────────────────────────────────────────────────────
  const [predictionThreshold, setPredictionThreshold] = useState(0.5)
  const [goodThreshold, setGoodThreshold] = useState(0.3)
  const [badThreshold, setBadThreshold] = useState(0.7)
  // ────────────────────────────────────────────────────────────────────────

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setErrorMessage('')
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRunAnalysis = async () => {
    if (!selectedFile) {
      setErrorMessage('Please upload a CSV or XLSX file first.')
      return
    }
    setIsAnalyzing(true)
    setErrorMessage('')
    try {
      const data = await uploadDataset(
        selectedFile,
        predictionThreshold,
        goodThreshold,
        badThreshold
      )
      setAnalysisResult(data)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to run analysis.'
      setErrorMessage(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const validationReport = analysisResult?.validation_report
  const metrics = analysisResult?.metrics
  const segmentSummary = analysisResult?.segment_summary

  const validationStatusLabel = validationReport?.validation_status ? 'Valid' : 'Invalid'
  const metricItems = [
    { key: 'auc',       label: 'AUC'       },
    { key: 'gini',      label: 'GINI'      },
    { key: 'accuracy',  label: 'Accuracy'  },
    { key: 'precision', label: 'Precision' },
    { key: 'recall',    label: 'Recall'    },
    { key: 'f1_score',  label: 'F1 Score'  },
  ]

  return (
    <main className="dashboard-main">

      {/* ── Section 1: Upload + Analysis Controls (side by side) ─────────── */}
      {!isAnalyzing && !analysisResult && (
      <div className="dashboard-row">
        {/* Upload Card */}
        <section className="card dashboard-col">
          <div className="card-header">
            <h2>Data Upload</h2>
            <p>Upload a credit portfolio file to begin analysis.</p>
          </div>

          <div className="upload-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="file-input"
            />
            <button type="button" className="btn btn-secondary" onClick={handleUploadClick}>
              Choose File
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing && <span className="spinner" aria-hidden="true" />}
              {isAnalyzing ? 'Running Analysis...' : 'Run Analysis'}
            </button>
          </div>

          {isAnalyzing && (
            <div className="loading-banner" role="status" aria-live="polite">
              <span className="spinner spinner-lg" aria-hidden="true" />
              <span>Processing dataset and generating insights...</span>
            </div>
          )}

          {errorMessage && (
            <div className="error-banner" role="alert">
              {errorMessage}
            </div>
          )}

          <p className="upload-hint">
            {selectedFile
              ? `Selected file: ${selectedFile.name}`
              : 'Supported formats: CSV, XLSX'}
          </p>
        </section>

        {/* Analysis Controls Card
        <section className="card dashboard-col">
          <div className="card-header">
            <h2>Analysis Controls</h2>
            <p>Configure thresholds before running or re-running analysis.</p>
          </div>

          <div className="summary-grid">
            <div className="summary-item">
              <label className="summary-label" htmlFor="prediction-threshold">
                Prediction Threshold
              </label>
              <input
                id="prediction-threshold"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={predictionThreshold}
                onChange={(e) => setPredictionThreshold(Number(e.target.value))}
                className="threshold-input"
              />
            </div>

            <div className="summary-item">
              <label className="summary-label" htmlFor="good-threshold">
                Good Threshold
              </label>
              <input
                id="good-threshold"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={goodThreshold}
                onChange={(e) => setGoodThreshold(Number(e.target.value))}
                className="threshold-input"
              />
            </div>

            <div className="summary-item">
              <label className="summary-label" htmlFor="bad-threshold">
                Bad Threshold
              </label>
              <input
                id="bad-threshold"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={badThreshold}
                onChange={(e) => setBadThreshold(Number(e.target.value))}
                className="threshold-input"
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || !selectedFile}
            >
              {isAnalyzing && <span className="spinner" aria-hidden="true" />}
              {isAnalyzing ? 'Running Analysis...' : 'Recalculate Results'}
            </button>
          </div>
        </section> */}

      </div>
      )}
      {/* ── End Section 1 ────────────────────────────────────────────────── */}

      {/* ── Placeholder ──────────────────────────────────────────────────── */}
      {!analysisResult && !isAnalyzing && (
        <div className="placeholder-state">
          <div className="placeholder-icon" aria-hidden="true">📊</div>
          <h2 className="placeholder-title">No analysis available</h2>
          <p className="placeholder-body">
            Upload a CSV/XLSX file and click <strong>Run Analysis</strong> to
            generate credit risk insights.
          </p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {analysisResult && (
        <>

          {/* ── Dataset Summary + Analysis Controls (side by side) ────────── */}
          <div className="dashboard-row dashboard-row--stretch">

            <section className="card dashboard-col">
              <div className="card-header">
                <h2>Dataset Summary</h2>
                <p>Overview of the uploaded dataset and validation checks.</p>
              </div>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">File Name</span>
                  <strong>{selectedFile?.name ?? 'No file selected'}</strong>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Rows</span>
                  <strong>{formatCount(validationReport?.total_rows)}</strong>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Columns</span>
                  <strong>{formatCount(validationReport?.total_columns)}</strong>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Validation Status</span>
                  <strong
                    className={
                      validationReport?.validation_status ? 'status-valid' : 'status-invalid'
                    }
                  >
                    {validationStatusLabel}
                  </strong>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Missing Values</span>
                  <strong>{formatCount(validationReport?.missing_values)}</strong>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Duplicate Rows</span>
                  <strong>{formatCount(validationReport?.duplicate_rows)}</strong>
                </div>
              </div>
            </section>

            <section className="card dashboard-col">
              <div className="card-header">
                <h2>Analysis Controls</h2>
                <p>Configure thresholds before running or re-running analysis.</p>
              </div>

              <div className="summary-grid">
                <div className="summary-item">
                  <label className="summary-label" htmlFor="prediction-threshold">
                    Prediction Threshold
                  </label>
                  <input
                    id="prediction-threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={predictionThreshold}
                    onChange={(e) => setPredictionThreshold(Number(e.target.value))}
                    className="threshold-input"
                  />
                </div>

                <div className="summary-item">
                  <label className="summary-label" htmlFor="good-threshold">
                    Good Threshold
                  </label>
                  <input
                    id="good-threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={goodThreshold}
                    onChange={(e) => setGoodThreshold(Number(e.target.value))}
                    className="threshold-input"
                  />
                </div>

                <div className="summary-item">
                  <label className="summary-label" htmlFor="bad-threshold">
                    Bad Threshold
                  </label>
                  <input
                    id="bad-threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={badThreshold}
                    onChange={(e) => setBadThreshold(Number(e.target.value))}
                    className="threshold-input"
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing || !selectedFile}
                >
                  {isAnalyzing && <span className="spinner" aria-hidden="true" />}
                  {isAnalyzing ? 'Running Analysis...' : 'Recalculate Results'}
                </button>
              </div>
            </section>

          </div>
          {/* ── End Dataset Summary + Analysis Controls ────────────────────── */}
          {/* ── Section 3: Model Metrics (full width) ────────────────────── */}
          {metrics ? (
            <section className="card">
              <div className="card-header">
                <h2>Model Metrics</h2>
                <p>Classification and ranking performance for the credit-risk model.</p>
              </div>
              <div className="metrics-grid">
                {metricItems.map((metric) => (
                  <div key={metric.key} className="metric-card">
                    <span className="metric-label">{metric.label}</span>
                    <strong className="metric-value">
                      {formatMetric(metrics[metric.key])}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="card">
              <div className="card-header">
                <h2>Model Metrics</h2>
              </div>
              <p className="metrics-empty">Target column not found. Metrics skipped.</p>
            </section>
          )}

          {/* ── Section 4: Risk Segmentation (full width) ────────────────── */}
          {segmentSummary && segmentSummary.length > 0 && (
            <section className="card">
              <div className="card-header">
                <h2>Risk Segmentation</h2>
                <p>Customer distribution across Good, Moderate, and Bad risk categories.</p>
              </div>
              <div className="segment-grid">
                {segmentSummary.map((segment) => (
                  <article
                    key={segment.risk_category}
                    className={`segment-card segment-${segment.risk_category.toLowerCase()}`}
                  >
                    <div className="segment-card-header">
                      <h3>{segment.risk_category}</h3>
                      <span className="segment-pill">
                        {formatPercent(segment.percentage)}
                      </span>
                    </div>
                    <p className="segment-count">
                      {formatCount(segment.customer_count)} customers
                    </p>
                    <p className="segment-pd">
                      Avg. PD: {formatMetric(segment.average_pd)}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ── Section 5: ROC Curve + Confusion Matrix (side by side) ───── */}
          <div className="dashboard-row dashboard-row--stretch">

            {analysisResult?.roc_data ? (
              <section className="chart-card dashboard-col">
                <h2 className="chart-title">ROC Curve</h2>
                <RocChart
                  rocData={analysisResult.roc_data}
                  auc={analysisResult.metrics?.auc}
                />
              </section>
            ) : (
              <div className="dashboard-col">
                <PlaceholderCard title="ROC Curve" />
              </div>
            )}

            {analysisResult?.confusion_matrix ? (
              <div className="dashboard-col">
                <ConfusionMatrix
                  tn={analysisResult.confusion_matrix.tn}
                  fp={analysisResult.confusion_matrix.fp}
                  fn={analysisResult.confusion_matrix.fn}
                  tp={analysisResult.confusion_matrix.tp}
                />
              </div>
            ) : (
              <div className="dashboard-col">
                <PlaceholderCard title="Confusion Matrix" />
              </div>
            )}

          </div>
          {/* ── End Section 5 ──────────────────────────────────────────────── */}

          {/* ── Section 6: Risk Distribution + Score Distribution (side by side) */}
          <div className="dashboard-row dashboard-row--stretch">

            {segmentSummary && segmentSummary.length > 0 ? (
              <div className="dashboard-col">
                <RiskDistributionChart segmentSummary={segmentSummary} />
              </div>
            ) : (
              <div className="dashboard-col">
                <PlaceholderCard title="Risk Distribution" />
              </div>
            )}

            <div className="dashboard-col">
              <ScoreDistributionChart pdValues={analysisResult?.pd_values || []} />
            </div>
          </div>
          {/* ── End Section 6 ──────────────────────────────────────────────── */}

          {/* ── Section 7: PD Distribution + Risk Gauge (side by side) ────── */}
          <div className="dashboard-row dashboard-row--stretch">
            <div className="dashboard-col">
              <PlaceholderCard title="PD Distribution" />
            </div>
            <div className="dashboard-col">
              <PlaceholderCard title="Risk Gauge" />
            </div>
          </div>
          {/* ── End Section 7 ──────────────────────────────────────────────── */}

        </>
      )}
    </main>
  )
}