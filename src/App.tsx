/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { Composer } from './components/Composer';
import { NavigationDrawer } from './components/NavigationDrawer';
import { WelcomeState } from './components/WelcomeState';
import { ActiveConversation } from './components/ActiveConversation';
import { DesignTokensModal } from './components/DesignTokensModal';
import { SettingsModal } from './components/SettingsModal';
import { AxonSourceScreen } from './components/AxonSourceScreen';
import { InterfaceCaptureScreen } from './components/InterfaceCaptureScreen';
import { AxonToolsScreen } from './components/AxonToolsScreen';
import { AxonBuildScreen } from './components/AxonBuildScreen';
import { ChatMessage, RecentChat } from './types';
import { sendQueryToAxonBoundary } from './services/axonBrainInterface';
import { AxonStateProvider, useTokensModal, useCurrentScreen } from './state/AxonStateContext';

// Reference conversation matching Image 2
const INITIAL_REFERENCE_MESSAGES: ChatMessage[] = [
  {
    id: 'user-ref-1',
    role: 'user',
    content:
      'Can you help me build a simple Android app using Kotlin? I want it to have a login screen and a home screen. Keep it beginner-friendly but with clean code.',
    timestamp: 1711200000000,
  },
  {
    id: 'axon-ref-1',
    role: 'assistant',
    content:
      "Absolutely, I can help you build a simple Android app with Kotlin. I'll show you a clean, beginner-friendly structure with a login screen and a home screen. The app will use modern Android practices, and I'll keep the code easy to follow and well-organized.\n\nBefore I provide the full code, let me outline the plan so you know what to expect:\n\n1. Set up a new Android project with Kotlin.\n2. Create a login screen with basic validation.\n3. Build a home screen that appears after login.\n4. Use ViewBinding or Jetpack Compose (depending on your preference).\n5. Keep the code structured, clean, and easy to modify.",
    leadParagraph:
      "Absolutely, I can help you build a simple Android app with Kotlin. I'll show you a clean, beginner-friendly structure with a login screen and a home screen. The app will use modern Android practices, and I'll keep the code easy to follow and well-organized.",
    planIntro: 'Before I provide the full code, let me outline the plan so you know what to expect:',
    planItems: [
      'Set up a new Android project with Kotlin.',
      'Create a login screen with basic validation.',
      'Build a home screen that appears after login.',
      'Use ViewBinding or Jetpack Compose (depending on your preference).',
      'Keep the code structured, clean, and easy to modify.',
    ],
    hasSources: true,
    suggestionPrompt:
      'Would you like me to generate the complete project files, or walk you through each part step by step?',
    timestamp: 1711200005000,
  },
];

// Initial recents matching Image 3
const INITIAL_RECENTS: RecentChat[] = [
  {
    id: 'chat-layout',
    title: 'Describe Axon UI Layout',
    timestamp: 'Just now',
    messages: INITIAL_REFERENCE_MESSAGES,
  },
  {
    id: 'chat-resize',
    title: 'Resize chat input',
    timestamp: '2 hours ago',
    messages: [
      {
        id: 'msg-resize-1',
        role: 'user',
        content: 'How should the chat input bubble resize on mobile viewports?',
        timestamp: Date.now() - 7200000,
      },
      {
        id: 'msg-resize-2',
        role: 'assistant',
        content: "I'm here, but AXON's intelligence layer isn't online yet. The composer geometry is designed to remain anchored at 720px max-width with stable 26px rounded corners.",
        timestamp: Date.now() - 7190000,
      }
    ],
  },
  {
    id: 'chat-youtube',
    title: 'Recommend YouTube Channel',
    timestamp: 'Yesterday',
    messages: [],
  },
  {
    id: 'chat-termux',
    title: 'Offline Termux Voice Tools',
    timestamp: '2 days ago',
    messages: [],
  },
  {
    id: 'chat-showcase',
    title: 'Create AXON UI Showcase',
    timestamp: '3 days ago',
    messages: [],
  },
];

