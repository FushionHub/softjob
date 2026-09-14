const WALLETS = {
  BTC: {
    id: 'BTC',
    name: 'Bitcoin',
    symbol: 'BTCUSDT',
    icon: '₿',
    color: '#f7931a',
    network: 'BTC',
    address: process.env.BTC_DEPOSIT_ADDRESS || 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  },
  ETH: {
    id: 'ETH',
    name: 'Ethereum',
    symbol: 'ETHUSDT',
    icon: 'Ξ',
    color: '#627eea',
    network: 'ERC20',
    address: process.env.ETH_DEPOSIT_ADDRESS || '0x71C836eB3F3d44F6bF0Fe331d279148d4b3bEAc2',
  },
  USDT: {
    id: 'USDT',
    name: 'Tether',
    symbol: 'USDTUSDT',
    icon: '$',
    color: '#26a17b',
    network: 'TRC20',
    address: process.env.USDT_DEPOSIT_ADDRESS || 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
  },
};

export function getWallet(coinId) {
  return WALLETS[coinId] || null;
}

export function getWalletAddress(coinId) {
  const w = WALLETS[coinId];
  return w ? w.address : null;
}

export function getAllWallets() {
  return Object.values(WALLETS);
}

export default WALLETS;
