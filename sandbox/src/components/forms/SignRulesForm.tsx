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

  const { addSignRule, error } = useSignRules();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rule: SignRule = {
      ruleType,
      name: ruleName,
      contract: applyToAllContracts ? '*' : contract,
      enabled: true,
      id: '',
      authorizedOrigin: authorizedOrigin,
    };

    if (!connectedAccount) {
      return;
    }

    try {
      await addSignRule(connectedAccount?.accountName ?? '', rule, description);
    } catch (err) {
      console.error('Failed to handle sign rule:', err);
    }
  };

  const isAllAndAutoSign =
    applyToAllContracts && ruleType === RuleType.AutoSign;
  const shouldDisableSubmit = !ruleName || !contract;

  return (
    <div className="p-6 h-full">
      <h2 className="mas-title mb-4 text-center">Add Sign Rule</h2>
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
                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                id="apply-to-all-contracts"
              />
            </Tooltip>
          ) : (
            <input
              type="checkbox"
              checked={applyToAllContracts}
              onChange={(e) => setApplyToAllContracts(e.target.checked)}
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
              />
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
            disabled={shouldDisableSubmit}
            customClass="flex-1"
          >
            Add Rule
          </Button>
        </div>
      </form>
    </div>
  );
}
