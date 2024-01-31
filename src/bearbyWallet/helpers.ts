import { CHAIN_ID } from "@massalabs/web3-utils";

export function getRpcByChainId(chainId: bigint): string {
    switch (chainId) {
        case CHAIN_ID.MainNet:
            return 'https://mainnet.massa.net/api/v2';
        case CHAIN_ID.BuildNet:
            return 'https://buildnet.massa.net/api/v2';
        default:
            return '';
    }
}

export function getdRpcByNetworkName(name: string): string {
    switch (name) {
        case 'Mainnet':
            return 'https://mainnet.massa.net/api/v2';
        case "Buildnet":
            return 'https://buildnet.massa.net/api/v2';
        default:
            return '';
    }
}