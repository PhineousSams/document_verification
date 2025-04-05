const config = {
  networks: {
    ganache: {
      contractAddress: "0x4FE7B9fAd094561421b4E7A2E3E52C7e79424907",
      rpcUrl: "http://127.0.0.1:7545"
    },
    sepolia: {
      contractAddress: process.env.REACT_APP_SEPOLIA_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
      rpcUrl: `https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`
    }
  },
  accounts: {
    admin: "0x33e7cd84aEba40328d202E8a60b0fC66D38e3412",  // Your admin account 
    maker: "0xA9730bB95d180803033C5924FE53F7c2f3Ee624d"   // Your maker account
  },
  contracts_directory: './src/artifacts/contracts'
};

export default config;