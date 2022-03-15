import { LogLiquidate } from '../generated/CreamKeeperAdapter/CreamKeeperAdapter';
import { addOrUpdateLiquidation, VenueEnum, LiquidationStatusEnum } from './liquidations';
import { getKeeperAdapter } from './pool';
import { PoolWallet } from '../generated/schema';
import { BigInt } from '@graphprotocol/graph-ts';

let BASE_EXPONENT = BigInt.fromI32(1000000000).times(BigInt.fromI32(1000000000));

export function handleLogLiquidate(event: LogLiquidate): void {
  let id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let keeperAdapter = getKeeperAdapter(event.address.toHexString());
  let poolId = PoolWallet.load(keeperAdapter!.pool.toHexString())!.poolToken;
  let discount = event.params.payback.times(BASE_EXPONENT).div(event.params.allocation)
    .minus(BASE_EXPONENT).times(BigInt.fromI32(100));

  addOrUpdateLiquidation(event, id, poolId, VenueEnum.Cream, LiquidationStatusEnum.Liquidated, true,
    event.params.repayToken.toHexString(), event.params.repayAmount, null, event.params.allocation,
    event.params.payback, discount);
}
