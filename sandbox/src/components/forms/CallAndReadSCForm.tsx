import { useState } from 'react';
import { Input, Button } from '@massalabs/react-ui-kit';
import {
  HELLO_WORLD_CONTRACT,
  useCallAndReadSC,
} from '../../hooks/useCallAndReadSC';

export function CallAndReadSCForm() {
  const [value, setValue] = useState('');
  const { callSC, readSC, readValue, isPending, isError, isSuccess, error } =
    useCallAndReadSC();

  return (
    <div className="p-6  h-full">
      <h2 className="mas-title mb-4 text-center">Call & Read HelloWorld SC</h2>
      <div className="mb-4 text-sm text-gray-700 bg-blue-100 rounded p-2">
        This example interacts with the <b>HelloWorld</b> contract on{' '}
        <b>buildnet</b>.<br />
        Contract address is hardcoded:{' '}
        <span className="font-mono">{HELLO_WORLD_CONTRACT}</span>
      </div>
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value to write (for setValue)"
          customClass="w-full"
          disabled={isPending}
        />
        <div className="flex gap-2">
          <Button
            onClick={() => callSC(value)}
            disabled={isPending || !value}
            customClass="flex-1"
          >
            {isPending ? 'Writing...' : 'Write'}
          </Button>
          <Button
            onClick={() => readSC()}
            disabled={isPending}
            customClass="flex-1"
            variant="secondary"
          >
            Read
          </Button>
        </div>
        {readValue && (
          <div className="text-blue-600 text-sm">Read value: {readValue}</div>
        )}
        {isError && <div className="text-red-500 text-sm">Error</div>}
        {isSuccess && <div className="text-green-500 text-sm">Success</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
    </div>
  );
}
