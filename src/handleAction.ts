import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  StakeCall,
  UnstakeCall,
} from "../generated/OlympusStakingV3/OlympusStakingV3";
import { Action } from "../generated/schema";
import { getISO8601StringFromTimestamp } from "./helpers/dateHelper";
import { toDecimal } from "./helpers/decimalHelper";

const TOKEN_OHM_V2 = "OHMv2";
const TOKEN_SOHM_V2 = "sOHMv2";
const TOKEN_GOHM = "gOHM";

const TOKEN_DECIMALS = new Map<string, number>();
TOKEN_DECIMALS.set(TOKEN_GOHM, 18);
TOKEN_DECIMALS.set(TOKEN_OHM_V2, 9);
TOKEN_DECIMALS.set(TOKEN_SOHM_V2, 9);

function createAction(
  from: Address,
  to: Address,
  blockchain: string,
  action: string,
  fromToken: string,
  toToken: string,
  amount: BigInt,
  block: ethereum.Block,
  transaction: ethereum.Transaction
): void {
  const recordId = `${transaction.hash.toHexString()}/${transaction.index}`;
  const loadedRecord = Action.load(recordId);
  assert(
    loadedRecord == null,
    `Did not expect to find existing record with id ${recordId}`
  );

  const record = new Action(recordId);
  record.block = block.number;

  const unixTimestamp = block.timestamp.toI64() * 1000;
  record.date = getISO8601StringFromTimestamp(unixTimestamp);
  record.timestamp = unixTimestamp.toString();
  record.transaction = transaction.hash;
  record.transactionLogIndex = transaction.index;
  record.from = from;
  record.to = to;
  record.blockchain = blockchain;
  record.action = action;
  record.amount = toDecimal(amount, TOKEN_DECIMALS.get(fromToken));
  record.fromToken = fromToken;
  record.toToken = toToken;

  record.save();
}

export function handleStake(call: StakeCall): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "STAKE",
    TOKEN_OHM_V2,
    call.inputs._rebasing ? TOKEN_SOHM_V2 : TOKEN_GOHM,
    call.inputs._amount,
    call.block,
    call.transaction
  );
}

export function handleUnstake(call: UnstakeCall): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "UNSTAKE",
    call.inputs._rebasing ? TOKEN_SOHM_V2 : TOKEN_GOHM,
    TOKEN_OHM_V2,
    call.inputs._amount,
    call.block,
    call.transaction
  );
}
