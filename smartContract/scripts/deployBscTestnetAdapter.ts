import { JsonRpcProvider, Wallet, ContractFactory, Contract, formatEther } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const abis = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../frontEnd/src/constants/abis.json"), "utf8"));

dotenv.config();

const BSC_TESTNET_RPC = "https://bsc-testnet-rpc.publicnode.com";
const AMOY_RPC = process.env.POLYGON_AMOY_RPC_URL || "https://polygon-amoy-bor-rpc.publicnode.com";

const PRIVATE_KEY = process.env.POLYGON_AMOY_PRIVATE_KEY || process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY is missing in .env");

const cleanKey = PRIVATE_KEY.trim().startsWith("0x") ? PRIVATE_KEY.trim() : `0x${PRIVATE_KEY.trim()}`;

const AMOY_WRAPPER_ADDRESS = "0x2C74e4FBC2Da0DAE929c7f717Fc921bd81015C68";
const TREASURY_ADDRESS = "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926";
const ADMIN_ADDRESS = "0x9B5AfF6e8e7d6079bf35E77e35492f8e49e39c8E";

async function main() {
  console.log("==================================================");
  console.log("Deploying SourceDepositAdapter to BNB Smart Chain Testnet (Chain ID 97)");
  
  const bscProvider = new JsonRpcProvider(BSC_TESTNET_RPC);
  const bscWallet = new Wallet(cleanKey, bscProvider);
  
  console.log(`Deployer Wallet: ${bscWallet.address}`);
  const bscBal = await bscProvider.getBalance(bscWallet.address);
  console.log(`BSC Testnet BNB Balance: ${formatEther(bscBal)} BNB`);
  console.log("==================================================");

  if (bscBal === 0n) {
    throw new Error("Deployer wallet has 0 BNB on BSC Testnet. Please fund wallet with BSC Testnet BNB.");
  }

  const mockUsdtArtifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../artifacts/contracts/mocks/MockUSDT.sol/MockUSDT.json"), "utf8"));
  const adapterArtifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../artifacts/contracts/SourceDepositAdapter.sol/SourceDepositAdapter.json"), "utf8"));

  // 1. Deploy BSC Testnet MockUSDT
  console.log("\n[1/3] Deploying MockUSDT on BSC Testnet...");
  const usdtFactory = new ContractFactory(mockUsdtArtifact.abi, mockUsdtArtifact.bytecode, bscWallet);
  const usdtContract = await usdtFactory.deploy();
  await usdtContract.waitForDeployment();
  const usdtAddress = await usdtContract.getAddress();
  console.log(`✓ BSC Testnet MockUSDT deployed at: ${usdtAddress}`);

  // Mint 10,000 BSC Testnet USDT to deployer for testing
  console.log("Minting 10,000 BSC Testnet USDT to deployer...");
  const mintTx = await (usdtContract as any).mint(bscWallet.address, 10_000_000_000n);
  await mintTx.wait();
  console.log("✓ Minted 10,000 BSC Testnet USDT to deployer");

  // 2. Deploy SourceDepositAdapter on BSC Testnet
  console.log("\n[2/3] Deploying SourceDepositAdapter on BSC Testnet...");
  const adapterFactory = new ContractFactory(adapterArtifact.abi, adapterArtifact.bytecode, bscWallet);
  // Constructor: [usdt, treasury_, admin, destinationChainId (80002), wrapper, min6 (1 USDT = 1_000_000), max6 (1M USDT)]
  const adapterContract = await adapterFactory.deploy(
    usdtAddress,
    TREASURY_ADDRESS,
    ADMIN_ADDRESS,
    80002n, // Polygon Amoy
    AMOY_WRAPPER_ADDRESS,
    1_000_000n, // $1 USDT min
    1_000_000_000_000n // $1,000,000 USDT max
  );
  await adapterContract.waitForDeployment();
  const adapterAddress = await adapterContract.getAddress();
  console.log(`✓ BSC Testnet SourceDepositAdapter deployed at: ${adapterAddress}`);

  // 3. Configure USDTcWrapper on Polygon Amoy (Chain ID 80002)
  console.log("\n[3/3] Configuring USDTcWrapper on Polygon Amoy for Chain 97...");
  const amoyProvider = new JsonRpcProvider(AMOY_RPC);
  const amoyWallet = new Wallet(cleanKey, amoyProvider);
  const wrapperContract = new Contract(AMOY_WRAPPER_ADDRESS, abis.USDTcWrapper, amoyWallet);

  try {
    const existingAdapter = await wrapperContract.adapters(97n);
    if (existingAdapter && existingAdapter !== "0x0000000000000000000000000000000000000000") {
      console.log(`Adapter for Chain 97 is already configured: ${existingAdapter}`);
    } else {
      console.log(`Calling wrapperContract.configureSource(97, ${adapterAddress})...`);
      const configTx = await wrapperContract.configureSource(97n, adapterAddress);
      console.log(`Tx sent: ${configTx.hash}. Waiting for confirmation...`);
      await configTx.wait();
      console.log("✓ USDTcWrapper on Polygon Amoy configured for BSC Testnet (Chain ID 97)!");
    }
  } catch (err: any) {
    console.warn("Notice during wrapper configuration:", err.message);
  }

  console.log("\n==================================================");
  console.log("BSC TESTNET (CHAIN ID 97) DEPLOYMENT COMPLETE!");
  console.log(`BSC Testnet USDT Token:       ${usdtAddress}`);
  console.log(`BSC Testnet Deposit Adapter:  ${adapterAddress}`);
  console.log(`Polygon Amoy USDT.c Wrapper:  ${AMOY_WRAPPER_ADDRESS}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
