import { BUILDNET_TOKENS, Mas } from '@massalabs/massa-web3';
import { MassaStationAccount } from '../../src';
import { accountName, msWallet } from '../setup';
import { RuleType, SignRule } from '../../src/massaStation/types';

let account: MassaStationAccount;

describe('MassaStation wallet sign rules tests', () => {
  beforeAll(async () => {
    const accounts = await msWallet.accounts();
    const acc = accounts.find((acc) => acc.accountName === accountName);
    if (!acc) {
      throw new Error(`Account ${accountName} not found`);
    }
    account = acc;
    const balance = await account.balance();
    // eslint-disable-next-line no-console
    console.log(
      `Using account ${account.accountName} with address ${
        account.address
      }. balance: ${Mas.toString(balance, 2)}`,
    );
  });

  // Unskip the test when wallet 0.5.2 is released
  it.skip('Add/edit/delete SignRule', async () => {
    const expectedId = 'a990e7dab2';
    const newRule: SignRule = {
      name: 'RuleName',
      ruleType: RuleType.DisablePasswordPrompt,
      contract: BUILDNET_TOKENS.DAIs,
      enabled: true,
    };

    // Add the rule
    const { id } = await msWallet.addSignRule(
      accountName,
      newRule,
      'the description',
    );

    expect(id).toEqual(expectedId);

    // Check the rule is added
    let cfg = await msWallet.getConfig();
    let accountConfig = cfg.accounts[accountName];
    expect(accountConfig.signRules).toContainEqual({
      ...newRule,
      id: expectedId,
    });

    // Edit the rule
    const { id: editId } = await msWallet.editSignRule(
      accountName,
      { ...newRule, id: expectedId, enabled: false },
      'an edition description',
    );
    expect(editId).toEqual(expectedId);

    // Check the rule is edited
    cfg = await msWallet.getConfig();
    accountConfig = cfg.accounts[accountName];
    expect(accountConfig.signRules).toContainEqual({
      ...newRule,
      enabled: false,
      id: expectedId,
    });

    // Delete the rule
    await msWallet.deleteSignRule(accountName, expectedId);

    // Check the rule is deleted
    cfg = await msWallet.getConfig();
    accountConfig = cfg.accounts[accountName];
    expect(
      accountConfig.signRules.find((r) => r.name === newRule.name),
    ).toBeUndefined();
  });

  it.skip('Add multiple SignRules and delete', async () => {
    const rule1: SignRule = {
      name: 'Rule1',
      ruleType: RuleType.DisablePasswordPrompt,
      contract: BUILDNET_TOKENS.WETHs,
      enabled: true,
    };

    const rule2: SignRule = {
      name: 'Rule2',
      ruleType: RuleType.AutoSign,
      contract: BUILDNET_TOKENS.DAIs,
      enabled: true,
    };

    // Add the first rule
    const { id: id1 } = await msWallet.addSignRule(
      accountName,
      rule1,
      'description for rule1',
    );

    // Add the second rule
    const { id: id2 } = await msWallet.addSignRule(
      accountName,
      rule2,
      'description for rule2',
    );

    // Check both rules are added
    let cfg = await msWallet.getConfig();
    let accountConfig = cfg.accounts[accountName];
    expect(accountConfig.signRules).toContainEqual({ ...rule1, id: id1 });
    expect(accountConfig.signRules).toContainEqual({ ...rule2, id: id2 });

    // Delete the first rule
    await msWallet.deleteSignRule(accountName, id1);

    // Check the first rule is deleted and the second rule still exists
    cfg = await msWallet.getConfig();
    accountConfig = cfg.accounts[accountName];
    expect(accountConfig.signRules).not.toContainEqual({ ...rule1, id: id1 });
    expect(accountConfig.signRules).toContainEqual({ ...rule2, id: id2 });

    // Delete the second rule
    await msWallet.deleteSignRule(accountName, id2);

    // Check both rules are deleted
    cfg = await msWallet.getConfig();
    accountConfig = cfg.accounts[accountName];
    expect(accountConfig.signRules).not.toContainEqual({ ...rule1, id: id1 });
    expect(accountConfig.signRules).not.toContainEqual({ ...rule2, id: id2 });
  });

  it.skip('Attempt to delete a non-existent SignRule', async () => {
    const nonExistentId = 'non-existent-id';

    // Attempt to delete a non-existent rule
    await expect(
      msWallet.deleteSignRule(accountName, nonExistentId),
    ).rejects.toThrow(`Rule ID ${nonExistentId} not found`);
  });
});
