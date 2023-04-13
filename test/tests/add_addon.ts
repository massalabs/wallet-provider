import * as webExt from 'web-ext';

async function installExtension(extensionPath: string): Promise<void> {
  const result = await webExt.default.cmd(['--install-manifest', extensionPath, '--temporary']);
}

export async function main() {
  const extensionPath = '../massa-wallet-provider-content-script/plugin';
  await installExtension(extensionPath);
}

