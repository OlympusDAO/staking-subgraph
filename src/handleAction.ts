import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  StakeOHMCall,
  StakeOHMWithPermitCall,
  UnstakeOHMCall,
  UnstakeOHMWithPermitCall,
} from "../generated/OlympusStakingV1/OlympusStakingV1";
import {
  StakeCall as StakeCallV2,
  UnstakeCall as UnstakeCallV2,
} from "../generated/OlympusStakingV2/OlympusStakingV2";
import {
  StakeCall as StakeCallV3,
  UnstakeCall as UnstakeCallV3,
  UnwrapCall as UnwrapCallV3,
  WrapCall as WrapCallV3,
} from "../generated/OlympusStakingV3/OlympusStakingV3";
import { Action } from "../generated/schema";
import { getISO8601StringFromTimestamp } from "./helpers/dateHelper";
import { toDecimal } from "./helpers/decimalHelper";

const TOKEN_GOHM = "gOHM";
const TOKEN_OHM_V1 = "OHMv1";
const TOKEN_OHM_V2 = "OHMv2";
const TOKEN_SOHM_V1 = "sOHMv1";
const TOKEN_SOHM_V2 = "sOHMv2";
const TOKEN_SOHM_V3 = "sOHMv3";

const TOKEN_DECIMALS = new Map<string, number>();
TOKEN_DECIMALS.set(TOKEN_GOHM, 18);
TOKEN_DECIMALS.set(TOKEN_OHM_V1, 9);
TOKEN_DECIMALS.set(TOKEN_OHM_V2, 9);
TOKEN_DECIMALS.set(TOKEN_SOHM_V1, 9);
TOKEN_DECIMALS.set(TOKEN_SOHM_V2, 9);
TOKEN_DECIMALS.set(TOKEN_SOHM_V3, 9);

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
  // The function call does not have the logIndex, which we can use to uniquely identify the event/call. So we have to improvise.
  const recordId = `${transaction.hash.toHexString()}/${
    transaction.index
  }/${action}/${fromToken}/${toToken}`;
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

/**
 * V1
 */

// OHM -> sOHM
export function handleV1Stake(call: StakeOHMCall): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "STAKE",
    TOKEN_OHM_V1,
    TOKEN_SOHM_V1,
    call.inputs.amountToStake_,
    call.block,
    call.transaction
  );
}

// OHM -> sOHM
export function handleV1StakeWithPermit(call: StakeOHMWithPermitCall): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "STAKE",
    TOKEN_OHM_V1,
    TOKEN_SOHM_V1,
    call.inputs.amountToStake_,
    call.block,
    call.transaction
  );
}

// sOHM -> OHM
export function handleV1Unstake(call: UnstakeOHMCall): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "UNSTAKE",
    TOKEN_SOHM_V1,
    TOKEN_OHM_V1,
    call.inputs.amountToWithdraw_,
    call.block,
    call.transaction
  );
}

// sOHM -> OHM
export function handleV1UnstakeWithPermit(
  call: UnstakeOHMWithPermitCall
): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "UNSTAKE",
    TOKEN_SOHM_V1,
    TOKEN_OHM_V1,
    call.inputs.amountToWithdraw_,
    call.block,
    call.transaction
  );
}

/**
 * V2
 */

// OHM -> sOHM
export function handleV2Stake(call: StakeCallV2): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "STAKE",
    TOKEN_OHM_V1,
    TOKEN_SOHM_V2,
    call.inputs._amount,
    call.block,
    call.transaction
  );
}

// sOHM -> OHM
export function handleV2Unstake(call: UnstakeCallV2): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "UNSTAKE",
    TOKEN_SOHM_V2,
    TOKEN_OHM_V1,
    call.inputs._amount,
    call.block,
    call.transaction
  );
}

/**
 * V3
 */

// OHM -> sOHM or OHM -> gOHM
export function handleV3Stake(call: StakeCallV3): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "STAKE",
    TOKEN_OHM_V2,
    call.inputs._rebasing ? TOKEN_SOHM_V3 : TOKEN_GOHM,
    call.inputs._amount,
    call.block,
    call.transaction
  );
}

// sOHM -> OHM or gOHM -> OHM
export function handleV3Unstake(call: UnstakeCallV3): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "UNSTAKE",
    call.inputs._rebasing ? TOKEN_SOHM_V3 : TOKEN_GOHM,
    TOKEN_OHM_V2,
    call.inputs._amount,
    call.block,
    call.transaction
  );
}

// sOHM -> gOHM
export function handleV3Wrap(call: WrapCallV3): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "WRAP",
    TOKEN_SOHM_V3,
    TOKEN_GOHM,
    call.inputs._amount,
    call.block,
    call.transaction
  );
}

// gOHM -> sOHM
export function handleV3Unwrap(call: UnwrapCallV3): void {
  createAction(
    call.from,
    call.to,
    "Ethereum",
    "UNWRAP",
    TOKEN_GOHM,
    TOKEN_SOHM_V3,
    call.inputs._amount,
    call.block,
    call.transaction
  );
}
