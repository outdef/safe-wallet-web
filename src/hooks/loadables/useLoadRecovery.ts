import { SENTINEL_ADDRESS } from '@safe-global/safe-core-sdk/dist/src/utils/constants'
import type { Delay } from '@gnosis.pm/zodiac'

import { getDelayModifiers } from '@/services/recovery/delay-modifier'
import useAsync from '../useAsync'
import useSafeInfo from '../useSafeInfo'
import { useWeb3ReadOnly } from '../wallets/web3'
import { getSpendingLimitModuleAddress } from '@/services/contracts/spendingLimitContracts'
import useIntervalCounter from '../useIntervalCounter'
import type { AsyncResult } from '../useAsync'
import type { RecoveryState } from '@/store/recoverySlice'

const MAX_PAGE_SIZE = 100
const REFRESH_DELAY = 5 * 60 * 1_000 // 5 minutes

const getRecoveryState = async (delayModifier: Delay): Promise<RecoveryState[number]> => {
  const transactionAddedFilter = delayModifier.filters.TransactionAdded()

  const [[modules], txCooldown, txNonce, queueNonce, transactionsAdded] = await Promise.all([
    delayModifier.getModulesPaginated(SENTINEL_ADDRESS, MAX_PAGE_SIZE),
    delayModifier.txCooldown(),
    delayModifier.txNonce(),
    delayModifier.queueNonce(),
    delayModifier.queryFilter(transactionAddedFilter),
  ])

  return {
    address: delayModifier.address,
    modules,
    txCooldown: txCooldown.toString(),
    txNonce: txNonce.toString(),
    queueNonce: queueNonce.toString(),
    transactionsAdded: transactionsAdded.filter(({ args }) => args.queueNonce.gte(txNonce)),
  }
}

const useLoadRecovery = (): AsyncResult<RecoveryState> => {
  const { safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
  const [counter] = useIntervalCounter(REFRESH_DELAY)

  const [delayModifiers, delayModifiersError, delayModifiersLoading] = useAsync<Array<Delay>>(() => {
    if (!web3ReadOnly || !safe.modules || safe.modules.length === 0) {
      return
    }

    const isOnlySpendingLimit =
      safe.modules.length === 1 && safe.modules[0].value === getSpendingLimitModuleAddress(safe.chainId)

    if (isOnlySpendingLimit) {
      return
    }

    return getDelayModifiers(safe.chainId, safe.modules, web3ReadOnly)
    // Need to check length of modules array to prevent new request every time Safe info polls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safe.chainId, safe.modules?.length, web3ReadOnly])

  const [recoveryState, recoveryStateError, recoveryStateLoading] = useAsync<RecoveryState>(() => {
    if (!delayModifiers || delayModifiers.length === 0) {
      return
    }

    return Promise.all(delayModifiers.map(getRecoveryState))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delayModifiers, counter])

  return [recoveryState, delayModifiersError || recoveryStateError, delayModifiersLoading || recoveryStateLoading]
}

export default useLoadRecovery