import { useRef, useState } from 'react'
import { uploadDataset } from '../services/api'

import RocChart from '../components/RocChart'
import RiskDistributionChart from '../components/RiskDistributionChart'
import ConfusionMatrix from '../components/ConfusionMatrix'
import PlaceholderCard from '../components/PlaceholderCard'

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

function getPortfolioHealth(badPct) {
  if (badPct == null || Number.isNaN(Number(badPct))) return { label: '—', cls: '' }
  const pct = Number(badPct)
  if (pct < 5)   return { label: 'Good',     cls: 'status-valid'    }
  if (pct <= 15) return { label: 'Moderate', cls: 'status-moderate' }
  return               { label: 'High',     cls: 'status-invalid'  }
}

function getMetricBadge(key, value) {
  if (value == null || Number.isNaN(Number(value))) return null
  const v = Number(value)

  const rules = {
    auc: [
      { threshold: 0.8, label: 'Excellent', cls: 'badge-excellent' },
      { threshold: 0.7, label: 'Good',      cls: 'badge-good'      },
      { threshold: 0.6, label: 'Fair',      cls: 'badge-fair'      },
      { threshold: -Infinity, label: 'Poor', cls: 'badge-poor'     },
    ],
    gini: [
      { threshold: 0.6, label: 'Excellent', cls: 'badge-excellent' },
      { threshold: 0.4, label: 'Good',      cls: 'badge-good'      },
      { threshold: 0.2, label: 'Fair',      cls: 'badge-fair'      },
      { threshold: -Infinity, label: 'Poor', cls: 'badge-poor'     },
    ],
    kappa: [
      { threshold: 0.6, label: 'Strong',   cls: 'badge-excellent' },
      { threshold: 0.4, label: 'Moderate', cls: 'badge-good'      },
      { threshold: 0.2, label: 'Fair',     cls: 'badge-fair'      },
      { threshold: -Infinity, label: 'Weak', cls: 'badge-poor'    },
    ],
    accuracy: [
      { threshold: 0.8, label: 'Good', cls: 'badge-good' },
      { threshold: -Infinity, label: 'Fair', cls: 'badge-fair' },
    ],
  }

  const tiers = rules[key]
  if (!tiers) return null

  const match = tiers.find(t => v >= t.threshold)
  return match ?? null
}

