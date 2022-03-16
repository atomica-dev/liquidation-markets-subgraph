import {
  Kick,
  LogNote,
  MCD_FLIP_ETH_A__bidsResult as Flipper__bidsResult,
} from '../generated/FlipEthA/MCD_FLIP_ETH_A';
import {
  Auction,
  Bid,
  AuctionSummary,
  PoolAdapter,
  Registry,
  PoolWallet,
  PoolToAuctionMapping,
} from '../generated/schema';
import { MCD_FLIP_ETH_A as Flipper } from '../generated/FlipEthA/MCD_FLIP_ETH_A';
import { BigInt, Bytes, Address, ethereum } from '@graphprotocol/graph-ts';
import { getPrice } from './osm';
import { Exchange } from '../generated/FlipEthA/Exchange';
import { getFactoryPools } from './poolFactory';
import { keeperAdapterIsAttachedToPool } from './pool';
import { LiquidationStatusEnum, addOrUpdateLiquidation, VenueEnum } from './liquidations';

const STAT_KEY = 'TOTAL';

export function handleEthKickEvent(event: Kick): void {
  handleKickEvent(event, 'ETH-A');
}
export function handleBatKickEvent(event: Kick): void {
  handleKickEvent(event, 'BAT-A');
}
export function handleWbtcKickEvent(event: Kick): void {
  handleKickEvent(event, 'WBTC-A');
}
export function handleUsdcKickEvent(event: Kick): void {
  handleKickEvent(event, 'USDC-A');
}
export function handleUsdcbKickEvent(event: Kick): void {
  handleKickEvent(event, 'USDC-B');
}
export function handleTusdKickEvent(event: Kick): void {
  handleKickEvent(event, 'TUSD-A');
}
export function handleUsdtKickEvent(event: Kick): void {
  handleKickEvent(event, 'USDT-A');
}
export function handlePaxusdKickEvent(event: Kick): void {
  handleKickEvent(event, 'PAXUSD-A');
}
export function handleCompKickEvent(event: Kick): void {
  handleKickEvent(event, 'COMP-A');
}
export function handleLrcKickEvent(event: Kick): void {
  handleKickEvent(event, 'LRC-A');
}
export function handleLinkKickEvent(event: Kick): void {
  handleKickEvent(event, 'LINK-A');
}
export function handleKncKickEvent(event: Kick): void {
  handleKickEvent(event, 'KNC-A');
}
export function handleManaKickEvent(event: Kick): void {
  handleKickEvent(event, 'MANA-A');
}
export function handleZrxKickEvent(event: Kick): void {
  handleKickEvent(event, 'ZRX-A');
}

export function handleEthTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'ETH-A');
}
export function handleBatTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'BAT-A');
}
export function handleWbtcTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'WBTC-A');
}
export function handleUsdcTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'USDC-A');
}
export function handleUsdcbTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'USDC-B');
}
export function handleTusdTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'TUSD-A');
}
export function handleUsdtTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'USDT-A');
}
export function handlePaxusdTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'PAXUSD-A');
}
export function handleCompTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'COMP-A');
}
export function handleLrcTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'LRC-A');
}
export function handleLinkTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'LINK-A');
}
export function handleKncTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'KNC-A');
}
export function handleManaTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'MANA-A');
}
export function handleZrxTendDentLogNoteEvent(event: LogNote): void {
  handleTendDentLogNoteEvent(event, 'ZRX-A');
}

export function handleEthDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'ETH-A');
}
export function handleBatDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'BAT-A');
}
export function handleWbtcDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'WBTC-A');
}
export function handleUsdcDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'USDC-A');
}
export function handleUsdcbDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'USDC-B');
}
export function handleTusdDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'TUSD-A');
}
export function handleUsdtDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'USDT-A');
}
export function handlePaxusdDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'PAXUSD-A');
}
export function handleCompDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'COMP-A');
}
export function handleLrcDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'LRC-A');
}
export function handleLinkDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'LINK-A');
}
export function handleKncDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'KNC-A');
}
export function handleManaDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'MANA-A');
}
export function handleZrxDealYankLogNoteEvent(event: LogNote): void {
  handleDealYankLogNoteEvent(event, 'ZRX-A');
}

