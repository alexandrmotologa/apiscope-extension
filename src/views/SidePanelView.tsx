import React from 'react';
import { NetworkRequest } from '../types/index.js';
import { RequestTable } from '../components/RequestTable.js';
import { RequestDetail } from '../components/RequestDetail.js';
import { DiffViewer } from '../components/DiffViewer.js';

interface SidePanelViewProps {
  requests: NetworkRequest[];
  selectedRequest: NetworkRequest | null;
  onSelectRequest: (req: NetworkRequest) => void;
  diffRequest: NetworkRequest | null;
  onSelectDiff: (req: NetworkRequest) => void;
  onClearDiff: () => void;
  onClearRequests: () => void;
  isStreaming?: boolean;
  onToggleStreaming?: () => void;
}

export const SidePanelView: React.FC<SidePanelViewProps> = ({
  requests,
  selectedRequest,
  onSelectRequest,
  diffRequest,
  onSelectDiff,
  onClearDiff,
  onClearRequests,
  isStreaming,
  onToggleStreaming,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-mono text-xs">
      {/* Left Pane: Requests list */}
      <div className="w-[360px] md:w-[420px] shrink-0 h-full flex flex-col">
        <RequestTable
          requests={requests}
          selectedRequest={selectedRequest}
          onSelectRequest={onSelectRequest}
          diffRequest={diffRequest}
          onSelectDiff={onSelectDiff}
          onClear={onClearRequests}
          isStreaming={isStreaming}
          onToggleStreaming={onToggleStreaming}
        />
      </div>

      {/* Right Pane: Detail or Diff Viewer */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {diffRequest && selectedRequest ? (
          <div className="flex-1 p-4 overflow-y-auto">
            <DiffViewer
              requestA={selectedRequest}
              requestB={diffRequest}
              onClearDiff={onClearDiff}
            />
          </div>
        ) : (
          <RequestDetail request={selectedRequest} allRequests={requests} />
        )}
      </div>
    </div>
  );
};
