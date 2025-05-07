import '@massalabs/react-ui-kit/src/global.css';
import { MassaLogo } from '@massalabs/react-ui-kit';
import './App.css';
import { ConnectButton } from './components/wallet/connect-wallet-popup';

/**
 * App component that handles interactions with a Massa smart contract
 * @returns The rendered component
 */
function App() {
  return (
    <>
      <div>
        <MassaLogo className="logo" size={100} />
        <div className="flex pt-10">
          <ConnectButton />
        </div>
      </div>
    </>
  );
}

export default App;
