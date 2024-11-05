export type GetSnapsResponse = Record<string, Snap>;

export type Snap = {
  permissionName: string;
  id: string;
  version: string;
  initialPermissions: Record<string, unknown>;
};

export type AccountBalanceResponse = {
  finalBalance: string;
  candidateBalance: string;
};

export type ActiveAccountResponse = {
  address: string;
};

export type NetworkResponse = {
  network: string;
  chainId: string;
  minimalFees: string;
};
