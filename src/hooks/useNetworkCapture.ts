import { useState, useEffect, useCallback, useRef } from 'react';
import { NetworkRequest } from '../types/index.js';
import { INITIAL_MOCK_REQUESTS, generateRandomMockRequest } from '../mock/mockNetworkData.js';

export interface UseNetworkCaptureResult {
  requests: NetworkRequest[];
  selectedRequest: NetworkRequest | null;
  setSelectedRequest: (req: NetworkRequest | null) => void;
  diffRequest: NetworkRequest | null;
  setDiffRequest: (req: NetworkRequest | null) => void;
  isExtensionEnv: boolean;
  activeTabId: number | null;
  isStreaming: boolean;
  toggleStreaming: () => void;
  addSimulatedRequest: () => void;
  clearRequests: () => void;
}

export function useNetworkCapture(): UseNetworkCaptureResult {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [diffRequest, setDiffRequest] = useState<NetworkRequest | null>(null);
  const [isExtensionEnv, setIsExtensionEnv] = useState(false);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const streamingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check environment on mount
  useEffect(() => {
    const hasChrome =
      typeof chrome !== 'undefined' &&
      Boolean(chrome.runtime?.id) &&
      Boolean(chrome.tabs?.query);

    setIsExtensionEnv(hasChrome);

    if (hasChrome) {
      // Chrome extension mode: get current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          const tabId = tabs[0].id;
          setActiveTabId(tabId);

          // Fetch initial requests from service worker
          chrome.runtime.sendMessage({ type: 'GET_TAB_REQUESTS', tabId }, (res) => {
            if (res && Array.isArray(res.requests)) {
              setRequests(res.requests);
              if (res.requests.length > 0) {
                setSelectedRequest(res.requests[0]);
              }
            }
          });
        }
      });

      // Poll periodically every 1.5 seconds in extension mode for fresh requests
      const pollInterval = setInterval(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.runtime.sendMessage({ type: 'GET_TAB_REQUESTS', tabId: tabs[0].id }, (res) => {
              if (res && Array.isArray(res.requests)) {
                setRequests(res.requests);
              }
            });
          }
        });
      }, 1500);

      return () => clearInterval(pollInterval);
    } else {
      // Standalone web preview mode: initialize with rich mock dataset
      setRequests(INITIAL_MOCK_REQUESTS);
      setSelectedRequest(INITIAL_MOCK_REQUESTS[0]);
    }
  }, []);

  // Simulated traffic generator for web preview mode
  useEffect(() => {
    if (isStreaming && !isExtensionEnv) {
      streamingTimerRef.current = setInterval(() => {
        const newReq = generateRandomMockRequest();
        setRequests((prev) => [newReq, ...prev.slice(0, 149)]);
      }, 3500);
    } else {
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
        streamingTimerRef.current = null;
      }
    }

    return () => {
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
      }
    };
  }, [isStreaming, isExtensionEnv]);

  const toggleStreaming = useCallback(() => {
    setIsStreaming((prev) => !prev);
  }, []);

  const addSimulatedRequest = useCallback(() => {
    const newReq = generateRandomMockRequest();
    setRequests((prev) => [newReq, ...prev.slice(0, 149)]);
    setSelectedRequest(newReq);
  }, []);

  const clearRequests = useCallback(() => {
    if (isExtensionEnv && activeTabId !== null) {
      chrome.runtime.sendMessage({ type: 'CLEAR_TAB_REQUESTS', tabId: activeTabId }, () => {
        setRequests([]);
        setSelectedRequest(null);
        setDiffRequest(null);
      });
    } else {
      setRequests([]);
      setSelectedRequest(null);
      setDiffRequest(null);
    }
  }, [isExtensionEnv, activeTabId]);

  return {
    requests,
    selectedRequest,
    setSelectedRequest,
    diffRequest,
    setDiffRequest,
    isExtensionEnv,
    activeTabId,
    isStreaming,
    toggleStreaming,
    addSimulatedRequest,
    clearRequests,
  };
}
