import '@massalabs/react-ui-kit/src/global.css';
import { MassaLogo } from '@massalabs/react-ui-kit';
import './App.css';
import { ConnectButton } from './components/wallet/connect-wallet-popup';
import { DeploySCForm, ExecuteSCForm } from './components';

function App() {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 py-4 bg-white">
        <MassaLogo className="logo" size={100} />
        <ConnectButton />
      </header>
      <div className="flex flex-col min-h-screen pt-32">
        <main className="flex-1 flex justify-center items-start pt-10">
          <ExecuteSCForm />
          <DeploySCForm />
        </main>
      </div>
    </>
  );
}

export default App;
