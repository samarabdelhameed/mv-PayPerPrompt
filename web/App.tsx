import React, { useState, useEffect } from 'react';
import { ViewState, Agent } from './types';
import { LoginView } from './views/LoginView';
import { MarketplaceView } from './views/MarketplaceView';
import { AgentInteractionView } from './views/AgentInteractionView';
import { WalletView } from './views/WalletView';
import { AgentDashboardView } from './views/AgentDashboardView';
import { LiveAnalyticsView } from './views/LiveAnalyticsView';
import { Navbar } from './components/Navbar';

// Demo Mode - Works without Privy for hackathon demo
const DEMO_MODE = true;

const App: React.FC = () => {
  // Demo mode state
  const [demoAuthenticated, setDemoAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [balance, setBalance] = useState(5.4270);
  const [ready, setReady] = useState(false);

  // Initialize
  useEffect(() => {
    // In demo mode, we're always "ready"
    setTimeout(() => setReady(true), 500);
  }, []);

  // Sync currentView with authentication state
  useEffect(() => {
    if (ready) {
      if (demoAuthenticated && currentView === ViewState.LOGIN) {
        setCurrentView(ViewState.MARKETPLACE);
      } else if (!demoAuthenticated) {
        setCurrentView(ViewState.LOGIN);
      }
    }
  }, [demoAuthenticated, ready, currentView]);

  const handleLogin = () => {
    // Demo login - instant
    setDemoAuthenticated(true);
  };

  const handleLogout = () => {
    setDemoAuthenticated(false);
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
    if (!ready) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <div className="w-12 h-12 border-4 border-neon border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

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
      {/* Demo Mode Banner */}
      {DEMO_MODE && demoAuthenticated && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-1 text-sm font-medium">
          🚀 Demo Mode | Contract: 0xebbd28...e684 | Network: Aptos Devnet
        </div>
      )}

      {demoAuthenticated && currentView !== ViewState.LOGIN && (
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