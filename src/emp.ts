import {
  UMALiquidation,
  EMP,
  UMALiquidationSummary,
  PoolWallet,
} from '../generated/schema';
import {
  CreatedExpiringMultiParty,
 } from '../generated/EMPCreator/ExpiringMultiPartyCreator';
import {
  ExpiringMultiParty as EMPContract,
  LiquidationCreated,
  LiquidationDisputed,
  LiquidationWithdrawn,
  DisputeSettled,
} from '../generated/EMPCreator/ExpiringMultiParty';
import  {
  EMPTemplate,
} from '../generated/templates';
import { LiquidationStatusEnum, addOrUpdateLiquidation, VenueEnum, updateLiquidationStatus, updateLiquidationStatusById } from './liquidations'
import { BigInt, Address } from '@graphprotocol/graph-ts';
import { BalancerPool } from '../generated/templates/EMPTemplate/BalancerPool';
import { LogTake } from '../generated/UmaKeeperAdapter/UmaKeeperAdapter';
import { getKeeperAdapter } from './pool';

let BASE_EXPONENT = BigInt.fromI32(1000000000).times(BigInt.fromI32(1000000000));

export function handleCreatedExpiringMultiParty(event: CreatedExpiringMultiParty): void {
  let id = event.params.expiringMultiPartyAddress;
  let emp = new EMP(id.toHexString());
  let empContract = EMPContract.bind(id);

  let r1 = empContract.try_priceIdentifier();
  let r2 = empContract.try_collateralCurrency();
  let r3 = empContract.try_collateralCurrency();

  if (r1 !== null && !r1.reverted) {
    emp.priceFeed = r1.value;
  }

  if (r2 !== null && !r2.reverted) {
    emp.collateralCurrency = r2.value;
  }

  if (r3 !== null && !r3.reverted) {
    emp.tokenCurrency = r3.value;
  }

  emp.liquidationsCount = 0;

  emp.save();

  EMPTemplate.create(id);
}

export function handleLiquidationCreated(event: LiquidationCreated): void {
  let emp = EMP.load(event.address.toHexString());

  if (!emp) {
    return;
  }

  let keeperAdapter = getKeeperAdapter(event.params.liquidator.toHexString());
  let id = event.address.toHexString() + event.params.sponsor.toHexString() + event.params.liquidationId.toString();

  emp.liquidationsCount += 1;
  emp.save();

  let liquidation = new UMALiquidation(id);

  liquidation.num = emp.liquidationsCount;
  liquidation.empId = emp.id;
  liquidation.sponsor = event.params.sponsor;
  liquidation.liquidationId = event.params.liquidationId;
  liquidation.liquidationTimestamp = event.params.liquidationTime;
  liquidation.latestTransaction = event.transaction.hash;
  liquidation.lockedCollateral = event.params.lockedCollateral;
  liquidation.liquidatedCollateral = event.params.liquidatedCollateral;
  liquidation.liquidatedTokens = event.params.tokensOutstanding;

  liquidation.blockNumber = event.block.number;
  liquidation.gasLimit = event.transaction.gasLimit;
  liquidation.gasPrice = event.transaction.gasPrice;
  liquidation.isOur = keeperAdapter !== null;
  liquidation.status = LiquidationStatusEnum.UmaLiquidationCreated;

  if (emp.priceFeed !== null) {
    liquidation.price = getExchangePriceFor(liquidation.liquidatedCollateral, emp.priceFeed!.toString());
  }

  if (liquidation.isOur) {
    let poolToken = PoolWallet.load(keeperAdapter!.pool.toHexString())!.poolToken;
    let summary = getLiquidationSummary(poolToken);

    liquidation.pool = keeperAdapter!.pool;
    liquidation.poolToken = poolToken;

    summary.total += 1;
    let discount: BigInt|null;

    if (liquidation.price !== null && liquidation.price != BigInt.fromI32(-1)) {
      discount = liquidation.liquidatedTokens.times(BASE_EXPONENT).div(liquidation.liquidatedCollateral)
        .times(BASE_EXPONENT).div(liquidation.price!).minus(BASE_EXPONENT)
        .times(BigInt.fromI32(100));

      summary.discountSum = summary.discountSum.plus(discount);
    }

    addOrUpdateLiquidation(event, id, poolToken, VenueEnum.Uma, LiquidationStatusEnum.UmaLiquidationCreated,
      false, emp.collateralCurrency!.toHexString(), event.params.liquidatedCollateral, liquidation.price,
      event.params.tokensOutstanding, BigInt.fromI32(0), null);

    summary.save();
  }

  liquidation.save();
}

export function handleLiquidationDisputed(event: LiquidationDisputed): void {
  let keeperAdapter = getKeeperAdapter(event.params.disputer.toHexString());
  let id = event.address.toHexString() + event.params.sponsor.toHexString() + event.params.liquidationId.toString();
  let liquidation = UMALiquidation.load(id);

  if (!liquidation) {
    return;
  }

  liquidation.disputer = event.params.disputer;
  liquidation.isOur = liquidation.isOur || keeperAdapter !== null;
  liquidation.status = LiquidationStatusEnum.UmaLiquidationDisputed;

  if (liquidation.isOur && !liquidation.pool) {
    let poolToken = PoolWallet.load(keeperAdapter!.pool.toHexString())!.poolToken;

    updateLiquidationStatusById(id, poolToken, LiquidationStatusEnum.UmaLiquidationDisputed, false);

    if (liquidation.pool) {
      // Our liquidation is disputed
    } else {
      // We disputing
      liquidation.pool = keeperAdapter!.pool;
      liquidation.poolToken = poolToken;
    }
  }

  liquidation.save();
}

