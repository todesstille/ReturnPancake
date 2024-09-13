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
        if (tokenBalance.toString() == "0") {
            console.log("No tokens to swap.");
            return;
        }

        let tx = await token.approve(PANCAKESWAP_ROUTER_ADDRESS, tokenBalance);
        await tx.wait();

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

        tx = await router.exactInputSingle(params, {
            gasLimit: 3000000n
        });

        console.log("txHash:", tx.hash);
        await tx.wait();

    } catch (error) {
        console.error('Error swapping tokens:', error);
    }
}

swapTokensForWBNB().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
