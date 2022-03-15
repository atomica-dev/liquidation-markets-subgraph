import {
  PoolData,
  PoolEvent,
  PoolRate,
  PoolParticipant,
  PoolAdapter,
  PoolWallet,
} from '../generated/schema';
import {
  LogJoin,
  LogPoolInitialized,
  LogExit,
  Pool as PoolContract,
 } from '../generated/Pool/Pool'

import { getFactoryPools, createPool } from './poolFactory';

export const FAR_FUTURE_DATE = '0x00cc5e9107';

const RATE_UPDATE_INTERVAL = 3600;

enum EventType {
  Join,
  Exit,
  Allocate,
  Payback,
}
import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { LogAllocate, LogPayback } from '../generated/Pool/Pool';

export function handleLogPoolInitialized(event: LogPoolInitialized): void {
  let pw = PoolWallet.load(event.address.toHexString());

  if (!pw) {
    // New pool is created.
    let pool = getPoolData(event.address.toHexString(), event.block.timestamp);

    pool.currentPool = event.address;

    if (pool.initialPoolBalance === null) {
      pool.initialPoolBalance = event.params.rate;
    }

    pool.save();

    return;
  }

  // Migrated.
  let pool = getPoolData(event.address.toHexString(), event.block.timestamp);

  pool.currentPool = event.address;

  pool.save();
}

export function handleJoinEvent(event: LogJoin): void {
  addEntryFromEvent(EventType.Join, event);
}

export function handleAllocateEvent(event: LogAllocate): void {
  addEntryFromEvent(EventType.Allocate, event);
}

export function handlePaybackEvent(event: LogPayback): void {
  addEntryFromEvent(EventType.Payback, event);
}

export function handleExitEvent(event: LogExit): void {
  addEntryFromEvent(EventType.Exit, event);
}

export function addEntryFromEvent(type: EventType, event: ethereum.Event): void {
  addEvent(type, event.parameters[0].value.toAddress(), event.address,
    event.parameters[1].value.toBigInt(),
    event.parameters.length > 2 ? event.parameters[2].value.toBigInt() : BigInt.fromI32(0),
    event.block.timestamp,
    event.transaction.hash.toHex(),
    );
}

export function addEvent(
  type: EventType,
  from: Address,
  poolAddress: Address,
  originTokenAmount: BigInt,
  poolTokenAmount: BigInt,
  timestamp: BigInt,
  id: string,
): void {
  let poolContract = PoolContract.bind(poolAddress);
  let pool = getPoolData(poolAddress.toHexString(), timestamp);
  let participantId = from.toHexString() + pool.id;

  if (type === EventType.Join || type === EventType.Exit) {
    let participant = PoolParticipant.load(participantId);
    let delta = 0;

    if (participant == null) {
      participant = new PoolParticipant(participantId);

      participant.pool = Address.fromString(pool.id);
      participant.originTokenBalance = BigInt.fromI32(0);
      participant.poolTokenBalance = BigInt.fromI32(0);
    }

    if (participant.poolTokenBalance.isZero()) {
      delta = 1;
    }

    if (type === EventType.Join) {
      pool.joinSum = pool.joinSum.plus(originTokenAmount);
      participant.originTokenBalance = participant.originTokenBalance.plus(originTokenAmount);
      participant.poolTokenBalance = participant.poolTokenBalance.plus(poolTokenAmount);
    } else {
      pool.exitSum = pool.exitSum.plus(originTokenAmount);
      participant.originTokenBalance = participant.originTokenBalance.minus(originTokenAmount);
      participant.poolTokenBalance = participant.poolTokenBalance.minus(poolTokenAmount);
    }

    participant.save();

    if (participant.poolTokenBalance.isZero()) {
      delta = -1;
    }

    pool.participantsCount = pool.participantsCount + delta;
  } else if (type === EventType.Allocate) {
    getKeeperAdapter(from.toHexString());
  }

  let result = poolContract.try_poolBackTokenBalance();

  if (result !== null && !result.reverted) {
    pool.originTokenBalance = result.value;
  } else {
    // Reverted in case no wallet set yet. It is setPoolToken method.
    pool.originTokenBalance = originTokenAmount;
  }

  if (pool.initialPoolBalance === null) {
    pool.initialPoolBalance = pool.originTokenBalance;
  }

  pool.poolTokenBalance = poolContract.poolTokenTotalSupply();

  pool.save();

  let event = new PoolEvent(id);

  event.pool = poolAddress;
  event.type = type;
  event.atDate = timestamp;
  event.originTokenAmount = originTokenAmount;
  event.poolTokenAmount = poolTokenAmount;
  event.user = from;

  event.save();

  addRateForPool(pool.id, poolAddress.toHexString(), timestamp, true);
}

