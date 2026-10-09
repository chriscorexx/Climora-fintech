import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import OverviewDashboard from './components/OverviewDashboard.jsx';
import PortfolioPage from './components/PortfolioPage.jsx';
import RiskAssessment from './components/RiskAssessment.jsx';
import LoanApplicationsPage from './components/LoanApplicationsPage.jsx';
import ReportsPage from './components/ReportsPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import OwnerDashboardPage from './components/OwnerDashboardPage.jsx';
import MyBusinessPage from './components/MyBusinessPage.jsx';
import ClimateExposurePage from './components/ClimateExposurePage.jsx';
import LoanReadinessPage from './components/LoanReadinessPage.jsx';
import ImprovementRoadmapPage from './components/ImprovementRoadmapPage.jsx';
import DocumentsPage from './components/DocumentsPage.jsx';
import AssessmentHistoryPage from './components/AssessmentHistoryPage.jsx';

export default function App() {
  const [role, setRole] = useState('lender'); // 'lender' | 'owner'
  const [activePage, setActivePage] = useState('overview');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [appInfo, setAppInfo] = useState({ version: '0.1.0' });

  useEffect(() => {
    if (window.climora?.getAppInfo) {
      window.climora.getAppInfo().then(setAppInfo);
    }
  }, []);

  const handleBusinessSelect = (business) => {
    setSelectedBusiness(business);
    setActivePage('assessment');
  };

  const renderPage = () => {
    switch (activePage) {
      // ── Lender ──
      case 'overview':
        return <OverviewDashboard onSelectBusiness={handleBusinessSelect} />;
      case 'portfolio':
        return <PortfolioPage onSelectBusiness={handleBusinessSelect} />;
      case 'assessment':
        return (
          <RiskAssessment
            businessId={selectedBusiness?.id}
            onBack={() => setActivePage('overview')}
          />
        );
      case 'loanApps':
        return <LoanApplicationsPage onSelectBusiness={handleBusinessSelect} />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;

      // ── Owner ──
      case 'ownerDashboard':
        return <OwnerDashboardPage setActivePage={setActivePage} />;
      case 'myBusiness':
        return <MyBusinessPage />;
      case 'climateExposure':
        return <ClimateExposurePage />;
      case 'loanReadiness':
        return <LoanReadinessPage setActivePage={setActivePage} />;
      case 'roadmap':
        return <ImprovementRoadmapPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'history':
        return <AssessmentHistoryPage />;

      default:
        return <OverviewDashboard onSelectBusiness={handleBusinessSelect} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        role={role}
        setRole={setRole}
      />
      <div className="main-content">
        <TopBar
          activePage={activePage}
          role={role}
          onBusinessSelect={handleBusinessSelect}
          selectedBusinessId={selectedBusiness?.id}
        />
        <main className="page-body fade-in" key={activePage}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
