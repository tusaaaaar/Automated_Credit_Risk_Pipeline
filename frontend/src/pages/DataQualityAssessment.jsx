import { useRef, useState } from 'react'
import { uploadDataQuality } from '../services/api'

function formatCount(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString()
}

const SEVERITY_STYLES = {
  Critical: { background: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  High:     { background: '#fff7ed', color: '#c2410c', border: '#fdba74' },
  Medium:   { background: '#fefce8', color: '#a16207', border: '#fde047' },
  Low:      { background: '#f0fdf4', color: '#15803d', border: '#86efac' },
}

function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 700,
      background: s.background,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {severity}
    </span>
  )
}

export default function DataQualityAssessment() {
  const fileInputRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setErrorMessage('')
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRunAssessment = async () => {
    if (!selectedFile) {
      setErrorMessage('Please upload a CSV or XLSX file first.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await uploadDataQuality(selectedFile)
      setResult(data)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Assessment failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const report       = result?.data_quality_report
  const issueLog     = result?.issue_log     ?? []
  const recommendations = result?.recommendations ?? []

  return (
    <main className="dashboard-main">

      {/* ── Upload Section ───────────────────────────────────────────────── */}
      {!isLoading && !result && (
        <section className="card">
          <div className="card-header">
            <h2>Data Quality Assessment</h2>
            <p>Upload a credit portfolio file to assess data quality.</p>
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
              onClick={handleRunAssessment}
              disabled={isLoading}
            >
              {isLoading && <span className="spinner" aria-hidden="true" />}
              {isLoading ? 'Running Assessment...' : 'Run Assessment'}
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
      )}

      {/* ── Loading State ────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="loading-banner" role="status" aria-live="polite">
          <span className="spinner spinner-lg" aria-hidden="true" />
          <span>Running data quality assessment...</span>
        </div>
      )}

      {/* ── Placeholder ──────────────────────────────────────────────────── */}
      {!result && !isLoading && (
        <div className="placeholder-state">
          <div className="placeholder-icon" aria-hidden="true">🔍</div>
          <h2 className="placeholder-title">No assessment available</h2>
          <p className="placeholder-body">
            Upload a CSV/XLSX file and click <strong>Run Assessment</strong> to
            generate a data quality report.
          </p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {result && (
        <>

          {/* ── Data Quality Report ───────────────────────────────────────── */}
          <section className="card">
            <div className="card-header">
              <h2>Data Quality Report</h2>
              <p>Validation results for: <strong>{selectedFile?.name}</strong></p>
            </div>

            <div className="summary-grid" style={{ marginTop: '1.5rem' }}>
              <div className="summary-item">
                <span className="summary-label">Validation Status</span>
                <strong style={{
                  color: report?.validation_status ? '#15803d' : '#b91c1c',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                }}>
                  {report?.validation_status ? 'Valid' : 'Invalid'}
                </strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Rows</span>
                <strong>{formatCount(report?.total_rows)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Columns</span>
                <strong>{formatCount(report?.total_columns)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Missing Values</span>
                <strong>{formatCount(report?.missing_values)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Duplicate Rows</span>
                <strong>{formatCount(report?.duplicate_rows)}</strong>
              </div>
            </div>

            {/* Re-run controls */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                onClick={handleRunAssessment}
                disabled={isLoading || !selectedFile}
              >
                {isLoading && <span className="spinner" aria-hidden="true" />}
                {isLoading ? 'Running Assessment...' : 'Re-run Assessment'}
              </button>
              {selectedFile && (
                <span className="upload-hint" style={{ margin: 0 }}>
                  {selectedFile.name}
                </span>
              )}
            </div>

            {errorMessage && (
              <div className="error-banner" role="alert" style={{ marginTop: '1rem' }}>
                {errorMessage}
              </div>
            )}
          </section>

          {/* ── Issue Log ─────────────────────────────────────────────────── */}
          <section className="card">
            <div className="card-header">
              <h2>Issue Log</h2>
              <p>Automatically detected data quality issues.</p>
            </div>

            {issueLog.length === 0 ? (
              <p style={{ marginTop: '1.5rem', color: '#15803d', fontWeight: 600, fontSize: '0.95rem' }}>
                ✓ No issues detected. Dataset passed all quality checks.
              </p>
            ) : (
              <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      {['Issue', 'Severity', 'Detail'].map((h) => (
                        <th key={h} style={{
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontWeight: 700,
                          color: '#64748b',
                          fontSize: '12px',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {issueLog.map((item, index) => (
                      <tr key={index} style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                          {item.issue}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <SeverityBadge severity={item.severity} />
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {item.detail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Remediation Recommendations ───────────────────────────────── */}
          <section className="card">
            <div className="card-header">
              <h2>Remediation Recommendations</h2>
              <p>Suggested actions to resolve detected issues.</p>
            </div>

            {recommendations.length === 0 ? (
              <p style={{ marginTop: '1.5rem', color: '#15803d', fontWeight: 600, fontSize: '0.95rem' }}>
                ✓ No recommendations. Dataset is clean and ready for analysis.
              </p>
            ) : (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recommendations.map((item, index) => {
                  const s = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.Low
                  return (
                    <div key={index} style={{
                      padding: '16px 18px',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${s.border}`,
                      borderRadius: '12px',
                      background: '#f8fafc',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#e2e8f0',
                          color: '#475569',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {index + 1}
                        </span>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                          {item.issue}
                        </span>
                        <SeverityBadge severity={item.severity} />
                      </div>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.7 }}>
                        {item.recommendation}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

        </>
      )}
    </main>
  )
}

// function formatCount(value) {
//     if (value == null || Number.isNaN(Number(value))) return '—'
//     return Number(value).toLocaleString()
//   }
  
//   const SEVERITY_STYLES = {
//     Critical: { background: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
//     High:     { background: '#fff7ed', color: '#c2410c', border: '#fdba74' },
//     Medium:   { background: '#fefce8', color: '#a16207', border: '#fde047' },
//     Low:      { background: '#f0fdf4', color: '#15803d', border: '#86efac' },
//   }
  
//   function SeverityBadge({ severity }) {
//     const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low
//     return (
//       <span style={{
//         padding: '3px 10px',
//         borderRadius: '999px',
//         fontSize: '12px',
//         fontWeight: 700,
//         background: s.background,
//         color: s.color,
//         border: `1px solid ${s.border}`,
//       }}>
//         {severity}
//       </span>
//     )
//   }
  
//   function buildIssues(report) {
//     const issues = []
//     if (!report) return issues
  
//     if (report.missing_values > 0) {
//       issues.push({
//         id: 'missing-values',
//         issue: 'Missing Values',
//         detail: `${formatCount(report.missing_values)} missing value(s) detected across the dataset.`,
//         severity: 'Medium',
//       })
//     }
  
//     if (report.duplicate_rows > 0) {
//       issues.push({
//         id: 'duplicate-rows',
//         issue: 'Duplicate Rows',
//         detail: `${formatCount(report.duplicate_rows)} duplicate row(s) found in the dataset.`,
//         severity: 'High',
//       })
//     }
  
//     if (report.missing_columns && report.missing_columns.length > 0) {
//       issues.push({
//         id: 'missing-columns',
//         issue: 'Missing Columns',
//         detail: `Required column(s) absent: ${report.missing_columns.join(', ')}.`,
//         severity: 'Critical',
//       })
//     }
  
//     return issues
//   }
  
//   function buildRecommendations(issues) {
//     return issues.map((issue) => {
//       let recommendation = ''
  
//       if (issue.id === 'missing-values') {
//         recommendation =
//           'Apply mean, median, or mode imputation for numeric fields. ' +
//           'For categorical fields, use the most frequent value or a dedicated "Unknown" category. ' +
//           'If missing rate exceeds 40% for a column, consider excluding it from analysis.'
//       } else if (issue.id === 'duplicate-rows') {
//         recommendation =
//           'Run a deduplication pass using a unique key (e.g. customer ID or account number). ' +
//           'Retain the most recent record per key. ' +
//           'Investigate the data ingestion pipeline to prevent duplicates at source.'
//       } else if (issue.id === 'missing-columns') {
//         recommendation =
//           'Correct the dataset schema to include all required columns before re-uploading. ' +
//           'Verify the data export process matches the expected feature set. ' +
//           'Contact the data engineering team if the column was recently renamed or deprecated.'
//       }
  
//       return { ...issue, recommendation }
//     })
//   }
  
//   export default function DataQualityAssessment({ analysisResult }) {
//     const report = analysisResult?.validation_report
//     const issues = buildIssues(report)
//     const recommendations = buildRecommendations(issues)
  
//     const statusStyle = report?.validation_status
//       ? { color: '#15803d', fontWeight: 700 }
//       : { color: '#b91c1c', fontWeight: 700 }
  
//     return (
//       <main className="dashboard-main">
  
//         {/* ── No data state ─────────────────────────────────────────────────── */}
//         {!analysisResult && (
//           <div className="placeholder-state">
//             <div className="placeholder-icon" aria-hidden="true">🔍</div>
//             <h2 className="placeholder-title">No data available</h2>
//             <p className="placeholder-body">
//               Run an analysis from the <strong>Dashboard</strong> to view the
//               Data Quality Report.
//             </p>
//           </div>
//         )}
  
//         {analysisResult && (
//           <>
  
//             {/* ── Section 1: Data Quality Report ──────────────────────────── */}
//             <section className="card">
//               <div className="card-header">
//                 <h2>Data Quality Report</h2>
//                 <p>Validation results for the uploaded dataset.</p>
//               </div>
  
//               <div className="summary-grid" style={{ marginTop: '1.5rem' }}>
//                 <div className="summary-item">
//                   <span className="summary-label">Validation Status</span>
//                   <strong style={statusStyle}>
//                     {report?.validation_status ? 'Valid' : 'Invalid'}
//                   </strong>
//                 </div>
//                 <div className="summary-item">
//                   <span className="summary-label">Total Rows</span>
//                   <strong>{formatCount(report?.total_rows)}</strong>
//                 </div>
//                 <div className="summary-item">
//                   <span className="summary-label">Total Columns</span>
//                   <strong>{formatCount(report?.total_columns)}</strong>
//                 </div>
//                 <div className="summary-item">
//                   <span className="summary-label">Missing Values</span>
//                   <strong>{formatCount(report?.missing_values)}</strong>
//                 </div>
//                 <div className="summary-item">
//                   <span className="summary-label">Duplicate Rows</span>
//                   <strong>{formatCount(report?.duplicate_rows)}</strong>
//                 </div>
//               </div>
//             </section>
  
//             {/* ── Section 2: Issue Log ─────────────────────────────────────── */}
//             <section className="card">
//               <div className="card-header">
//                 <h2>Issue Log</h2>
//                 <p>Automatically detected data quality issues.</p>
//               </div>
  
//               {issues.length === 0 ? (
//                 <p style={{
//                   marginTop: '1.5rem',
//                   color: '#15803d',
//                   fontWeight: 600,
//                   fontSize: '0.95rem',
//                 }}>
//                   ✓ No issues detected. Dataset passed all quality checks.
//                 </p>
//               ) : (
//                 <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
//                   {issues.map((item) => (
//                     <div key={item.id} style={{
//                       display: 'flex',
//                       alignItems: 'flex-start',
//                       justifyContent: 'space-between',
//                       gap: '16px',
//                       padding: '14px 16px',
//                       border: '1px solid #e2e8f0',
//                       borderRadius: '12px',
//                       background: '#f8fafc',
//                     }}>
//                       <div>
//                         <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
//                           {item.issue}
//                         </p>
//                         <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
//                           {item.detail}
//                         </p>
//                       </div>
//                       <div style={{ flexShrink: 0 }}>
//                         <SeverityBadge severity={item.severity} />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </section>
  
//             {/* ── Section 3: Remediation Recommendations ───────────────────── */}
//             <section className="card">
//               <div className="card-header">
//                 <h2>Remediation Recommendations</h2>
//                 <p>Suggested actions to resolve detected issues.</p>
//               </div>
  
//               {recommendations.length === 0 ? (
//                 <p style={{
//                   marginTop: '1.5rem',
//                   color: '#15803d',
//                   fontWeight: 600,
//                   fontSize: '0.95rem',
//                 }}>
//                   ✓ No recommendations. Dataset is clean and ready for analysis.
//                 </p>
//               ) : (
//                 <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
//                   {recommendations.map((item, index) => (
//                     <div key={item.id} style={{
//                       padding: '16px 18px',
//                       border: '1px solid #e2e8f0',
//                       borderRadius: '12px',
//                       background: '#f8fafc',
//                       borderLeft: `4px solid ${SEVERITY_STYLES[item.severity]?.border ?? '#e2e8f0'}`,
//                     }}>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
//                         <span style={{
//                           width: '22px',
//                           height: '22px',
//                           borderRadius: '50%',
//                           background: '#e2e8f0',
//                           color: '#475569',
//                           fontSize: '12px',
//                           fontWeight: 700,
//                           display: 'flex',
//                           alignItems: 'center',
//                           justifyContent: 'center',
//                           flexShrink: 0,
//                         }}>
//                           {index + 1}
//                         </span>
//                         <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
//                           {item.issue}
//                         </p>
//                         <SeverityBadge severity={item.severity} />
//                       </div>
//                       <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
//                         {item.recommendation}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </section>
  
//           </>
//         )}
//       </main>
//     )
//   }