// import { useState } from 'react'
// import Sidebar from './components/Sidebar'
// import Dashboard from './pages/Dashboard'
// import './App.css'

// export default function App() {
//   const [activePage, setActivePage] = useState('data-quality')

//   return (
//     <div className="app-layout">
//       <Sidebar activePage={activePage} onNavigate={setActivePage} />
//       <div className="app-content">
//         {activePage === 'dashboard'     && <Dashboard />}
//         {activePage === 'data-quality'  && (
//           <div className="dashboard-main" style={{ paddingTop: '2rem' }}>
//             <div className="card">
//               <div className="card-header">
//                 <h2>Data Quality Assessment</h2>
//                 <p>in progress</p>
//               </div>
//             </div>
//           </div>
//         )}
//         {activePage === 'scorecard' && (
//           <div className="dashboard-main" style={{ paddingTop: '2rem' }}>
//             <div className="card">
//               <div className="card-header">
//                 <h2>Scorecard Analytics</h2>
//                 <p>inn progress</p>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import DataQualityAssessment from './pages/DataQualityAssessment'
import './App.css'

export default function App() {
  const [activePage, setActivePage] = useState('data-quality')
  const [analysisResult, setAnalysisResult] = useState(null)

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="app-content">

        {activePage === 'data-quality' && (
          <DataQualityAssessment analysisResult={analysisResult} />
        )}

        {activePage === 'dashboard' && (
          <Dashboard
            analysisResult={analysisResult}
            setAnalysisResult={setAnalysisResult}
          />
        )}

        {activePage === 'scorecard' && (
          <main className="dashboard-main">
            <section className="card">
              <div className="card-header">
                <h2>Scorecard Analytics Module</h2>
               
              </div>
              <div className="placeholder-card-body">
                <div className="placeholder-card-icon">🚧</div>
                <p className="placeholder-card-text">in progress</p>
              </div>
            </section>
          </main>
        )}

      </div>
    </div>
  )
}