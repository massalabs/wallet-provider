import { useState } from 'react';
import { useAccountStore, useHandleOperation } from '@massalabs/react-ui-kit';
import { Args, bytesToStr } from '@massalabs/massa-web3';

export const HELLO_WORLD_CONTRACT =
  'AS12iXFL8xdPfrJFYwrZ4tstV9TtTP6GffUDSwAvrRfTnBQdchpqd';

export function useCallAndReadSC() {
  const { connectedAccount } = useAccountStore();
  const [error, setError] = useState<string | null>(null);
  const [readValue, setReadValue] = useState<string | null>(null);
  const { handleOperation, isError, isSuccess, isPending } =
    useHandleOperation();

  const callSC = async (value: string) => {
    if (!connectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    const op = await connectedAccount.callSC({
      target: HELLO_WORLD_CONTRACT,
      func: 'setMessage',
      parameter: new Args().addString(value),
    });

    await handleOperation(op, {
      pending: 'Transaction in progress',
      success: 'Transaction successful',
      error: 'Error',
    });
  };

  const readSC = async () => {
    if (!connectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    const result = await connectedAccount.readSC({
      target: HELLO_WORLD_CONTRACT,
      func: 'getMessage',
    });

    setReadValue(bytesToStr(result.value));
  };

  return {
    callSC,
    readSC,
    error,
    readValue,
    isError,
    isSuccess,
    isPending,
  };
}