export function handleTendDentLogNoteEvent(event: LogNote, ilk: string): void {
  let auctionId = BigInt.fromUnsignedBytes(event.params.arg1.reverse() as Bytes);
  let flipper = Flipper.bind(event.address);
  let bid = flipper.bids(auctionId);
  let id = auctionId.toString() + ilk + event.address.toHexString().substr(0, 6)
  let auction = Auction.load(id);

  if (!auction) {
    return;
  }

  let adapter = PoolAdapter.load(bid.value2.toHexString());

  auction.isOurBid = adapter != null;
  auction.isOur = auction.isOur || auction.isOurBid;

  initAuctionWithBid(auction, ilk, bid, auction.isOurBid);

  let phase = bid.value0 === bid.value7 ? LiquidationStatusEnum.MakerDent : LiquidationStatusEnum.MakerTend;

  auction.at = event.block.timestamp;
  auction.phase = phase;
  auction.latestTransaction = event.transaction.hash;
  auction.blockNumber = event.block.number;
  auction.gasPrice = event.transaction.gasPrice;
  auction.gasLimit = event.transaction.gasLimit;
  auction.bidCount += 1;

  auction.save();

  updateStat(STAT_KEY, auction, adapter != null);

  let allPools = getFactoryPools();

  for (let i = 0; i < allPools.length; i++) {
    let poolId = allPools[i];
    let pw = PoolWallet.load(poolId);
    let isOurBid = adapter != null && keeperAdapterIsAttachedToPool(adapter.id, poolId);

    if (isOurBid) {
      addOrUpdateLiquidation(event, id, pw!.poolToken, VenueEnum.Maker, auction.isOurBid ? phase : LiquidationStatusEnum.MakerOutbid,
        auction.isOurBid, ilk, auction.lot, auction.price,
        auction.bid, BigInt.fromI32(0), null);
    }

    updateStat(pw!.poolToken, auction, isOurBid);
  }

  let bidEntity = new Bid(event.transaction.hash.toHexString());

  bidEntity.price = auction.price;
  bidEntity.osmPrice = auction.osmPrice;
  bidEntity.isOurBid = auction.isOurBid;

  bidEntity.blockNumber = event.block.number;
  bidEntity.gasLimit = event.transaction.gasLimit;
  bidEntity.gasPrice = event.transaction.gasPrice;

  bidEntity.ilk = ilk;
  bidEntity.auctionId = event.params.arg1.toI32();
  bidEntity.bid = bid.value0;
  bidEntity.lot = bid.value1;
  bidEntity.guy = bid.value2;
  bidEntity.at = event.block.timestamp;
  bidEntity.hash = event.transaction.hash;

  bidEntity.save();
}

function updateStat(statId: string, auction: Auction, isOurBid: boolean): void {
  let stat = getAuctionSummary(statId);
  let paRelation = PoolToAuctionMapping.load(statId + auction.id);

  if (!paRelation) {
    addAuctionToStat(statId, auction);
    paRelation = PoolToAuctionMapping.load(statId + auction.id);
  }

  if (!paRelation) {
    return;
  }

  if (!paRelation.isOur && isOurBid) {
    stat.participatedCount += 1;

    stat.save();
  }

  paRelation.isOurBid = isOurBid;
  paRelation.isOur = paRelation.isOur || isOurBid;
  paRelation.phase = auction.phase;
  paRelation.at = auction.at;

  paRelation.save();
}

export function handleKickEvent(event: Kick, ilk: string): void {
  let auctionId = event.params.id;
  let id = auctionId.toString() + ilk + event.address.toHexString().substr(0, 6);
  let auction = new Auction(id);
  let flipper = Flipper.bind(event.address);

  let bid = flipper.bids(event.params.id);

  initAuctionWithBid(auction, ilk, bid, false);

  auction.auctionId = auctionId;
  auction.ilk = ilk;
  auction.at = event.block.timestamp;
  auction.phase = LiquidationStatusEnum.MakerTend;
  auction.latestTransaction = event.transaction.hash;
  auction.blockNumber = event.block.number;
  auction.isOur = false;
  auction.isOurBid = false;
  auction.bidCount = 0;

  auction.save();

  addAuctionToStat(STAT_KEY, auction);

  let allPools = getFactoryPools();

  for (let i = 0; i < allPools.length; i++) {
    let poolId = allPools[i];
    let pw = PoolWallet.load(poolId);

    addAuctionToStat(pw!.poolToken, auction);
  }
}

function addAuctionToStat(statId: string, auction: Auction): void {
  let stat = getAuctionSummary(statId);

  stat.totalAuctions += 1;
  stat.save();

  let paRelation = new PoolToAuctionMapping(stat.id + auction.id);

  paRelation.auctionSummary = stat.id;
  paRelation.auction = auction.id;
  paRelation.phase = auction.phase;
  paRelation.isOur = false;
  paRelation.isOurBid = false;
  paRelation.at = auction.at;

  paRelation.save();
}

