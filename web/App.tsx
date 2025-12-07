import React, { useState } from 'react';
import { ViewState, Agent } from './types';
import { LoginView } from './views/LoginView';
import { MarketplaceView } from './views/MarketplaceView';
import { AgentInteractionView } from './views/AgentInteractionView';
import { WalletView } from './views/WalletView';
import { AgentDashboardView } from './views/AgentDashboardView';
import { LiveAnalyticsView } from './views/LiveAnalyticsView';
import { Navbar } from './components/Navbar';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [balance, setBalance] = useState(5.4270);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView(ViewState.MARKETPLACE);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView(ViewState.LOGIN);
    setSelectedAgent(null);
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setCurrentView(ViewState.INTERACTION);
  };

  const updateBalance = (amount: number) => {
    setBalance(prev => prev + amount);
  };

  // Main View Switcher
  const renderView = () => {
    switch (currentView) {
      case ViewState.LOGIN:
        return <LoginView onLogin={handleLogin} />;
      
      case ViewState.MARKETPLACE:
        return <MarketplaceView onSelectAgent={handleSelectAgent} />;
      
      case ViewState.INTERACTION:
        return selectedAgent ? (
          <AgentInteractionView 
            agent={selectedAgent} 
            onBack={() => setCurrentView(ViewState.MARKETPLACE)} 
            updateBalance={updateBalance}
          />
        ) : (
          <MarketplaceView onSelectAgent={handleSelectAgent} />
        );

      case ViewState.AGENT_DASHBOARD:
        return <AgentDashboardView />;

      case ViewState.LIVE_ANALYTICS:
        return <LiveAnalyticsView />;

      case ViewState.WALLET:
        return <WalletView />;
        
      default:
        return <LoginView onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-neon selection:text-black">
      {isLoggedIn && currentView !== ViewState.LOGIN && (
        <Navbar 
          currentView={currentView === ViewState.INTERACTION ? ViewState.MARKETPLACE : currentView} 
          onChangeView={(view) => {
            setCurrentView(view);
            if (view !== ViewState.INTERACTION) setSelectedAgent(null);
          }} 
          balance={balance}
          onLogout={handleLogout}
        />
      )}
      
      <main className="relative">
        {renderView()}
      </main>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes indeterminate {
          0% { margin-left: -50%; width: 50%; }
          100% { margin-left: 100%; width: 50%; }
        }
        .animate-progress-indeterminate {
          animation: indeterminate 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default App;