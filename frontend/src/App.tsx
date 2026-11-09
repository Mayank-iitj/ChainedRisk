import React, { useState, useEffect } from 'react';
import { SafetyBar } from './components/SafetyBar';
import { Sidebar } from './components/Sidebar';
import { ApprovalModal } from './components/ApprovalModal';
import { Overview } from './pages/Overview';
import { Ingest } from './pages/Ingest';
import { Chains } from './pages/Chains';
import { ApprovalsQueue } from './pages/ApprovalsQueue';
import { Console } from './pages/Console';
import { Remediation } from './pages/Remediation';
import { Audit } from './pages/Audit';
import { Reports } from './pages/Reports';
import { FindingsList } from './pages/FindingsList';
import { LandingPage } from './pages/LandingPage';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { AssetsInventory } from './pages/AssetsInventory';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { HypothesesExplorer } from './pages/HypothesesExplorer';
import { Settings } from './pages/Settings';
import {
  fetchProjects,
  fetchProjectStats,
  fetchChains,
  fetchApprovals,
  fetchGraph,
  verifyAuditLedger,
  fetchPublicConfig,
  loadDemoScenario,
  correlateProject,
  fetchCurrentUser,
  logoutUser,
  getAuthToken,
  API_ORIGIN
} from './api';
import { ProjectStats, AttackChain, ApprovalCard, UserProfile } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');
  const [currentTab, setCurrentTab] = useState('overview');
  const [projectId, setProjectId] = useState('');
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [chains, setChains] = useState<AttackChain[]>([]);
  const [approvals, setApprovals] = useState<ApprovalCard[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [activeApprovalCard, setActiveApprovalCard] = useState<ApprovalCard | null>(null);
  const [graphElements, setGraphElements] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [auditValid, setAuditValid] = useState(true);
  const [killLocked, setKillLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const mainRef = React.useRef<HTMLElement | null>(null);

  // Restore authenticated session on load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await fetchCurrentUser();
        if (user) {
          setCurrentUser(user);
          if (user.active_project_id) {
            setProjectId(user.active_project_id);
          }
          if (window.location.hash === '#app') {
            setViewMode('app');
            if (!user.onboarding_completed) {
              setShowOnboarding(true);
            }
          }
        } else {
          setCurrentUser(null);
          setViewMode('landing');
          if (window.location.hash === '#app') {
            window.location.hash = '';
          }
        }
      } catch (err) {
        // Guest or expired session
        setCurrentUser(null);
        setViewMode('landing');
        if (window.location.hash === '#app') {
          window.location.hash = '';
        }
      }
    };
    initAuth();
  }, []);

  // Global scroll-to-reveal observer for all pages
  useEffect(() => {
    if (viewMode !== 'app') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      document.querySelectorAll('.reveal-block').forEach((el) => el.classList.add('revealed'));
      return;
    }

    const mainEl = mainRef.current;
    if (!mainEl) return;

    // Small delay to ensure child DOM elements have rendered
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { root: mainEl, threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
      );

      const elements = mainEl.querySelectorAll('.reveal-block');
      elements.forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    }, 60);

    return () => clearTimeout(timer);
  }, [currentTab, viewMode, chains, stats, approvals]);

  // Live Console state
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [consoleVerdict, setConsoleVerdict] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!projectId || viewMode !== 'app' || !currentUser) return;
    refreshAllData();
    const cleanup = setupWebSocket();
    return () => {
      cleanup?.();
    };
  }, [projectId, viewMode, currentUser]);

  const refreshAllData = async () => {
    if (!projectId || viewMode !== 'app' || !currentUser) return;
    try {
      const [statsData, chainsData, approvalsData, graphData, auditData, configData] = await Promise.all([
        fetchProjectStats(projectId),
        fetchChains(projectId),
        fetchApprovals(),
        fetchGraph(projectId),
        verifyAuditLedger(),
        fetchPublicConfig()
      ]);

      setStats(statsData);
      setChains(chainsData || []);
      setApprovals(approvalsData || []);
      setGraphElements(graphData || { nodes: [], edges: [] });
      setAuditValid(auditData?.valid ?? true);
      setKillLocked(configData?.kill_locked ?? false);

      if (chainsData && chainsData.length > 0 && !selectedChainId) {
        setSelectedChainId(chainsData[0].id);
      }
    } catch (e) {
      console.error('Error refreshing state:', e);
    }
  };

  const setupWebSocket = () => {
    try {
      let wsUrl = '';
      if (API_ORIGIN) {
        const urlObj = new URL(API_ORIGIN);
        const protocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${urlObj.host}/ws`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }
      const socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'approval.requested') {
            setActiveApprovalCard(msg.payload.card);
            fetchApprovals().then(setApprovals);
          } else if (msg.type === 'approval.decided') {
            fetchApprovals().then(setApprovals);
          } else if (msg.type === 'execution.started') {
            setIsExecuting(true);
            setConsoleLogs((prev) => [...prev, `[*] Runner process started for step ${msg.payload.step_id}`]);
          } else if (msg.type === 'execution.finished') {
            setIsExecuting(false);
            setConsoleVerdict(msg.payload.verdict);
            if (msg.payload.logs) {
              setConsoleLogs(msg.payload.logs.split('\n'));
            }
            refreshAllData();
          } else if (msg.type === 'system.locked') {
            setKillLocked(msg.payload.locked);
          }
        } catch (err) {
          // Ping or non-json message
        }
      };

      socket.onerror = (err) => {
        console.debug('WebSocket notice:', err);
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      };
    } catch (e) {
      console.debug('WebSocket setup skipped:', e);
      return undefined;
    }
  };

  const handleRunCorrelation = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      await correlateProject(projectId, false);
      await refreshAllData();
    } catch (e: any) {
      alert(`Correlation failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setProjectId('');
    setViewMode('landing');
    window.location.hash = '';
  };

  // If user is logged in but hasn't completed onboarding, show Onboarding Wizard
  if (showOnboarding && currentUser) {
    return (
      <OnboardingWizard
        currentUser={currentUser}
        onComplete={(newPid, updatedUser) => {
          setProjectId(newPid);
          setCurrentUser(updatedUser);
          setShowOnboarding(false);
          setViewMode('app');
          window.location.hash = '#app';
          refreshAllData();
        }}
        onSkip={() => {
          setShowOnboarding(false);
          setViewMode('app');
          window.location.hash = '#app';
        }}
      />
    );
  }

  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          currentUser={currentUser}
          onLaunchApp={() => {
            if (!currentUser) {
              setAuthModalMode('signin');
              setShowAuthModal(true);
            } else if (!currentUser.onboarding_completed) {
              setShowOnboarding(true);
            } else {
              window.location.hash = '#app';
              setViewMode('app');
            }
          }}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || 'signin');
            setShowAuthModal(true);
          }}
          onExploreScenario={() => {
            if (!currentUser) {
              setAuthModalMode('signin');
              setShowAuthModal(true);
            } else {
              window.location.hash = '#app';
              setViewMode('app');
              setCurrentTab('chains');
            }
          }}
        />

        <AuthModal
          isOpen={showAuthModal}
          initialMode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            if (user.active_project_id) {
              setProjectId(user.active_project_id);
            }
            if (!user.onboarding_completed) {
              setShowOnboarding(true);
            } else {
              window.location.hash = '#app';
              setViewMode('app');
            }
            refreshAllData();
          }}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden text-white antialiased font-sans selection:bg-white selection:text-black">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingApprovalsCount={approvals.length}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthModalMode('signin');
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onGoLanding={() => {
          window.location.hash = '';
          setViewMode('landing');
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Safety Bar */}
        <SafetyBar
          pendingCount={approvals.length}
          auditValid={auditValid}
          killLocked={killLocked}
          currentUser={currentUser}
          activeProjectName={currentUser?.onboarding_profile?.project_name || 'Active Security Enclave'}
          onOpenAuth={() => {
            setAuthModalMode('signin');
            setShowAuthModal(true);
          }}
          onOpenOnboarding={() => setShowOnboarding(true)}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.trim().length > 0 && currentTab !== 'findings') {
              setCurrentTab('findings');
            }
          }}
          onKillStateChange={refreshAllData}
          onOpenApprovals={() => setCurrentTab('approvals')}
        />

        {/* View Router */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <Overview
              stats={stats}
              chains={chains}
              orgName={currentUser?.org_name || 'Enterprise Cyber Labs'}
              projectName={currentUser?.onboarding_profile?.project_name || 'Active Security Enclave'}
              onSelectChain={(id) => {
                setSelectedChainId(id);
                setCurrentTab('chains');
              }}
              onLoadDemo={handleRunCorrelation}
              loading={loading}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'ingest' && (
            <Ingest projectId={projectId} onIngestSuccess={refreshAllData} />
          )}

          {currentTab === 'graph' && (
            <KnowledgeGraphPage
              projectId={projectId}
              onNavigateToChain={(id) => {
                setSelectedChainId(id);
                setCurrentTab('chains');
              }}
            />
          )}

          {currentTab === 'assets' && (
            <AssetsInventory
              projectId={projectId}
              onSelectFindingQuery={(q) => {
                setSearchQuery(q);
                setCurrentTab('findings');
              }}
            />
          )}

          {currentTab === 'findings' && <FindingsList projectId={projectId} initialQuery={searchQuery} />}

          {currentTab === 'chains' && (
            <Chains
              chains={chains}
              selectedChainId={selectedChainId}
              onSelectChain={setSelectedChainId}
              onOpenApproval={setActiveApprovalCard}
              onNavigateToConsole={() => setCurrentTab('console')}
            />
          )}

          {currentTab === 'approvals' && (
            <ApprovalsQueue
              approvals={approvals}
              onOpenCard={setActiveApprovalCard}
            />
          )}

          {currentTab === 'hypotheses' && (
            <HypothesesExplorer
              projectId={projectId}
              onSelectChain={(id) => {
                setSelectedChainId(id);
                setCurrentTab('chains');
              }}
            />
          )}

          {currentTab === 'console' && (
            <Console
              logs={consoleLogs}
              executionVerdict={consoleVerdict}
              isExecuting={isExecuting}
              onClearLogs={() => {
                setConsoleLogs([]);
                setConsoleVerdict('');
              }}
            />
          )}

          {currentTab === 'remediation' && (
            <Remediation projectId={projectId} chains={chains} />
          )}

          {currentTab === 'audit' && <Audit />}

          {currentTab === 'reports' && <Reports projectId={projectId} />}

          {currentTab === 'settings' && (
            <Settings
              currentProjectId={projectId}
              onSelectProject={(newId) => {
                setProjectId(newId);
                refreshAllData();
              }}
              currentUser={currentUser}
              onRefreshData={refreshAllData}
            />
          )}
        </main>
      </div>

      {/* Hero HITL Approval Modal */}
      {activeApprovalCard && (
        <ApprovalModal
          card={activeApprovalCard}
          onClose={() => setActiveApprovalCard(null)}
          onDecided={() => {
            fetchApprovals().then(setApprovals);
            refreshAllData();
          }}
          onRunStarted={(stepId, executionId) => {
            setCurrentTab('console');
            setConsoleLogs((prev) => [
              ...prev,
              `[*] Approval granted by human reviewer for step ${stepId}`,
              `[*] Dispatching probe container to isolated network: chained_lab...`
            ]);
            setIsExecuting(true);
          }}
        />
      )}

      {/* Auth Modal inside App layout */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authModalMode}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          if (user.active_project_id) {
            setProjectId(user.active_project_id);
          }
          if (!user.onboarding_completed) {
            setShowOnboarding(true);
          }
          refreshAllData();
        }}
      />
    </div>
  );
};

