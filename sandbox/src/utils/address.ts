export const truncateAddress = (
  address?: string,
  startLength = 6,
  endLength = 4,
) => {
  if (!address) return '';
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};