export function handleBlock(block: ethereum.Block): void {
  let allPools = getFactoryPools();

  for (let i = 0; i < allPools.length; i++) {
    let poolId = allPools[i];
    let pw = PoolWallet.load(poolId);
    let data = PoolData.load(pw!.poolToken);

    if (data!.currentPool.toHexString() == poolId) {
      addRateForPool(pw!.poolToken, poolId, block.timestamp);
    }
  }
}

function addRateForPool(poolToken: string, poolId: string, timestamp: BigInt, force: boolean = false): void {
  let pRate = PoolRate.load(poolToken);
  let t = timestamp;

  if (!pRate) {
    pRate = new PoolRate(poolToken);

    pRate.pool = Address.fromString(poolToken);
    pRate.fromDate = t.minus(BigInt.fromI32(1));
    pRate.toDate = BigInt.fromUnsignedBytes(Bytes.fromHexString(FAR_FUTURE_DATE) as Bytes);
    pRate.balance = BigInt.fromI32(0);
    pRate.totalSupply = BigInt.fromI32(0);
    pRate.allocated = BigInt.fromI32(0);

    pRate.save();
  }

  if (t.minus(pRate.fromDate).lt(BigInt.fromI32(RATE_UPDATE_INTERVAL)) && !force) {
    return;
  }

  pRate.id = poolToken + pRate.fromDate.toString();
  pRate.toDate = t.minus(BigInt.fromI32(1));

  pRate.save();

  let rate = new PoolRate(poolToken);

  rate.pool = Address.fromString(poolToken);
  rate.fromDate = t;
  rate.toDate = BigInt.fromUnsignedBytes(Bytes.fromHexString(FAR_FUTURE_DATE) as Bytes);

  let poolContract = PoolContract.bind(Address.fromString(poolId));

  let result = poolContract.try_poolBackTokenBalance();
  let allocatedResult = poolContract.try_totalAllocation();

  if (result !== null && !result.reverted) {
    rate.balance = result.value;
  } else {
    // Reverted in case no wallet set yet. It is setPoolToken method.
    rate.balance = BigInt.fromI32(0);
  }

  if (allocatedResult !== null && !allocatedResult.reverted) {
    rate.allocated = allocatedResult.value;
  }

  rate.totalSupply = poolContract.poolTokenTotalSupply();

  rate.save();
}

function getPoolData(address: string, timestamp: BigInt): PoolData {
  let pw = PoolWallet.load(address);

  if (!pw) {
    return createPool(address, timestamp);
  }

  let pool = PoolData.load(pw.poolToken);

  if (pool != null) {
    return pool;
  }

  return createPool(address, timestamp);
}

export function keeperAdapterIsAttachedToPool(id: string, pool: string): boolean {
  let poolContract = PoolContract.bind(Address.fromString(pool));
  let result = poolContract.try_adapters(Address.fromString(id));

  return result !== null && !result.reverted && result.value.gt(BigInt.fromI32(0));
}

export function getKeeperAdapter(id: string): PoolAdapter | null {
  let keeperAdapter = PoolAdapter.load(id);

  if (keeperAdapter !== null) {
    let poolContract = PoolContract.bind(keeperAdapter.pool as Address);
    let result = poolContract.try_adapters(Address.fromString(id));

    if (result !== null && !result.reverted && result.value.gt(BigInt.fromI32(0))) {
      return keeperAdapter;
    }
  }

  let allPools = getFactoryPools();

  for (let i = 0; i < allPools.length; i++) {
    let poolId = allPools[i];

    let poolContract = PoolContract.bind(Address.fromString(poolId));

    let result = poolContract.try_adapters(Address.fromString(id));

    if (result != null && !result.reverted && result.value.gt(BigInt.fromI32(0))) {
        keeperAdapter = new PoolAdapter(id);

        keeperAdapter.pool = Address.fromString(poolId);

        keeperAdapter.save();

        return keeperAdapter;
    }
  }

  return null;
}
