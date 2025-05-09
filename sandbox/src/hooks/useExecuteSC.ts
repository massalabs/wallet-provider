/* eslint-disable no-console */
import { useAccountStore, useHandleOperation } from '@massalabs/react-ui-kit';
import { strToBytes, Operation, rpcTypes } from '@massalabs/massa-web3';
import { useState, useEffect } from 'react';
import { executeHelloBytecode } from './executeHelloBytecode';

export function useExecuteSC() {
  const { connectedAccount } = useAccountStore();
  const { handleOperation, isError, isSuccess, isPending } =
    useHandleOperation();

  const [error, setError] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [events, setEvents] = useState<rpcTypes.OutputEvents>([]);

  const executeSC = async (name: string) => {
    if (!connectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError(null);

      const datastore = new Map<Uint8Array, Uint8Array>();
      datastore.set(strToBytes('name_key'), strToBytes(name));

      const operation = await connectedAccount.executeSC({
        byteCode: executeHelloBytecode,
        datastore,
      });

      setOperation(operation);

      const toasterMsg = {
        pending: 'Transaction in progress',
        success: 'Transaction successful',
        error: 'Error',
      };
      console.log('Operation:', operation.id);
      await handleOperation(operation, toasterMsg, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Fetch events when isError or isSuccess change to true
  useEffect(() => {
    if (!operation) return;
    operation.getSpeculativeEvents().then((events) => {
      setEvents(events);
    });
  }, [isError, isSuccess]);

  return {
    executeSC,
    isLoading: isPending,
    error: error ?? isError,
    isSuccess,
    events,
  };
}