export function handleDisputeSettled(event: DisputeSettled): void {
  let id = event.address.toHexString() + event.params.sponsor.toHexString() + event.params.liquidationId.toString();
  let liquidation = UMALiquidation.load(id);

  if (!liquidation) {
    return;
  }

  liquidation.disputeSucceeded = event.params.disputeSucceeded;
  liquidation.status = LiquidationStatusEnum.UmaLiquidationSettled;

  liquidation.save();

  if (liquidation.poolToken !== null) {
    updateLiquidationStatusById(id, liquidation.poolToken, LiquidationStatusEnum.UmaLiquidationSettled, !event.params.disputeSucceeded);
  }

  if (liquidation.poolToken !== null) {
    let summary = getLiquidationSummary(liquidation.poolToken);

    summary.wonCount += liquidation.disputeSucceeded ? -1 : 1;

    summary.save();
  }
}

export function handleLogTake(event: LogTake): void {
  let id = event.params.emp.toHexString() + event.params.sponsor.toHexString() + event.params.liquidationId.toString();
  let liquidation = UMALiquidation.load(id);

  if (!liquidation) {
    return;
  }

  let emp = EMP.load(event.params.emp.toHexString());
  let summary = getLiquidationSummary(liquidation.poolToken);
  let isOurWin = liquidation.pool !== null && liquidation.disputer === null;

  summary.finished += 1;

  if (isOurWin) {
    summary.wonCount += 1;
  }

  summary.save();

  liquidation.withdrawalAmount = event.params.collateralAmount;
  liquidation.withdrawnAt = event.block.timestamp;
  liquidation.withdrawTransaction = event.transaction.hash;
  liquidation.settlementPrice = liquidation.liquidatedTokens.times(BASE_EXPONENT).div(event.params.collateralAmount);
  liquidation.status = LiquidationStatusEnum.UmaLiquidationWithdrawn;

  let price: BigInt|null;
  let discount: BigInt|null;

  if (liquidation.isOur && emp !== null && emp.priceFeed !== null) {
    price = getExchangePriceFor(liquidation.withdrawalAmount!, emp.priceFeed!.toHexString());
    liquidation.withdrawPrice = price;

    discount = liquidation.liquidatedTokens.times(BASE_EXPONENT).div(liquidation.liquidatedCollateral)
      .times(BASE_EXPONENT).div(liquidation.price!).minus(BASE_EXPONENT)
      .times(BigInt.fromI32(100));
  }

  addOrUpdateLiquidation(event, id, liquidation.poolToken, VenueEnum.Uma, LiquidationStatusEnum.UmaLiquidationWithdrawn,
    isOurWin, null, null, price, null, event.params.collateralAmount, discount);

  liquidation.save();
}

export function handleLiquidationWithdrawn(event: LiquidationWithdrawn): void {
  //FIXME: Current LiquidationWithdrawn doesn't have enough info to identify liquidation. Just ignore the call.
  return;

  let emp = EMP.load(event.address.toHexString());
  let liquidation = UMALiquidation.load(event.address.toHexString() /* + event.params.sponsor + event.params.liquidationId */);

  if (!liquidation) {
    return;
  }

  liquidation.withdrawalAmount = event.params.withdrawalAmount;
  liquidation.withdrawnAt = event.block.timestamp;
  liquidation.withdrawTransaction = event.transaction.hash;
  liquidation.settlementPrice = event.params.settlementPrice;
  liquidation.status = LiquidationStatusEnum.UmaLiquidationWithdrawn;

  if (liquidation.isOur) {
    liquidation.withdrawPrice = getExchangePriceFor(liquidation!.withdrawalAmount, emp.priceFeed.toHexString());
  }

  liquidation.save();
}

const USDC_WETH_POOL = "0x9b208194acc0a8ccb2a8dcafeacfbb7dcc093f81";
const USDC_WBTC_POOL = "0x68a241796628ecf44e48f0533fb00d07dd3419d2";

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";

function getExchangePriceFor(collateral: BigInt, priceId: string): BigInt {
  if (priceId == "USDETH") {
    let bp = BalancerPool.bind(Address.fromString(USDC_WETH_POOL));

    let r = bp.try_getSpotPrice(Address.fromString(USDC), Address.fromString(WETH));

    if (r !== null && !r.reverted) {
      return r.value.times(BigInt.fromI32(1000000).times(BigInt.fromI32(1000000)));
    }
  } else if (priceId == "USDBTC") {
    let bp = BalancerPool.bind(Address.fromString(USDC_WBTC_POOL));

    let r = bp.try_getSpotPrice(Address.fromString(USDC), Address.fromString(WBTC));

    if (r !== null && !r.reverted) {
      return r.value.times(BigInt.fromI32(100));
    }
  }

  return BigInt.fromI32(-1);
}

function getLiquidationSummary(id: string): UMALiquidationSummary {
  let statistic = UMALiquidationSummary.load(id);

  if (!statistic) {
    statistic = new UMALiquidationSummary(id);

    statistic.discountSum = BigInt.fromI32(0);
    statistic.wonCount = 0;
    statistic.total = 0;
    statistic.finished = 0;
  }

  return statistic;
}
