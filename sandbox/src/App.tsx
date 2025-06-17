import '@massalabs/react-ui-kit/src/global.css';
import { MassaLogo } from '@massalabs/react-ui-kit';
import './App.css';
import { ConnectButton } from './components/wallet/connect-wallet-popup';
import { ExecuteSCForm } from './components/forms/ExecuteSCForm';
import { DeploySCForm } from './components/forms/DeploySCForm';
import { SignRulesForm } from './components/forms/SignRulesForm';

function App() {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 border-b border-gray-200 bg-white shadow-sm z-50">
        <MassaLogo className="logo w-auto flex items-center" size={50} />
        <ConnectButton />
      </header>
      <div className="flex flex-col min-h-screen pt-16">
        <main className="container mx-auto px-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-50">
              <ExecuteSCForm />
            </div>
            <div className="bg-amber-50">
              <DeploySCForm />
            </div>
          </div>
          <div className="max-w-2xl mx-auto bg-red-50">
            <SignRulesForm />
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
