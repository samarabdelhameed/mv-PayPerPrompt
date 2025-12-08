import { AptosAccount, AptosClient, FaucetClient } from "aptos";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const NODE_URL = process.env.NODE_URL || "https://testnet.aptoslabs.com";
const FAUCET_URL = process.env.FAUCET_URL || "https://faucet.testnet.aptoslabs.com";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!DEPLOYER_PRIVATE_KEY) {
  throw new Error("Please set DEPLOYER_PRIVATE_KEY in .env file");
}

const client = new AptosClient(NODE_URL);
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

async function main() {
  console.log("🚀 Starting PayPerPrompt contract deployment...");

  // Create deployer account
  const deployer = new AptosAccount(Buffer.from(DEPLOYER_PRIVATE_KEY, "hex"));
  console.log(`Deployer address: ${deployer.address()}`);

  // Fund deployer account if needed
  try {
    await faucetClient.fundAccount(deployer.address(), 100_000_000);
    console.log("✅ Funded deployer account");
  } catch (error) {
    console.log("Deployer already funded or faucet issue");
  }

  // Compile Move package
  console.log("📦 Compiling Move package...");
  const moveDir = path.join(__dirname, "..");

  // Read and compile each module
  const modules = [
    "agent_registry",
    // Add other modules here as we create them
  ];

  const compiledModules: { name: string; bytecode: string }[] = [];

  for (const module of modules) {
    const modulePath = path.join(moveDir, `build/PayPerPrompt/bytecode_modules/${module}.mv`);
    
    if (!fs.existsSync(modulePath)) {
      console.error(`Module ${module} not compiled. Run 'aptos move compile' first.`);
      process.exit(1);
    }

    const bytecode = fs.readFileSync(modulePath);
    compiledModules.push({
      name: module,
      bytecode: `0x${bytecode.toString("hex")}`,
    });
    console.log(`✅ Compiled: ${module}`);
  }

  // Deploy modules
  console.log("\n📤 Deploying modules...");

  for (const module of compiledModules) {
    console.log(`Deploying ${module.name}...`);

    const payload = {
      type: "module_bundle_payload",
      modules: [
        {
          bytecode: module.bytecode,
        },
      ],
    };

    try {
      const txn = await client.generateTransaction(deployer.address(), payload);
      const signedTxn = await client.signTransaction(deployer, txn);
      const pendingTxn = await client.submitTransaction(signedTxn);
      const result = await client.waitForTransaction(pendingTxn.hash);

      console.log(`✅ ${module.name} deployed successfully!`);
      console.log(`   Transaction: ${result.hash}`);
      console.log(`   Version: ${result.version}`);

      // Store deployment info
      const deploymentInfo = {
        module: module.name,
        address: deployer.address().toString(),
        transaction: result.hash,
        timestamp: new Date().toISOString(),
      };

      const deploymentsFile = path.join(__dirname, "../deployments.json");
      let deployments = [];
      if (fs.existsSync(deploymentsFile)) {
        deployments = JSON.parse(fs.readFileSync(deploymentsFile, "utf8"));
      }
      deployments.push(deploymentInfo);
      fs.writeFileSync(deploymentsFile, JSON.stringify(deployments, null, 2));
    } catch (error) {
      console.error(`❌ Failed to deploy ${module.name}:`, error);
      process.exit(1);
    }
  }

  // Initialize the contract
  console.log("\n🔧 Initializing contract...");

  try {
    const payload = {
      type: "entry_function_payload",
      function: `${deployer.address()}::agent_registry::initialize`,
      type_arguments: [],
      arguments: [],
    };

    const txn = await client.generateTransaction(deployer.address(), payload);
    const signedTxn = await client.signTransaction(deployer, txn);
    const pendingTxn = await client.submitTransaction(signedTxn);
    await client.waitForTransaction(pendingTxn.hash);

    console.log("✅ Contract initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize contract:", error);
  }

  // Test deployment
  console.log("\n🧪 Testing deployment...");

  try {
    // Try to register a test agent
    const testAgentPayload = {
      type: "entry_function_payload",
      function: `${deployer.address()}::agent_registry::register_agent`,
      type_arguments: [],
      arguments: [
        "TestAgent",
        "Test agent deployed automatically",
        "500", // 0.0005 MOVE
        "100000000", // max spending
        "0", // category
        "https://api.test.com",
        "0", // provider
        "gpt-4",
        "1000000", // 1 MOVE stake
      ],
    };

    const txn = await client.generateTransaction(deployer.address(), testAgentPayload);
    const signedTxn = await client.signTransaction(deployer, txn);
    const pendingTxn = await client.submitTransaction(signedTxn);
    const result = await client.waitForTransaction(pendingTxn.hash);

    console.log("✅ Test agent registered successfully!");
    console.log(`   Transaction: ${result.hash}`);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }

  // Generate environment file for frontend
  console.log("\n📝 Generating environment files...");

  const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${deployer.address()}
NEXT_PUBLIC_NODE_URL=${NODE_URL}
NEXT_PUBLIC_NETWORK=testnet`;

  fs.writeFileSync(path.join(__dirname, "../../web/.env.local"), envContent);
  fs.writeFileSync(path.join(__dirname, "../../relay/.env.local"), envContent);

  console.log("\n🎉 Deployment completed successfully!");
  console.log(`📊 Contract address: ${deployer.address()}`);
  console.log(`🌐 Node URL: ${NODE_URL}`);
  console.log("\n📋 Next steps:");
  console.log("1. Run tests: npm test");
  console.log("2. Start frontend: cd web && npm run dev");
  console.log("3. Start relay: cd relay && npm start");
}

main().catch(console.error);
