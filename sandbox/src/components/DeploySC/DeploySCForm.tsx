import { Button, Input } from '@massalabs/react-ui-kit';
import { useState } from 'react';
import { useDeploySC } from '../../hooks/useDeploySC';

export function ExecuteSCForm() {
  const [name, setName] = useState('');
  const { deploySC, isLoading, error, events } = useDeploySC();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await deploySC(name);
  };

  return (
    <div className="border border-primary rounded-lg p-6 shadow-md">
      <h2 className="mas-title mb-4 text-center">Deploy SC</h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-md mx-auto"
      >
        <div>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name"
            required
            customClass="w-full"
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <Button type="submit" disabled={isLoading} customClass="w-full">
          {isLoading ? 'Deploying...' : 'Deploy Smart Contract'}
        </Button>
        {events && events.length > 0 && (
          <div className="mt-4">
            <h3 className="mas-title mb-2">Events:</h3>
            <ul className="list-disc list-inside">
              {events.map((event, index) => (
                <li key={index}>{event.data.toString()}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
