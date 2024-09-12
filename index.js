require('dotenv').config();
const { ethers } = require('ethers');
const { abi: pancakeRouterAbi } = require('./IPancakeRouter.json');
const erc20Abi = require('./erc20.json');

const provider = ethers.getDefaultProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const PANCAKESWAP_ROUTER_ADDRESS = process.env.PANCAKESWAP_ROUTER_ADDRESS;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const WBNB_ADDRESS = process.env.WBNB_ADDRESS;

const router = new ethers.Contract(PANCAKESWAP_ROUTER_ADDRESS, pancakeRouterAbi, wallet);
const token = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, wallet);

async function swapTokensForWBNB() {
    try {
        const tokenBalance = await token.balanceOf(wallet.address);
        console.log(tokenBalance)
        if (tokenBalance == 0) {
            console.log("No tokens to swap.");
            return;
        }

        console.log(`Token Balance: ${ethers.formatUnits(tokenBalance, await token.decimals())} Tokens`);

        const approveTx = await token.approve(PANCAKESWAP_ROUTER_ADDRESS, tokenBalance);
        console.log(`Approving tokens... Transaction hash: ${approveTx.hash}`);
        await approveTx.wait();
        console.log('Approval successful');

        const params = {
            tokenIn: TOKEN_ADDRESS,
            tokenOut: WBNB_ADDRESS,
            fee: 100,
            recipient: wallet.address,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 10),
            amountIn: tokenBalance,
            amountOutMinimum: 0n,
            sqrtPriceLimitX96: 0n
        };

        const swapTx = await router.exactInputSingle(params, {
            gasLimit: 3000000n
        });

        console.log(`Swapping tokens... Transaction hash: ${swapTx.hash}`);
        await swapTx.wait();
        console.log('Swap successful');

    } catch (error) {
        console.error('Error swapping tokens:', error);
    }
}

swapTokensForWBNB().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
