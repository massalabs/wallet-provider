export type GetSnapsResponse = Record<string, Snap>;

export type Snap = {
  permissionName: string;
  id: string;
  version: string;
  initialPermissions: Record<string, unknown>;
};

export interface MetaMaskProvider {
  isMetaMask: boolean;
  request(options: { method: string }): Promise<void>;
}
