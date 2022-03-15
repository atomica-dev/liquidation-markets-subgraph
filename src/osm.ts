import {
  Poke,
} from '../generated/Spot/MCD_SPOT';
import {
  CurrentPrice,
} from '../generated/schema';
import { LogValue } from '../generated/OsmEth/PIP_ETH';

export function getPrice(ilk: string): CurrentPrice | null {
  let price = CurrentPrice.load(ilk);

  return price;
}

export function handleNewEthPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'ETH-A');
}

export function handleNewBatPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'BAT-A');
}

export function handleNewWbtcPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'WBTC-A');
}

export function handleNewUsdcPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'USDC-A');
  handleNewOSMPriceEvent(event, 'USDC-B');
}

export function handleNewUsdtPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'USDT-A');
}

export function handleNewPaxusdPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'PAXUSD-A');
}

export function handleNewCompPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'COMP-A');
}

export function handleNewLrcPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'LRC-A');
}

export function handleNewLinkPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'LINK-A');
}

export function handleNewTusdPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'TUSD-A');
}

export function handleNewKncPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'KNC-A');
}

export function handleNewManaPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'MANA-A');
}

export function handleNewZrxPriceEvent(event: LogValue): void {
  handleNewOSMPriceEvent(event, 'ZRX-A');
}

export function handleNewOSMPriceEvent(event: LogValue, ilk: string): void {
  let price = getPrice(ilk);

  if (price == null) {
    price = new CurrentPrice(ilk);
  }

  price.updatedAt = event.block.timestamp;
  price.value = event.params.val;

  price.save();
}

export function handleNewPriceEvent(event: Poke): void {
  let id = event.params.ilk.toString();
  let price = getPrice(id);

  if (price == null) {
    price = new CurrentPrice(id);
  }

  price.spotValue = event.params.val;
  price.updatedAt = event.block.timestamp;

  price.save();
}
