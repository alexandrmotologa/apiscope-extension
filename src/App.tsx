import React, { useState, useEffect } from 'react';
import { useNetworkCapture } from './hooks/useNetworkCapture.js';
import { PopupView } from './views/PopupView.js';
import { SidePanelView } from './views/SidePanelView.js';
import { StandaloneDevView } from './views/StandaloneDevView.js';

export const App: React.FC = () => {
  const capture = useNetworkCapture();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Standalone dev preview mode in regular browser tab
  if (!capture.isExtensionEnv) {
    return <StandaloneDevView capture={capture} />;
  }

  // Chrome extension mode: popup vs sidepanel based on window dimensions
  const isPopup = windowWidth <= 450;

  if (isPopup) {
    return (
      <PopupView
        requests={capture.requests}
        onClear={capture.clearRequests}
        isExtensionEnv={true}
      />
    );
  }

  return (
    <SidePanelView
      requests={capture.requests}
      selectedRequest={capture.selectedRequest}
      onSelectRequest={capture.setSelectedRequest}
      diffRequest={capture.diffRequest}
      onSelectDiff={capture.setDiffRequest}
      onClearDiff={() => capture.setDiffRequest(null)}
      onClearRequests={capture.clearRequests}
    />
  );
};
