export function isStandalone(): boolean {
  // this is eventually set by wallet web-app
  return (
    typeof window !== 'undefined' && Boolean(window.massaWallet?.standalone)
  );
}
