import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import OverviewDashboard from './components/OverviewDashboard.jsx';
import PortfolioPage from './components/PortfolioPage.jsx';
import RiskAssessment from './components/RiskAssessment.jsx';
import ReportsPage from './components/ReportsPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';

export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [appInfo, setAppInfo] = useState({ name: 'Climora', version: '0.1.0', mode: 'Demo' });

  useEffect(() => {
    if (window.climora && window.climora.getAppInfo) {
      window.climora.getAppInfo().then(setAppInfo);
    }
  }, []);

  const handleBusinessSelect = (business) => {
    setSelectedBusinessId(business.id);
    setActivePage('assessment');
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="main-content">
        <TopBar
          pageTitle={activePage}
          appInfo={appInfo}
          onBusinessSelect={handleBusinessSelect}
          selectedBusinessId={selectedBusinessId}
          activePage={activePage}
          setActivePage={setActivePage}
        />
        <main>
          {activePage === 'overview' && <OverviewDashboard onSelectBusiness={handleBusinessSelect} />}
          {activePage === 'portfolio' && <PortfolioPage onSelectBusiness={handleBusinessSelect} />}
          {activePage === 'assessment' && (
            <RiskAssessment
              businessId={selectedBusinessId}
              onBack={() => setActivePage('overview')}
            />
          )}
          {activePage === 'reports' && <ReportsPage />}
          {activePage === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
