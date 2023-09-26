export type ExecuteFunctionBody = {
  nickname: string;
  name: string;
  at: string;
  args?: string;
  fee?: string;
  maxGas?: string;
  coins?: number; // number types kept for backward compatibility.
  async?: boolean;
};

export type PluginInfo = {
  author: string;
  description: string;
  home: string;
  name: string;
  status: string;
  version: string;
};

export type PluginManagerBody = PluginInfo[];