export default function Dashboard({ analysisResult, setAnalysisResult }) {
  const fileInputRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
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
  const metrics          = analysisResult?.metrics
  const segmentSummary   = analysisResult?.segment_summary

  const totalCustomers = segmentSummary?.reduce((sum, s) => sum + (s.customer_count ?? 0), 0) ?? null
  const avgPortfolioPD = segmentSummary?.length
    ? segmentSummary.reduce((sum, s) => sum + (s.average_pd ?? 0) * (s.customer_count ?? 0), 0) / (totalCustomers || 1)
    : null
  const getPct      = (cat) => segmentSummary?.find(s => s.risk_category === cat)?.percentage ?? null
  const goodPct     = getPct('Good')
  const moderatePct = getPct('Moderate')
  const badPct      = getPct('Bad')
  const health      = getPortfolioHealth(badPct)

  const validationStatusLabel = validationReport?.validation_status ? 'Valid' : 'Invalid'
  const metricItems = [
    { key: 'auc',       label: 'AUC'       },
    { key: 'gini',      label: 'GINI'      },
    { key: 'accuracy',  label: 'Accuracy'  },
    { key: 'precision', label: 'Precision' },
    { key: 'recall',    label: 'Recall'    },
    { key: 'f1_score',  label: 'F1 Score'  },
    { key: 'kappa',     label: 'Kappa'     },
  ]

  return (
    <main className="dashboard-main">

      {/* ── Upload Card (only before analysis) ───────────────────────────── */}
      {!isAnalyzing && !analysisResult && (
        <div className="dashboard-row">
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
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────────────────────── */}
      {isAnalyzing && (
        <div className="loading-banner" role="status" aria-live="polite">
          <span className="spinner spinner-lg" aria-hidden="true" />
          <span>Processing dataset and generating insights...</span>
        </div>
      )}

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

          {/* ── Portfolio Risk Summary ────────────────────────────────────── */}
          <section className="card">
            <div className="card-header">
              <h2>Portfolio Risk Summary</h2>
              <p>High-level risk indicators across the entire portfolio.</p>
            </div>
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-label">Total Customers</span>
                <strong className="metric-value">{formatCount(totalCustomers)}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">Avg. Portfolio PD</span>
                <strong className="metric-value">{formatMetric(avgPortfolioPD)}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">Good Risk %</span>
                <strong className="metric-value">{formatPercent(goodPct)}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">Moderate Risk %</span>
                <strong className="metric-value">{formatPercent(moderatePct)}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">Bad Risk %</span>
                <strong className="metric-value">{formatPercent(badPct)}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">Portfolio Health</span>
                <strong className={`metric-value ${health.cls}`}>{health.label}</strong>
              </div>
            </div>
          </section>

          {/* ── Dataset Summary + Analysis Controls (side by side) ────────── */}
          <div className="dashboard-row dashboard-row--stretch">

            {/* <section className="card dashboard-col">
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
                  <strong className={validationReport?.validation_status ? 'status-valid' : 'status-invalid'}>
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
            </section> */}

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

          {/* ── Model Metrics (full width) ────────────────────────────────── */}
          {metrics ? (
            <section className="card">
              <div className="card-header">
                <h2>Model Metrics</h2>
                <p>Classification and ranking performance for the credit-risk model.</p>
              </div>
              <div className="metrics-grid">
                {metricItems.map((metric) => {
                  const badge = getMetricBadge(metric.key, metrics[metric.key])
                  return (
                    <div key={metric.key} className="metric-card">
                      <span className="metric-label">{metric.label}</span>
                      <strong className="metric-value">
                        {formatMetric(metrics[metric.key])}
                      </strong>
                      {badge && (
                        <span className={`metric-badge ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  )
                })}
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

          {/* ── Risk Segmentation (full width) ────────────────────────────── */}
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

          {/* ── ROC Curve + Confusion Matrix (side by side) ───────────────── */}
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

          {/* ── Model Interpretation ─────────────────────────────────────────────── */}
          {metrics?.auc != null && !Number.isNaN(Number(metrics.auc)) && (() => {
            const auc = Number(metrics.auc)
            const interpretation =
              auc >= 0.8 ? {
                label: 'Excellent Discrimination',
                cls: 'badge-excellent',
                explanation: 'The model is highly effective at separating good borrowers from bad ones. It can reliably rank customers by risk, making it well-suited for automated credit decisioning and portfolio management.'
              } :
              auc >= 0.7 ? {
                label: 'Good Discrimination',
                cls: 'badge-good',
                explanation: 'The model performs well in distinguishing between low- and high-risk customers. It provides meaningful risk ranking that can support lending decisions, though some borderline cases may need manual review.'
              } :
              auc >= 0.6 ? {
                label: 'Fair Discrimination',
                cls: 'badge-fair',
                explanation: 'The model shows moderate ability to separate risk levels. It offers some predictive value but should be used alongside other credit indicators. Consider model refinement or additional features to improve performance.'
              } : {
                label: 'Weak Discrimination',
                cls: 'badge-poor',
                explanation: 'The model struggles to reliably distinguish between good and bad borrowers. Relying on it alone for credit decisions carries significant risk. A model review, feature engineering, or retraining is strongly recommended.'
              }

            return (
              <section className="card">
                <div className="card-header">
                  <h2>Model Interpretation</h2>
                  {/* <p>Business-friendly explanation of model discrimination power based on AUC.</p> */}
                </div>
                <div className="metrics-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="metric-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' }}>
                      <span className="metric-label">AUC Score</span>
                      <strong className="metric-value">{formatMetric(auc)}</strong>
                      <span className={`metric-badge ${interpretation.cls}`} style={{ alignSelf: 'flex-start' }}>
                        {interpretation.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, flex: 1, fontSize: '0.9rem', lineHeight: '1.6', opacity: 0.85 }}>
                      {interpretation.explanation}
                    </p>
                  </div>
                </div>
              </section>
            )
          })()}

          {/* ── Risk Distribution (full width) ────────────────────────────── */}
          {segmentSummary && segmentSummary.length > 0 && (
            <div className="dashboard-row">
              <div className="dashboard-col">
                <RiskDistributionChart segmentSummary={segmentSummary} />
              </div>
            </div>
          )}

        </>
      )}
    </main>
  )
}