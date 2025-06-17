import { useState } from 'react';
import {
  Button,
  Dropdown,
  Input,
  Tooltip,
  useAccountStore,
} from '@massalabs/react-ui-kit';
import { useSignRules } from '../../hooks/useSignRules';
import { RuleType, SignRule } from '../../../../dist/esm';

export function SignRulesForm() {
  const { connectedAccount } = useAccountStore();
  const [ruleName, setRuleName] = useState('');
  const [contract, setContract] = useState('');
  const [ruleType, setRuleType] = useState<RuleType>(
    RuleType.DisablePasswordPrompt,
  );
  const [applyToAllContracts, setApplyToAllContracts] = useState(false);
  const [authorizedOrigin, setAuthorizedOrigin] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [selectedRuleId, setSelectedRuleId] = useState('');

  const {
    addSignRule,
    editSignRule,
    deleteSignRule,
    isLoading,
    error,
    isSuccess,
  } = useSignRules();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called');
    console.log('ruleName', ruleName);
    const rule: SignRule = {
      ruleType,
      name: ruleName,
      contract: applyToAllContracts ? '*' : contract,
      enabled: true,
      id: selectedRuleId,
      authorizedOrigin: authorizedOrigin,
    };

    if (!connectedAccount) {
      console.log('No connected account');
      return;
    }

    try {
      if (mode === 'add') {
        console.log('Calling addSignRule with:', rule);
        await addSignRule(
          connectedAccount?.accountName ?? '',
          rule,
          description,
        );
        console.log('addSignRule finished');
      } else {
        await editSignRule(
          connectedAccount?.accountName ?? '',
          rule,
          description,
        );
      }

      if (isSuccess) {
        setRuleName('');
        setRuleType(RuleType.DisablePasswordPrompt);
        setContract('');
        setDescription('');
        setAuthorizedOrigin('');
        setSelectedRuleId('');
        setApplyToAllContracts(false);
        setMode('add');
      }
    } catch (err) {
      console.error('Failed to handle sign rule:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedRuleId || !connectedAccount?.accountName) return;

    try {
      await deleteSignRule(connectedAccount?.accountName, selectedRuleId);

      if (isSuccess) {
        setSelectedRuleId('');
        setRuleName('');
        setRuleType(RuleType.DisablePasswordPrompt);
        setContract('');
        setDescription('');
        setAuthorizedOrigin('');
        setApplyToAllContracts(false);
      }
    } catch (err) {
      console.error('Failed to delete sign rule:', err);
    }
  };

  const isAllAndAutoSign =
    applyToAllContracts && ruleType === RuleType.AutoSign;
  const shouldDisableSubmit = !ruleName || !contract;

  return (
    <div className="border border-primary rounded-lg p-6 shadow-md">
      <h2 className="mas-title mb-4 text-center">
        {mode === 'add' ? 'Add Sign Rule' : 'Edit Sign Rule'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-md mx-auto"
      >
        <div>
          <Input
            type="text"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="Rule Name"
            required
            customClass="w-full"
            disabled={isLoading}
          />
        </div>

        <div>
          <Input
            type="text"
            value={applyToAllContracts ? 'All' : contract}
            onChange={(e) => setContract(e.target.value)}
            placeholder="Contract Address"
            required
            customClass="w-full"
            disabled={isLoading || applyToAllContracts}
          />
        </div>

        <div className="flex items-center gap-2">
          {ruleType === RuleType.AutoSign ? (
            <Tooltip
              body="Apply to all contracts is only available for Disable Password Prompt."
              placement="top"
            >
              <input
                type="checkbox"
                checked={applyToAllContracts}
                onChange={(e) => setApplyToAllContracts(e.target.checked)}
                disabled={isLoading || ruleType === RuleType.AutoSign}
                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                id="apply-to-all-contracts"
              />
            </Tooltip>
          ) : (
            <input
              type="checkbox"
              checked={applyToAllContracts}
              onChange={(e) => setApplyToAllContracts(e.target.checked)}
              disabled={isLoading}
              className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              id="apply-to-all-contracts"
            />
          )}
          <label
            htmlFor="apply-to-all-contracts"
            className="text-sm select-none cursor-pointer"
          >
            Apply to all contracts
          </label>
        </div>

        <div>
          <Dropdown
            options={[
              {
                item: (
                  <Tooltip
                    body="Automatically sign transactions without password prompt"
                    placement="top"
                    triggerClassName="truncate w-full"
                    tooltipClassName="text-sm max-w-96"
                  >
                    Auto Sign
                  </Tooltip>
                ),
                onClick: () => setRuleType(RuleType.AutoSign),
              },
              {
                item: 'Disable Password Prompt',
                onClick: () => setRuleType(RuleType.DisablePasswordPrompt),
              },
            ]}
            select={ruleType === RuleType.AutoSign ? 0 : 1}
            defaultItem={{
              item:
                ruleType === RuleType.AutoSign
                  ? 'Auto Sign'
                  : 'Disable Password Prompt',
            }}
            fullWidth
          />
        </div>

        {ruleType === RuleType.AutoSign && (
          <>
            <div>
              <Input
                type="text"
                value={authorizedOrigin}
                onChange={(e) => setAuthorizedOrigin(e.target.value)}
                placeholder="Authorized Origin (e.g., https://example.com)"
                customClass="w-full"
                disabled={isLoading || mode === 'edit'}
              />
              {mode === 'edit' && (
                <p className="text-sm text-gray-500 mt-1">
                  Authorized origin cannot be changed in edit mode
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            customClass="w-full"
            disabled={isLoading}
          />
        </div>

        {isAllAndAutoSign && (
          <p className="text-sm text-red-500">
            Auto Sign cannot be used with "Apply to all contracts"
          </p>
        )}

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isLoading || shouldDisableSubmit}
            customClass="flex-1"
          >
            {isLoading
              ? mode === 'add'
                ? 'Adding...'
                : 'Updating...'
              : mode === 'add'
                ? 'Add Rule'
                : 'Update Rule'}
          </Button>

          {mode === 'edit' && (
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              customClass="flex-1 bg-red-500 hover:bg-red-600"
            >
              {isLoading ? 'Deleting...' : 'Delete Rule'}
            </Button>
          )}
        </div>

        <div className="flex justify-center mt-2">
          <Button
            type="button"
            onClick={() => setMode(mode === 'add' ? 'edit' : 'add')}
            customClass="text-sm"
            disabled={isLoading}
          >
            {mode === 'add' ? 'Switch to Edit Mode' : 'Switch to Add Mode'}
          </Button>
        </div>
      </form>
    </div>
  );
}
