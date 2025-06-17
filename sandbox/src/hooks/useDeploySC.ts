import { useAccountStore } from '@massalabs/react-ui-kit';
import { SmartContract, rpcTypes, Args, parseMas } from '@massalabs/massa-web3';
import { useState, useEffect } from 'react';
import { helloWorldBytecode } from './bytecodes/helloWorld';

export function useDeploySC() {
  const { connectedAccount } = useAccountStore();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [contract, setContract] = useState<SmartContract | null>(null);
  const [events, setEvents] = useState<rpcTypes.OutputEvents>([]);

  const deploySC = async (name: string) => {
    if (!connectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const contract = await connectedAccount.deploySC({
        parameter: new Args().addString(name),
        byteCode: helloWorldBytecode,
        coins: parseMas('0.1'),
      });

      setContract(contract);
      console.log('Contract deployed at :', contract.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!contract) return;
    connectedAccount
      ?.getEvents({
        smartContractAddress: contract.address,
      })
      .then((events) => {
        setEvents(events);
      });
  }, [connectedAccount, contract]);

  return {
    deploySC,
    error: error,
    isSuccess: !!contract?.address,
    isLoading,
    events,
  };
}
