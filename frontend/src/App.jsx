import { useRef, useState } from 'react'
import { uploadDataset } from './services/api'

import RocChart from './components/RocChart'
import './App.css'

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—'
  }
  return `${Number(value).toFixed(1)}%`
}

function formatMetric(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—'
  }
  return Number(value).toFixed(3)
}

function formatCount(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—'
  }
  return Number(value).toLocaleString()
}

function App() {
  const fileInputRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
      const data = await uploadDataset(selectedFile)
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
    { key: 'auc', label: 'AUC' },
    { key: 'gini', label: 'GINI' },
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'precision', label: 'Precision' },
    { key: 'recall', label: 'Recall' },
    { key: 'f1_score', label: 'F1 Score' },
  ]

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <p className="header-eyebrow">Enterprise Credit Intelligence</p>
            <h1>Credit Risk Analytics Dashboard</h1>
            <p className="header-subtitle">
              Monitor portfolio risk, model performance, and customer segmentation
              in one place.
            </p>
          </div>
          <div className="header-badge">Live Preview</div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="card upload-card">
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

        {analysisResult && (
          <>
            <section className="card">
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
              {/* ROC Curve Section */}
              {analysisResult?.roc_data && (
                <section className="chart-card">
                  <h2 className="chart-title">ROC Curve</h2>
                  <RocChart
                    rocData={analysisResult.roc_data}
                    auc={analysisResult.metrics?.auc}
                  />
                </section>
              )}
            {/* End of ROC Curve Section */}
          </>
        )}
      </main>
    </div>
  )
}

export default App