function AppInner() {
  // Stage 1A: tokens modal open/close lives in the state root (proof migration)
  const { openTokensModal } = useTokensModal();
  // Stage 1C-i: currentScreen lives exclusively in the state root
  const { currentScreen, setCurrentScreen } = useCurrentScreen();

  // Navigation & Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null); // null = Welcome state (Image 1)
  const [recents, setRecents] = useState<RecentChat[]>(INITIAL_RECENTS);

  // Active messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Composer & controls state
  const [composerInput, setComposerInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('Sonnet 5 Thinking');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Modals (isTokensModalOpen migrated to state root in Stage 1A)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [userName, setUserName] = useState('Luidel');

  // Scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (activeChatId && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, activeChatId]);

  // Handle switching to a recent chat
  const handleSelectRecent = (chatId: string) => {
    const found = recents.find((r) => r.id === chatId);
    if (found) {
      setActiveChatId(found.id);
      setMessages(found.messages.length > 0 ? found.messages : INITIAL_REFERENCE_MESSAGES);
      setCurrentScreen('chat');
    }
  };

  // Start fresh chat
  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setComposerInput('');
    setCurrentScreen('chat');
  };

  // Switch to reference state directly (from inspector modal)
  const handleSelectView = (view: 'welcome' | 'conversation' | 'drawer') => {
    setCurrentScreen('chat');
    if (view === 'welcome') {
      setActiveChatId(null);
      setIsDrawerOpen(false);
    } else if (view === 'conversation') {
      setActiveChatId('chat-layout');
      setMessages(INITIAL_REFERENCE_MESSAGES);
      setIsDrawerOpen(false);
    } else if (view === 'drawer') {
      setIsDrawerOpen(true);
    }
  };

  // Logo toggle logic per Spec (v3.3):
  // - Menu closed + tap logo → menu opens
  // - Menu open + tap logo → menu closes (stays on whatever screen the user was on — no navigation)
  const handleNonChatLogoClick = () => {
    setIsDrawerOpen((prev) => !prev);
  };

  // Tapping the logo mark inside the open NavigationDrawer:
  const handleDrawerLogoClick = () => {
    // Menu is open + tap logo → menu closes (stays on whatever screen the user was on)
    setIsDrawerOpen(false);
  };

  // Handle sending a message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    // If starting from welcome screen, create a new active chat session
    if (!activeChatId) {
      const newChatId = `chat-${Date.now()}`;
      setActiveChatId(newChatId);
      const title = text.trim().slice(0, 28) + (text.trim().length > 28 ? '...' : '');
      const newRecent: RecentChat = {
        id: newChatId,
        title,
        timestamp: 'Just now',
        messages: nextMessages,
      };
      setRecents([newRecent, ...recents]);
    }

    setIsSending(true);

    try {
      // Dispatches to the strictly segregated AXON brain interface
      const axonResponse = await sendQueryToAxonBoundary(text, selectedModel);
      setMessages((prev) => [...prev, axonResponse]);
    } catch {
      // Graceful fallback without exposing raw errors
      setMessages((prev) => [
        ...prev,
        {
          id: `axon-${Date.now()}`,
          role: 'assistant',
          content: "I'm here, but AXON's intelligence layer isn't online yet. We're building the environment first.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative w-full h-dvh bg-[#121315] text-[#ECECEC] font-sans antialiased overflow-hidden flex flex-col">
      {currentScreen === 'axon-source' ? (
        <AxonSourceScreen
          onLogoClick={handleNonChatLogoClick}
          recents={recents}
          userName={userName}
          selectedModel={selectedModel}
          activeChatId={activeChatId}
        />
      ) : currentScreen === 'axon-tools' ? (
        <AxonToolsScreen
          onLogoClick={handleNonChatLogoClick}
        />
      ) : currentScreen === 'axon-build' ? (
        <AxonBuildScreen onLogoClick={handleNonChatLogoClick} />
      ) : currentScreen === 'interface-capture' ? (
        <InterfaceCaptureScreen onLogoClick={handleNonChatLogoClick} />
      ) : (
        <>
          {/* 1. ANCHORED PERSISTENT TOP BAR */}
          <TopBar
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onNewChat={handleNewChat}
            onResetToWelcome={handleNewChat}
            hasActiveChat={Boolean(activeChatId)}
            onOpenInfo={openTokensModal}
          />

          {/* 2. INDEPENDENT SCROLLING VIEWPORT AREA */}
          <main
            ref={scrollContainerRef}
            className={`flex-1 w-full overflow-y-auto overflow-x-hidden ${
              activeChatId ? 'pt-16 pb-36 flex flex-col justify-between' : 'flex flex-col'
            }`}
          >
            {activeChatId ? (
              // Active Conversation State (Image 2)
              <ActiveConversation
                messages={messages}
                onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
              />
            ) : (
              // Welcome / New Chat State (Image 1)
              <WelcomeState userName={userName} />
            )}
          </main>

          {/* 3. ANCHORED PERSISTENT BOTTOM COMPOSER */}
          <Composer
            input={composerInput}
            setInput={setComposerInput}
            onSend={handleSendMessage}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            isCompactMode={isCompactMode}
            onToggleCompactMode={openTokensModal}
            disabled={isSending}
          />
        </>
      )}

      {/* 4. NAVIGATION DRAWER OVERLAY (Image 3) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        recents={recents}
        activeChatId={activeChatId}
        onSelectRecent={handleSelectRecent}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogoClick={handleDrawerLogoClick}
      />

      {/* 5. DESIGN TOKENS & ARCHITECTURE MODAL (open/close via state root) */}
      <DesignTokensModal
        onSelectView={handleSelectView}
        onLogoClick={handleNonChatLogoClick}
      />

      {/* 6. SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userName={userName}
        onUpdateUserName={setUserName}
        onLogoClick={handleNonChatLogoClick}
      />
    </div>
  );
}

/** Stage 1A: state root provider wraps the app shell. */
export default function App() {
  return (
    <AxonStateProvider>
      <AppInner />
    </AxonStateProvider>
  );
}
