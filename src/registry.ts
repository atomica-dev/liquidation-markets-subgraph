import { Registry } from '../generated/schema';
import { SetContractCall, LogSetContract } from '../generated/Registry/Registry';

export function handleSetContract(call: SetContractCall): void {
  let id = call.inputValues[0].value.toBytes().toString();
  let item = Registry.load(id);

  if (!item) {
    item = new Registry(id);
  }

  item.value = call.inputValues[1].value.toAddress();

  item.save();
}

export function handleSetContractEvent(event: LogSetContract): void {
  let id = event.params.name.toString();
  let item = new Registry(id);

  item.value = event.params.addr;

  item.save();
}
