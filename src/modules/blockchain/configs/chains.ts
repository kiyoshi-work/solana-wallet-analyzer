export const CHAINS = {
  1010: {
    chainId: 101,
    isMainnet: false,
    name: 'Solana Devnet',
    url: process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
    explorerUrl: 'https://testnet.blastscan.io',
  },
  101: {
    chainId: 101,
    isMainnet: true,
    name: 'Solana Mainnet',
    url:
      process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
  },
};
