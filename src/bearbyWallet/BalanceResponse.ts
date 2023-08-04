export interface BalanceResponse {
  result: {
    address: string;
    thread: number;
    final_balance: string;
    final_roll_count: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    final_datastore_keys: Array<any>;
    candidate_balance: string;
    candidate_roll_count: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    candidate_datastore_keys: Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deferred_credits: Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next_block_draws: Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next_endorsement_draws: Array<any>;
    created_blocks: Array<string>;
    created_operations: Array<string>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    created_endorsements: Array<any>;
    cycle_infos: Array<cycle_infos>;
  };
}

interface cycle_infos {
  cycle: number;
  is_final: boolean;
  ok_count: number;
  nok_count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  active_rolls: any;
}
