import { useState } from 'react';
import { useAccountStore } from '@massalabs/react-ui-kit';
import { NodeStatusInfo } from '@massalabs/massa-web3';

export function useGetNodeStatus() {
  const { connectedAccount } = useAccountStore();
  const [error, setError] = useState<string | null>(null);
  const [nodeStatus, setNodeStatus] = useState<NodeStatusInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getNodeStatus = async () => {
    if (!connectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const status = await connectedAccount.getNodeStatus();
      setNodeStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getNodeStatus,
    nodeStatus,
    error,
    isLoading,
  };
}
