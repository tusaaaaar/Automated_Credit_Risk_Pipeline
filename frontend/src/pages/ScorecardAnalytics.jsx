import ScoreDistributionChart from '../components/ScoreDistributionChart'
import PDDistributionChart from '../components/PDDistributionChart'
import RiskGauge from '../components/RiskGauge'


function ComingSoonBadge() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 700,
      background: '#eff6ff',
      color: '#2563eb',
      border: '1px solid #bfdbfe',
      letterSpacing: '0.03em',
    }}>
      🚧 Coming Soon
    </span>
  )
}

function ComingSoonCard({ card }) {
  return (
    <section className="card dashboard-col">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <span style={{ fontSize: '28px', lineHeight: 1 }}>{card.icon}</span>
          <ComingSoonBadge />
        </div>

        <div className="card-header" style={{ padding: 0, marginBottom: '24px' }}>
          <h2>{card.title}</h2>
          <p>{card.description}</p>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
          gap: '10px',
        }}>
          <span style={{ fontSize: '36px', opacity: 0.4 }}>{card.icon}</span>
          <p style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 600,
            color: '#94a3b8',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Coming Soon
          </p>
        </div>

      </div>
    </section>
  )
}

export default function ScorecardAnalytics({ analysisResult }) {
  const pdValues = analysisResult?.pd_values || []

  return (
    <main className="dashboard-main">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <section className="card">
        <div className="card-header">
          <h2>Scorecard Analytics</h2>
          <p>
            Advanced credit scoring analytics including PD distribution,
            score banding, and portfolio risk profiling.
          </p>
        </div>
      </section>

      {/* ── Score Distribution (full width) ──────────────────────────────── */}
      <section className="card">
        <div className="card-header" style={{ marginBottom: '8px' }}>
          <h2>Score Distribution</h2>
          <p>
            Distribution of credit scores derived from PD using PDO-based scaling.
            Scores are transformed using odds and log2 scaling anchored at 600 points.
          </p>
        </div>

        {pdValues.length > 0 ? (
          <ScoreDistributionChart pdValues={pdValues} />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 16px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            gap: '10px',
            marginTop: '16px',
          }}>
            <span style={{ fontSize: '36px', opacity: 0.4 }}>📊</span>
            <p style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 600,
              color: '#94a3b8',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Run an analysis from the Dashboard to view Score Distribution
            </p>
          </div>
        )}
      </section>

      {/* ── PD Distribution + Risk Gauge (side by side) ───────────────────── */}
      <div className="dashboard-row dashboard-row--stretch">

        <section className="card dashboard-col">
          <div className="card-header" style={{ marginBottom: '8px' }}>
            <h2>PD Distribution</h2>
            <p>
              Distribution of predicted probabilities of default across customers.
              Visualizes how PD scores are spread across the portfolio to identify
              concentration risk.
            </p>
          </div>

          {pdValues.length > 0 ? (
            <PDDistributionChart pdValues={pdValues} />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1',
              gap: '10px',
              marginTop: '16px',
            }}>
              <span style={{ fontSize: '36px', opacity: 0.4 }}>📉</span>
              <p style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 600,
                color: '#94a3b8',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                Run an analysis from the Dashboard to view PD Distribution
              </p>
            </div>
          )}
        </section>

        <div className="dashboard-col">
          <RiskGauge pdValues={pdValues} />
        </div>

      </div>

    </main>
  )
}