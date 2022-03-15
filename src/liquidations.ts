import { Liquidation, LiquidationSummary } from '../generated/schema';
import { ethereum, BigInt } from '@graphprotocol/graph-ts';

export enum VenueEnum {
  Maker = 1,
  Uma = 2,
  Cream = 3,
}

export enum LiquidationStatusEnum {
  MakerTend = 1,
  MakerDent = 2,
  MakerFinished = 3,
  MakerOutbid = 4,
  MakerFinishedOutbid = 5,

  UmaLiquidationCreated = 10,
  UmaLiquidationDisputed = 11,
  UmaLiquidationSettled = 12,
  UmaLiquidationWithdrawn = 13,

  Liquidated = 100,
}

export function isLiquidationActive(status: LiquidationStatusEnum): boolean {
  switch (status) {
    case LiquidationStatusEnum.MakerTend:
    case LiquidationStatusEnum.MakerDent:
    case LiquidationStatusEnum.MakerOutbid:
    case LiquidationStatusEnum.UmaLiquidationCreated:
      return true;
  }

  return false;
}

export function getLiquidation(id: string): Liquidation|null {
  return Liquidation.load(id);
}

export function getLiquidationSummary(id: string): LiquidationSummary|null {
  return LiquidationSummary.load(id);
}

export function updateLiquidationStatusById(id: string, poolId: string|null, status: LiquidationStatusEnum, isOurWin: boolean): void {
  let liquidation = getLiquidation(id);
  let summary = poolId ? getLiquidationSummary(poolId) : null;

  if (!liquidation || !summary) {
    return;
  }

  updateLiquidationStatus(liquidation, summary, status, isOurWin);
}

export function updateLiquidationStatus(liquidation: Liquidation, summary: LiquidationSummary, status: LiquidationStatusEnum, isOurWin: boolean): void {
  let isActive = isLiquidationActive(status);

  if (liquidation.isActive && !isActive) {
    summary.finished += 1;

    if (isOurWin) {
      summary.wonCount += 1;
    }
  }

  liquidation.isActive = isActive;
  liquidation.status = status;

  liquidation.save();

  summary.save();
}

export function addOrUpdateLiquidation(event: ethereum.Event, id: string, poolId: string,
  venue: VenueEnum, status: LiquidationStatusEnum, isOurWin: boolean, collateralType: string|null, collateralAmount: BigInt|null,
  collateralPrice: BigInt|null, liquidatedTokens: BigInt|null, withdrawalAmount: BigInt, discountAmount: BigInt|null): void {
  let liquidation = Liquidation.load(id);
  let summary = LiquidationSummary.load(poolId);

  if (summary == null) {
    summary = new LiquidationSummary(poolId);

    summary.total = 0;
    summary.wonCount = 0;
    summary.discountSum = BigInt.fromI32(0);
    summary.discountTotal = 0;
    summary.finished = 0;
  }

  if (discountAmount !== null) {
    summary.discountSum = summary.discountSum.plus(discountAmount);
    summary.discountTotal += 1;
  }

  if (liquidation == null) {
    liquidation = new Liquidation(id);

    liquidation.venue = venue.toString();
    liquidation.num = summary.total + 1;
    liquidation.isActive = true;

    summary.total += 1;
  }

  liquidation.poolToken = poolId;

  liquidation.collateralType = collateralType ? collateralType : liquidation.collateralType;
  liquidation.collateralAmount = collateralAmount ? collateralAmount : liquidation.collateralAmount;
  liquidation.liquidatedTokens = liquidatedTokens ? liquidatedTokens : liquidation.liquidatedTokens;
  liquidation.withdrawalAmount = withdrawalAmount ? withdrawalAmount : liquidation.withdrawalAmount;
  liquidation.price = collateralPrice;
  liquidation.timestamp = event.block.timestamp;
  liquidation.latestTransaction = event.transaction.hash;
  liquidation.blockNumber = event.block.number;
  liquidation.gasLimit = event.transaction.gasLimit;
  liquidation.gasPrice = event.transaction.gasPrice;

  updateLiquidationStatus(liquidation, summary, status, isOurWin);
}