export function handleDealYankLogNoteEvent(event: LogNote, ilk: string): void {
  let price = getPrice(ilk);
  let auctionId = BigInt.fromUnsignedBytes(event.params.arg1.reverse() as Bytes);
  let id = auctionId.toString() + ilk + event.address.toHexString().substr(0, 6);
  let auction = Auction.load(id);

  if (!auction) {
    return;
  }

  let adapter = PoolAdapter.load(auction.guy!.toHexString());

  if (price != null) {
    if (price.value) {
      auction.dealOsmPrice = price.value;
    } else {
      auction.dealOsmPrice = price.spotValue;
    }
  }

  if (auction.isOurBid) {
    auction.dealPrice = getExchangePriceFor(auction.lot, ilk);
  }

  auction.dealAt = event.block.timestamp;
  auction.phase = LiquidationStatusEnum.MakerFinished;
  auction.dealTransaction = event.transaction.hash;

  auction.save();

  let allPools = getFactoryPools();

  for (let i = 0; i < allPools.length; i++) {
    let poolId = allPools[i];
    let pw = PoolWallet.load(poolId);
    let paRelation = PoolToAuctionMapping.load(pw!.poolToken + auction.id);
    let isOurBid = paRelation != null && paRelation.isOur;

    if (isOurBid) {
      let ethPrice = getExchangePriceFor(auction.lot, ilk);
      let discount: BigInt|null;

      if (ethPrice != BigInt.fromI32(-1)) {
        let baseExponent = BigInt.fromI32(1000000000).times(BigInt.fromI32(1000000000));
        let bidExponentDiff = BigInt.fromI32(1000000000);

        discount = auction.bid.div(bidExponentDiff).div(auction.lot)
          .times(baseExponent).div(ethPrice).minus(baseExponent)
          .times(BigInt.fromI32(100));
      }

      addOrUpdateLiquidation(event, id, pw!.poolToken, VenueEnum.Maker, auction.isOurBid ? LiquidationStatusEnum.MakerFinished : LiquidationStatusEnum.MakerFinishedOutbid,
        auction.isOurBid, ilk, auction.lot, auction.price,
        auction.bid, BigInt.fromI32(0), discount);
    }

    updateWinningStat(pw!.poolToken, auction, ilk, isOurBid, adapter != null && keeperAdapterIsAttachedToPool(adapter.id, poolId));
  }

  updateWinningStat(STAT_KEY, auction, ilk, auction.isOur, adapter != null);
}

function updateWinningStat(statId: string, auction: Auction, ilk: string, isOur: boolean, ourWin: boolean): void {
  let stat = getAuctionSummary(statId);

  stat.finishedAuctions += 1;

  if (isOur) {
    stat.finishedOurAuctions += 1;
  }

  if (ourWin) {
    stat.wonCount += 1;
    let ethPrice = getExchangePriceFor(auction.lot, ilk);

    if (ethPrice != BigInt.fromI32(-1)) {
      let baseExponent = BigInt.fromI32(1000000000).times(BigInt.fromI32(1000000000));
      let bidExponentDiff = BigInt.fromI32(1000000000);

      stat.discountSum = stat.discountSum.plus(
        auction.bid.div(bidExponentDiff).div(auction.lot)
          .times(baseExponent).div(ethPrice).minus(baseExponent)
          .times(BigInt.fromI32(100))
      );
    }
  }

  stat.save();

  let paRelation = PoolToAuctionMapping.load(stat.id + auction.id);

  if (!paRelation) {
    return;
  }

  paRelation.phase = auction.phase;
  paRelation.at = auction.at;

  paRelation.save();
}

function initAuctionWithBid(auction: Auction, ilk: string, bid: Flipper__bidsResult, isOurBid: boolean): void {
  let price = getPrice(ilk);

  auction.bid = bid.value0;
  auction.lot = bid.value1;
  auction.guy = bid.value2;
  auction.tic = bid.value3;
  auction.end = bid.value4;
  auction.tab = bid.value7;

  if (price != null) {
    if (price.value) {
      auction.osmPrice = price.value;
    } else {
      auction.osmPrice = price.spotValue;
    }
  }

  if (isOurBid) {
    auction.price = getExchangePriceFor(auction.lot, ilk);
  }
}

function getExchangePriceFor(lot: BigInt, ilk: string): BigInt {
  let exchangeAddress = Registry.load('Exchange');
  let ilkAddress = Registry.load(ilk);

  if (!exchangeAddress || !ilkAddress) {
    return BigInt.fromI32(-1);
  }

  let exchange = Exchange.bind(changetype<Address>(exchangeAddress.value));

  let result: ethereum.CallResult<BigInt>;

  result = exchange.try_getOutput(changetype<Address>(ilkAddress.value), lot);

  if (result !== null && !result.reverted) {
    return result.value.times(BigInt.fromI32(1000000000).times(BigInt.fromI32(1000000000))).div(lot);
  }

  return BigInt.fromI32(-1);
}

function getAuctionSummary(id: string): AuctionSummary {
  let statistic = AuctionSummary.load(id);

  if (!statistic) {
    statistic = new AuctionSummary(id);

    statistic.discountSum = BigInt.fromI32(0);
    statistic.participatedCount = 0;
    statistic.wonCount = 0;
    statistic.totalAuctions = 0;
    statistic.finishedAuctions = 0;
    statistic.finishedOurAuctions = 0;
  }

  return statistic;
}
