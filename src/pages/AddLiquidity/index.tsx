import React, { useCallback, useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, currencyEquals, ETHER, TokenAmount, WETH } from '@wakandaswap-libs/sdk'
import { Button, CardBody, AddIcon, Text as UIKitText } from '@wakandaswap-libs/uikit'
import { RouteComponentProps } from 'react-router-dom'
import { LightCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { AddRemoveTabs } from 'components/NavigationTabs'
import { MinimalPositionCard } from 'components/PositionCard'
import Row, { RowBetween, RowFlat } from 'components/Row'
import { FaTelegramPlane } from 'react-icons/fa'
import { MdOutlineKeyboardArrowRight } from 'react-icons/md'
import styled from 'styled-components'

import { PairState } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { Field } from 'state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from 'state/mint/hooks'

import { useTransactionAdder } from 'state/transactions/hooks'
import { useIsExpertMode, useUserDeadline, useUserSlippageTolerance } from 'state/user/hooks'
import { TYPE } from 'components/Shared'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { currencyId } from 'utils/currencyId'
import Pane from 'components/Pane'
import ConnectWalletButton from 'components/ConnectWalletButton'
import AppBody from '../AppBody'
import { Dots, Wrapper } from '../Pool/styleds'
import { ConfirmAddModalBottom } from './ConfirmAddModalBottom'
import { PoolPriceBar } from './PoolPriceBar'
import { ROUTER_ADDRESS } from '../../constants'
import Vector from './vector.svg'
import './index.css'
import Rect1 from './swap1.svg'
import Ellipse1 from './swapEllipse1.svg'

const { italic: Italic } = TYPE

const Panel = styled.div`
  width: 400px;
  align-self: center;
  @media (min-width: 1024px) {
    align-self: start;
  }
`

const Connected = styled.div`
position: relative;
font-size: 16px;
width: 100%;
border: solid 1px #00ACFF;
border-radius: 20px;
padding-left: 20px;
padding-right: 20px;
padding-top: 30px;
padding-bottom: 30px;
display: flex;
flex-direction: column;
gap: 30px;
`
const Item = styled.div`
z-index: 5;
color: white;
width: 100%;
display: flex;
justify-content: space-between;
`

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const oneCurrencyIsWETH = Boolean(
    chainId &&
    ((currencyA && currencyEquals(currencyA, WETH[chainId])) ||
      (currencyB && currencyEquals(currencyB, WETH[chainId])))
  )
  const expertMode = useIsExpertMode()

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error,
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const [deadline] = useUserDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {}
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], ROUTER_ADDRESS)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], ROUTER_ADDRESS)

  const addTransaction = useTransactionAdder()

  async function onAdd() {
    if (!chainId || !library || !account) return
    const router = getRouterContract(chainId, library, account)
    console.log(router);
    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0],
    }

    const deadlineFromNow = Math.ceil(Date.now() / 1000) + deadline

    let estimate
    let method: (...args: any) => Promise<TransactionResponse>
    let args: Array<string | string[] | number>
    let value: BigNumber | null
    if (currencyA === ETHER || currencyB === ETHER) {
      const tokenBIsETH = currencyB === ETHER
      console.log('ether, --------------------------')
      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH
      console.log("============>ether=======>", method);
      args = [
        wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '', // token
        (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        account,
        deadlineFromNow,
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
    } else {
      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity;
      console.log("============>not ether=======>", estimate(), "=========>", estimate);
      args = [
        wrappedCurrency(currencyA, chainId)?.address ?? '',
        wrappedCurrency(currencyB, chainId)?.address ?? '',
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        deadlineFromNow,
      ]
      console.log(args)
      value = null
    }
    console.log(estimate)
    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
        }).then((response) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: `Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${currencies[Field.CURRENCY_A]?.symbol
              } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${currencies[Field.CURRENCY_B]?.symbol}`,
          })

          setTxHash(response.hash)
        })
      )
      .catch((e) => {
        setAttemptingTxn(false)
        console.log(estimate);
        // we only care if the error is something _other_ than the user rejected the tx
        if (e?.code !== 4001) {
          console.error(e)
        }
      })
  }

  const modalHeader = () => {
    return noLiquidity ? (
      <AutoColumn gap="20px">
        <LightCard mt="20px" borderRadius="20px">
          <RowFlat>
            <UIKitText fontSize="48px" mr="8px">
              {`${currencies[Field.CURRENCY_A]?.symbol}/${currencies[Field.CURRENCY_B]?.symbol}`}
            </UIKitText>
            <DoubleCurrencyLogo
              currency0={currencies[Field.CURRENCY_A]}
              currency1={currencies[Field.CURRENCY_B]}
              size={30}
            />
          </RowFlat>
        </LightCard>
      </AutoColumn>
    ) : (
      <AutoColumn gap="20px">
        <RowFlat style={{ marginTop: '20px' }}>
          <UIKitText fontSize="48px" mr="8px">
            {liquidityMinted?.toSignificant(6)}
          </UIKitText>
          <DoubleCurrencyLogo
            currency0={currencies[Field.CURRENCY_A]}
            currency1={currencies[Field.CURRENCY_B]}
            size={30}
          />
        </RowFlat>
        <Row>
          <UIKitText fontSize="24px">
            {`${currencies[Field.CURRENCY_A]?.symbol}/${currencies[Field.CURRENCY_B]?.symbol} Pool Tokens`}
          </UIKitText>
        </Row>
        <Italic fontSize={12} textAlign="left" padding="8px 0 0 0 ">
          {`Output is estimated. If the price changes by more than ${allowedSlippage / 100
            }% your transaction will revert.`}
        </Italic>
      </AutoColumn>
    )
  }

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    )
  }

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${currencies[Field.CURRENCY_A]?.symbol
    } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`

  const handleCurrencyASelect = useCallback(
    (currA: Currency) => {
      const newCurrencyIdA = currencyId(currA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA]
  )
  const handleCurrencyBSelect = useCallback(
    (currB: Currency) => {
      const newCurrencyIdB = currencyId(currB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/add/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/add/${currencyIdA || 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  return (
    <div className='add' style={{ padding: '100px 70px' }}>
      {/* <CardNav activeIndex={1} /> */}
      <div style={{ position: 'absolute', width: '1920px', top: '80px', left: '-10px', zIndex: 0 }}>
        <img src={Rect1} alt="rect" style={{ position: 'absolute', width: '1920px', transform: '50% 50% 0 0', zIndex: 1 }} />
        <img src={Ellipse1} alt='ellipse' style={{ width: '20%', top: '-70px', position: 'absolute', left: '0px', zIndex: 3 }} />
      </div>
      <AppBody>
        <div>Liquidity Pool</div>
        <AddRemoveTabs adding />
        <Wrapper style={{ display: 'flex', placeContent: 'center', alignItems: 'center', zIndex: 2 }}>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash}
            content={() => (
              <ConfirmationModalContent
                title={noLiquidity ? 'You are creating a pool' : 'You will receive'}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
          />
          <CardBody style={{ position: 'relative', padding: '0px', marginRight: '10px', width: '100%', minWidth: '100px', maxWidth: '600px' }}>
            <AutoColumn gap="5px">
              {noLiquidity && (
                <ColumnCenter>
                  <Pane>
                    <AutoColumn gap="12px">
                      <UIKitText>You are the first liquidity provider.</UIKitText>
                      <UIKitText>The ratio of tokens you add will set the price of this pool.</UIKitText>
                      <UIKitText>Once you are happy with the rate click supply to review.</UIKitText>
                    </AutoColumn>
                  </Pane>
                </ColumnCenter>
              )}
              <CurrencyInputPanel
                value={formattedAmounts[Field.CURRENCY_A]}
                onUserInput={onFieldAInput}
                onMax={() => {
                  onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                }}
                onCurrencySelect={handleCurrencyASelect}
                showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                currency={currencies[Field.CURRENCY_A]}
                id="add-liquidity-input-tokena"
                showCommonBases={false}
              />
              <div style={{ borderRadius: '50%', position: 'relative' }}>
                <AddIcon color='#00ACFF' style={{ position: 'absolute', borderRadius: '50%', border: 'solid black 2px', zIndex: 30, width: '40px', background: 'rgb(255, 255, 255)', left: '50%', top: '-20px' }} />
              </div>
              <CurrencyInputPanel
                value={formattedAmounts[Field.CURRENCY_B]}
                onUserInput={onFieldBInput}
                onCurrencySelect={handleCurrencyBSelect}
                onMax={() => {
                  onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                currency={currencies[Field.CURRENCY_B]}
                id="add-liquidity-input-tokenb"
                showCommonBases={false}
              />
              {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
                <div>
                  <UIKitText
                    style={{ textTransform: 'uppercase', fontWeight: 600 }}
                    color="textSubtle"
                    fontSize="12px"
                    mb="2px"
                  >
                    {noLiquidity ? 'Initial prices and pool share' : 'Prices and pool share'}
                  </UIKitText>
                  <Pane>
                    <PoolPriceBar
                      currencies={currencies}
                      poolTokenPercentage={poolTokenPercentage}
                      noLiquidity={noLiquidity}
                      price={price}
                    />
                  </Pane>
                </div>
              )}
              <br />
              {!account ? (
                <ConnectWalletButton title="Connect Stasha Wallet" />
              ) : (
                <AutoColumn gap="md">
                  {(approvalA === ApprovalState.NOT_APPROVED ||
                    approvalA === ApprovalState.PENDING ||
                    approvalB === ApprovalState.NOT_APPROVED ||
                    approvalB === ApprovalState.PENDING) &&
                    isValid && (
                      <RowBetween>
                        {approvalA !== ApprovalState.APPROVED && (
                          <Button
                            onClick={approveACallback}
                            disabled={approvalA === ApprovalState.PENDING}
                            style={{ width: approvalB !== ApprovalState.APPROVED ? '48%' : '100%' }}
                          >
                            {approvalA === ApprovalState.PENDING ? (
                              <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                            ) : (
                              `Approve ${currencies[Field.CURRENCY_A]?.symbol}`
                            )}
                          </Button>
                        )}
                        {approvalB !== ApprovalState.APPROVED && (
                          <Button
                            onClick={approveBCallback}
                            disabled={approvalB === ApprovalState.PENDING}
                            style={{ width: approvalA !== ApprovalState.APPROVED ? '48%' : '100%' }}
                          >
                            {approvalB === ApprovalState.PENDING ? (
                              <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                            ) : (
                              `Approve ${currencies[Field.CURRENCY_B]?.symbol}`
                            )}
                          </Button>
                        )}
                      </RowBetween>
                    )}
                  <Button
                    onClick={() => {
                      if (expertMode) {
                        onAdd()
                      } else {
                        setShowConfirm(true)
                      }
                    }}
                    disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                    variant={
                      !isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]
                        ? 'danger'
                        : 'primary'
                    }
                    fullWidth
                  >
                    {error ?? 'Supply'}
                  </Button>
                </AutoColumn>
              )}
            </AutoColumn>
          </CardBody>
          {!account ? <Panel style={{ height: '100%' }}>
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', height: 290, flexDirection: 'column', gap: 10, padding: '20px', paddingTop: '40px', borderRadius: '20px', maxWidth: '325px', marginBottom: '60px', background: 'linear-gradient(180deg, #005E8B 0%, #00ACFF 100%)' }}>
              <img alt='img' src={Vector} style={{ position: 'absolute', zIndex: -1, height: '250px', left: '5px' }} />
              <div>New to <br /><span style={{ color: '#00ACFFE5' }}>Stasha</span> DEX ?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15, fontSize: '15px' }}>
                <div>Just 2 steps to get the best out of Stasha DEX</div>
                <div style={{ display: 'flex', gap: '10px' }}><span>Connect Stasha Wallet</span><MdOutlineKeyboardArrowRight /></div>
                <div style={{ display: 'flex', gap: '10px' }}><span>Get Stasha Wallet</span><MdOutlineKeyboardArrowRight /></div>
                <div style={{ display: 'flex', background: '#006B9E', width: '140px', padding: '10px', borderRadius: '10px' }}>
                  <FaTelegramPlane />Join Telegram</div>
              </div>
            </div>
          </Panel> : <Panel style={{ height: '100%' }}>
            <Connected>
              <Item>
                <div>Possible Slippage</div>
                <div>{allowedSlippage / 100}%</div>
              </Item>
              <Item>
                <div>Avg. Transaction Cost</div>
                <div>0.13174987 STC</div>
              </Item>
              <Item>
                <div>Refundable Fee</div>
                <div>6 STC</div>
              </Item>
              <Item>
                <div>Price Impact</div>
                <div>{'<'}0.00162%</div>
              </Item>
              <Item>
                <div>Route</div>
                <div>STC {'>'} USDT</div>
              </Item>
              <Item>
                <div>Exchange Rate</div>
                <div>6000 STC = 365 USDT</div>
              </Item>
              <div style={{ display: 'flex', gap: 5, flexDirection: 'column', color: 'white', zIndex: 5 }}>
                <div style={{ borderTop: 'solid 1px #00ACFF', paddingTop: '10px' }}>Minimum to Receive</div>
                <div style={{ fontSize: '24px' }}>340.84689 USDT</div>
              </div>
            </Connected>
          </Panel>}
        </Wrapper>
      </AppBody>
      {pair && !noLiquidity && pairState !== PairState.INVALID ? (
        <AutoColumn style={{ maxWidth: '436px', width: '100%', marginTop: '1rem', marginLeft: 'auto', marginRight: 'auto' }}>
          <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
        </AutoColumn>
      ) : null}
    </div>
  )
}
