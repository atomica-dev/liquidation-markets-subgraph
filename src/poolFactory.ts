import {
  PoolWallet, PoolData, PoolRate, Factory,
} from '../generated/schema';
import { Pool as PoolContract } from '../generated/Pool/Pool';
import { BigInt, Bytes, Address, log, ByteArray } from '@graphprotocol/graph-ts';
import { Module } from '../generated/Pool/Module';

export const FAR_FUTURE_DATE = '0x00cc5e9107';

const FACTORY_KEY = '1';

export function createPool(id: string, timestamp: BigInt): PoolData {
  let poolWallet = new PoolWallet(id);
  let poolContract = PoolContract.bind(Address.fromString(id));

  let result = poolContract.try_wallet();
  let poolToken = poolContract.poolToken();
  let backToken = poolContract.backToken();

  if (result != null && !result.reverted) {
    poolWallet.wallet = result.value.toHexString();

    let managerResult = Module.bind(result.value).try_manager();

    if (managerResult != null && !managerResult.reverted) {
      poolWallet.manager = managerResult.value.toHexString();
    }
  } else {
    poolWallet.wallet = id;
  }

  poolWallet.poolToken = poolToken.toHexString();
  poolWallet.atDate = timestamp;

  poolWallet.save();

  addPoolToFactory(id);

  let pool = PoolData.load(poolWallet.poolToken);

  if (pool !== null) {
    return pool;
  }

  pool = new PoolData(poolWallet.poolToken);

  pool.originToken = backToken;
  pool.poolToken = poolToken;

  pool.currentPool = Address.fromString(id);
  pool.atDate = timestamp;
  pool.originDate = timestamp;
  pool.participantsCount = 0;
  pool.originTokenBalance = BigInt.fromI32(0);
  pool.poolTokenBalance = BigInt.fromI32(0);
  pool.factory = FACTORY_KEY;
  pool.joinSum = BigInt.fromI32(0);
  pool.exitSum = BigInt.fromI32(0);

  pool.save();

  let rate = new PoolRate(pool.id);

  rate.pool = Address.fromString(id);
  rate.fromDate = timestamp;
  rate.toDate = BigInt.fromUnsignedBytes(<ByteArray>Bytes.fromHexString(FAR_FUTURE_DATE));

  rate.allocated = BigInt.fromI32(0);
  rate.balance = BigInt.fromI32(0);
  rate.totalSupply = BigInt.fromI32(0);

  rate.save();

  return pool;
}

function addPoolToFactory(poolId: string): void {
  let factory = getFactory();

  let p = factory.pools;

  p.push(poolId);
  factory.pools = p;

  factory.save();
}

function getFactory(): Factory {
  let f = Factory.load(FACTORY_KEY);

  if (!f) {
    f = new Factory(FACTORY_KEY);

    f.pools = [];

    f.save();
  }

  return f;
}

export function getFactoryPools(): string[] {
  let f = Factory.load(FACTORY_KEY);

  return f !== null && f.pools !== null ? f.pools : [];
}