import { Button } from '@massalabs/react-ui-kit';
import { useGetNodeStatus } from '../../hooks/useGetNodeStatus';
import { useState } from 'react';

export function GetNodeStatusForm() {
  const { getNodeStatus, nodeStatus, error, isLoading } = useGetNodeStatus();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGetStatus = async () => {
    await getNodeStatus();
  };

  const handleCopyToClipboard = async () => {
    if (!nodeStatus) return;

    try {
      const jsonString = JSON.stringify(
        nodeStatus,
        (key, value) => {
          // Convert BigInt values to strings for JSON serialization
          return typeof value === 'bigint' ? value.toString() : value;
        },
        2,
      );

      await navigator.clipboard.writeText(jsonString);
      setCopySuccess(true);

      // Reset copy success message after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="mas-title mb-4 text-center">Get Node Status</h2>
      <div className="mb-4 text-sm text-gray-700 bg-purple-100 rounded p-2">
        Get the current status of the connected Massa node including network
        info, version, and state.
      </div>

      <div className="flex flex-col gap-4 max-w-full mx-auto">
        <Button
          onClick={handleGetStatus}
          disabled={isLoading}
          customClass="w-full"
        >
          {isLoading ? 'Getting Status...' : 'Get Node Status'}
        </Button>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {nodeStatus && (
          <div className="mt-4 text-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="mas-title">Node Status:</h3>
              <div className="flex items-center gap-2">
                {copySuccess && (
                  <span className="text-green-600 text-xs">Copied!</span>
                )}
                <Button
                  onClick={handleCopyToClipboard}
                  variant="secondary"
                  customClass="h-8 px-3 text-xs"
                >
                  Copy JSON
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded border">
              <pre className="text-xs overflow-auto whitespace-pre-wrap h-80">
                {JSON.stringify(
                  nodeStatus,
                  (key, value) => {
                    // Convert BigInt values to strings for JSON serialization
                    return typeof value === 'bigint' ? value.toString() : value;
                  },
                  2,
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
