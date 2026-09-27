/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * React Context + reducer state root for AXON (Stage 1A + 1B).
 *
 * Stage 1A: Context + useReducer, proof-wired isTokensModalOpen.
 * Stage 1B: Hydrate GLOBAL fields from localStorage on init; debounce-
 * write GLOBAL fields only. isTokensModalOpen is never persisted.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
} from 'react';
import {
  axonReducer,
  initialAxonState,
  type AxonState,
  type AxonAction,
  type AxonScreen,
} from './axonState';
import {
  loadPersistedGlobal,
  savePersistedGlobal,
  pickGlobal,
  PERSIST_DEBOUNCE_MS,
} from './storage';

const AxonStateContext = createContext<AxonState | null>(null);
const AxonDispatchContext = createContext<Dispatch<AxonAction> | null>(null);

/**
 * Build initial reducer state: merge persisted GLOBAL (if valid) onto
 * defaults. isTokensModalOpen always starts false (ephemeral).
 * First run (no data) → pure initialAxonState.
 */
function createInitialState(): AxonState {
  const persisted = loadPersistedGlobal();
  if (!persisted) {
    return initialAxonState;
  }
  return {
    ...initialAxonState,
    ...persisted,
    isTokensModalOpen: false,
  };
}

export function AxonStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(axonReducer, undefined, createInitialState);

  // Debounced persistence of GLOBAL fields only
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // Skip the initial hydration write (already on disk or defaults)
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    if (persistTimerRef.current !== null) {
      clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      savePersistedGlobal(pickGlobal(state));
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (persistTimerRef.current !== null) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [
    state.currentScreen,
    state.activeChatId,
    state.recents,
    state.messages,
    state.selectedModel,
    state.userName,
  ]);

  return (
    <AxonStateContext.Provider value={state}>
      <AxonDispatchContext.Provider value={dispatch}>
        {children}
      </AxonDispatchContext.Provider>
    </AxonStateContext.Provider>
  );
}

export function useAxonState(): AxonState {
  const ctx = useContext(AxonStateContext);
  if (ctx === null) {
    throw new Error('useAxonState must be used within AxonStateProvider');
  }
  return ctx;
}

export function useAxonDispatch(): Dispatch<AxonAction> {
  const ctx = useContext(AxonDispatchContext);
  if (ctx === null) {
    throw new Error('useAxonDispatch must be used within AxonStateProvider');
  }
  return ctx;
}

/** Convenience: open / close the Design Tokens modal via the state root. */
export function useTokensModal() {
  const { isTokensModalOpen } = useAxonState();
  const dispatch = useAxonDispatch();
  return {
    isTokensModalOpen,
    openTokensModal: () =>
      dispatch({ type: 'SET_TOKENS_MODAL_OPEN', payload: true }),
    closeTokensModal: () =>
      dispatch({ type: 'SET_TOKENS_MODAL_OPEN', payload: false }),
  };
}

/** Stage 1C-i: currentScreen read/write exclusively via the state root. */
export function useCurrentScreen() {
  const { currentScreen } = useAxonState();
  const dispatch = useAxonDispatch();
  return {
    currentScreen,
    setCurrentScreen: (screen: AxonScreen) =>
      dispatch({ type: 'SET_CURRENT_SCREEN', payload: screen }),
  };
}
