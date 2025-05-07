import { Button, useAccountStore } from '@massalabs/react-ui-kit';
import { useState } from 'react';
import { ConnectWalletPopup } from './ConnectWalletPopup';
import { truncateAddress } from '../../../utils/address';

export function ConnectButton() {
  const [open, setOpen] = useState(false);
  const { connectedAccount, isFetching } = useAccountStore();

  function ConnectedWallet() {
    return (
      <Button
        disabled={isFetching}
        variant="secondary"
        customClass="h-[25px] text-primary dark:text-primary"
        onClick={() => setOpen(true)}
      >
        {truncateAddress(connectedAccount!.address)}
      </Button>
    );
  }

  function NotConnectedWallet() {
    return (
      <Button
        variant="secondary"
        disabled={isFetching}
        customClass="h-[54px] text-primary dark:text-primary"
        onClick={() => setOpen(true)}
      >
        {'Connect Wallet'}
      </Button>
    );
  }

  return (
    <>
      <div className="shadow-md rounded-lg border-primary border hover:shadow-lg hover:-translate-y-0.5 transition-transform duration-200 active:translate-y-0.5">
        {connectedAccount ? <ConnectedWallet /> : <NotConnectedWallet />}
      </div>

      {open && <ConnectWalletPopup setOpen={setOpen} />}
    </>
  );
}
