import { useState } from 'react';
import { useAccountStore, useHandleOperation } from '@massalabs/react-ui-kit';
import { MassaStationWallet, SignRule, WalletName } from '../../../dist/esm';

export function useSignRules() {
  const { connectedAccount, currentWallet } = useAccountStore();
  const { isError, isSuccess, isPending } = useHandleOperation();

  const [error, setError] = useState<string | null>(null);

  const isMassaWallet = currentWallet?.name() === WalletName.MassaWallet;

  const addSignRule = async (
    accountName: string,
    rule: SignRule,
    desc?: string,
  ) => {
    if (!connectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isMassaWallet) {
      setError('Sign rules are only available with Massa Wallet');
      return;
    }

    const massaWallet = currentWallet as unknown as MassaStationWallet;

    try {
      setError(null);
      const result = await massaWallet.addSignRule(accountName, rule, desc);
      console.log('result', result);
    } catch (err) {
      console.log('err', err);
      setError(err instanceof Error ? err.message : 'Failed to add sign rule');
      throw err;
    }
  };

  const editSignRule = async (
    accountName: string,
    rule: SignRule,
    desc?: string,
  ) => {
    if (!connectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isMassaWallet) {
      setError('Sign rules are only available with Massa Wallet');
      return;
    }

    const massaWallet = currentWallet as unknown as MassaStationWallet;
    try {
      setError(null);
      const result = await massaWallet.editSignRule(accountName, rule, desc);

      console.log('Updated sign rule:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit sign rule');
      throw err;
    }
  };

  const deleteSignRule = async (accountName: string, ruleId: string) => {
    if (!connectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isMassaWallet) {
      setError('Sign rules are only available with Massa Wallet');
      return;
    }

    try {
      setError(null);
      const massaWallet = currentWallet as unknown as MassaStationWallet;
      await massaWallet.deleteSignRule(accountName, ruleId);

      console.log('Deleted sign rule:', ruleId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete sign rule',
      );
      throw err;
    }
  };

  return {
    addSignRule,
    editSignRule,
    deleteSignRule,
    isLoading: isPending,
    error: error ?? isError,
    isSuccess,
  };
}
