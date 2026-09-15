import {network} from 'hardhat';import fs from 'node:fs';
if(!process.env.DEPLOYMENT_CONFIG)throw Error('DEPLOYMENT_CONFIG is required');
const config=JSON.parse(fs.readFileSync(process.env.DEPLOYMENT_CONFIG,'utf8'));
const {ethers}=await network.create();const [admin]=await ethers.getSigners();if(!admin)throw Error('Admin signer required');
if(Number((await ethers.provider.getNetwork()).chainId)!==config.chainId)throw Error('Wrong destination chain');
const wrapper=await ethers.getContractAt('USDTcWrapper',config.wrapper,admin);
for(const source of config.sources){const current=await wrapper.adapters(source.chainId);if(current===ethers.ZeroAddress){await(await wrapper.configureSource(source.chainId,source.adapter)).wait();}else if(current.toLowerCase()!==source.adapter.toLowerCase())throw Error('An immutable source conflicts with configuration');}
console.log('Source adapters configured');
