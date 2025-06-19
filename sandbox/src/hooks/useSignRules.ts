import { useState } from 'react';
import { useAccountStore } from '@massalabs/react-ui-kit';
import { MassaStationWallet, SignRule, WalletName } from '../../../dist/esm';

export function useSignRules() {
  const { connectedAccount, currentWallet } = useAccountStore();
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

  return {
    addSignRule,
    error: error,
  };
}
