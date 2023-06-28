import { CurrencyAmount, JSBI, Token, Trade } from '@wakandaswap-libs/sdk'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { CardBody, ArrowDownIcon, Button, IconButton, Text } from '@wakandaswap-libs/uikit'
import styled, { ThemeContext } from 'styled-components'
import AddressInputPanel from 'components/AddressInputPanel'
import Card, { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import ConfirmSwapModal from 'components/swap/ConfirmSwapModal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { AutoRow, RowBetween } from 'components/Row'
import AdvancedSwapDetailsDropdown from 'components/swap/AdvancedSwapDetailsDropdown'
import confirmPriceImpactWithoutFee from 'components/swap/confirmPriceImpactWithoutFee'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from 'components/swap/styleds'
import TradePrice from 'components/swap/TradePrice'
import TokenWarningModal from 'components/TokenWarningModal'
import SyrupWarningModal from 'components/SyrupWarningModal'
import ProgressSteps from 'components/ProgressSteps'
import { CgArrowsExchangeAltV } from 'react-icons/cg'
import { FaTelegramPlane } from 'react-icons/fa'
import { MdOutlineKeyboardArrowRight } from 'react-icons/md'

import useGetPriceData from 'hooks/useGetPriceData'
import { INITIAL_ALLOWED_SLIPPAGE } from 'constants/index'
import PANCAKESWAP_DEFAULT_TOKEN_LIST from 'constants/token/wakandaswap.json'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useExpertModeManager, useUserDeadline, useUserSlippageTolerance } from 'state/user/hooks'
import { LinkStyledButton, TYPE } from 'components/Shared'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { computeTradePriceBreakdown, warningSeverity } from 'utils/prices'
import Loader from 'components/Loader'
import { TranslateString } from 'utils/translateTextHelpers'
import PageHeader from 'components/PageHeader'
import ConnectWalletButton from 'components/ConnectWalletButton'
import AppBody from '../AppBody'
import './index.css'
import Ellipse1 from './swapEllipse1.svg'
import Ellipse2 from './swapEllipse2.svg'
import Ellipse3 from './swapEllipse3.svg'
import Rect1 from './swap1.svg'
import Vector from './vector.svg'

const Heading = styled.p`
style={{ display: 'flex', padding: '15px', fontFamily: 'Fredoka' }}
display: flex;
font-family: Fredoka;
z-index: 5;
font-size: 24px;
color: gray;
padding-bottom: 20px;
@media (max-width: 576px) {
  font-size: 20px;
  padding: 5px;
}
`

const Panel = styled.div`
  align-self: center;
  @media (min-width: 1280px) {
    align-self: start;
  }
`

const { main: Main } = TYPE

const Swap = () => {
  const priceData = useGetPriceData();
  const loadedUrlParams = useDefaultsFromURLSearch()

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]
  const [priceA, setPriceA] = useState<any>(-1);
  const [priceB, setPriceB] = useState<any>(-1);
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const [isSyrup, setIsSyrup] = useState<boolean>(false)
  const [syrupTransactionType, setSyrupTransactionType] = useState<string>('')
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )

  const tokenWhitelisted: boolean = useMemo(
    () => {
      const tokenAddress = loadedUrlParams?.outputCurrencyId?.toLowerCase()
      if (!tokenAddress) return false

      const foundToken = PANCAKESWAP_DEFAULT_TOKEN_LIST.tokens.find(t => t.address.toLowerCase() === tokenAddress)
      if (!foundToken) return false

      return true
    },
    [loadedUrlParams]
  )

  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const handleConfirmSyrupWarning = useCallback(() => {
    setIsSyrup(false)
    setSyrupTransactionType('')
  }, [])

  const { account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [deadline] = useUserDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const { v2Trade, currencyBalances, parsedAmount, currencies, inputError: swapInputError } = useDerivedSwapInfo()

  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue
  )
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = v2Trade

  const parsedAmounts = showWrap
    ? {
      [Field.INPUT]: parsedAmount,
      [Field.OUTPUT]: parsedAmount,
    }
    : {
      [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
    }

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
      // if (priceB !== -1) onUserInput(Field.OUTPUT, (parseFloat(value) * priceA / priceB).toString());
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
      // if (priceA !== -1) onUserInput(Field.INPUT, (parseFloat(value) * priceB / priceA).toString());
    },
    [onUserInput]
  )

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: !showWrap
      ? (independentField === Field.INPUT ? parseFloat(typedValue) * priceA / priceB : parseFloat(typedValue) * priceB / priceA).toString()
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const route = trade?.route
  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )
  const noRoute = !route

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    deadline,
    recipient
  )

  const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade)

  const handleSwap = useCallback(() => {
    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
      return
    }
    if (!swapCallback) {
      return
    }
    setSwapState((prevState) => ({ ...prevState, attemptingTxn: true, swapErrorMessage: undefined, txHash: undefined }))
    swapCallback()
      .then((hash) => {
        setSwapState((prevState) => ({
          ...prevState,
          attemptingTxn: false,
          swapErrorMessage: undefined,
          txHash: hash,
        }))
      })
      .catch((error) => {
        setSwapState((prevState) => ({
          ...prevState,
          attemptingTxn: false,
          swapErrorMessage: error.message,
          txHash: undefined,
        }))
      })
  }, [priceImpactWithoutFee, swapCallback, setSwapState])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode)

  const handleConfirmDismiss = useCallback(() => {
    setSwapState((prevState) => ({ ...prevState, showConfirm: false }))

    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [onUserInput, txHash, setSwapState])

  const handleAcceptChanges = useCallback(() => {
    setSwapState((prevState) => ({ ...prevState, tradeToConfirm: trade }))
  }, [trade])

  // This will check to see if the user has selected Syrup to either buy or sell.
  // If so, they will be alerted with a warning message.
  const checkForSyrup = useCallback(
    (selected: string, purchaseType: string) => {
      if (selected === 'syrup') {
        setIsSyrup(true)
        setSyrupTransactionType(purchaseType)
      }
    },
    [setIsSyrup, setSyrupTransactionType]
  )

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
      let res = inputCurrency.symbol.toLowerCase();
      res = res === 'btcb' ? 'btc' : res;
      res = (res === 'tta' || res === 'ttb') ? 'bnb' : res;
      console.log('---------res', res);
      setPriceA(priceData.find((coin) => coin.symbol === res).current_price);
      if (inputCurrency.symbol.toLowerCase() === 'syrup') {
        checkForSyrup(inputCurrency.symbol.toLowerCase(), 'Selling')
      }
    },
    [onCurrencySelection, setApprovalSubmitted, checkForSyrup, priceData]
  )

  const handleMaxInput = useCallback(() => {
    if (maxAmountInput) {
      onUserInput(Field.INPUT, maxAmountInput.toExact())
    }
  }, [maxAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
      let res = outputCurrency.symbol.toLowerCase();
      res = res === 'btcb' ? 'btc' : res;
      res = (res === 'tta' || res === 'ttb') ? 'usdt' : res;
      console.log('---------res', res);
      setPriceB(priceData.find((coin) => coin.symbol === res).current_price);
      if (priceA === -1) setPriceA(priceData.find((coin) => coin.symbol === 'bnb').current_price);
      if (outputCurrency.symbol.toLowerCase() === 'syrup') {
        checkForSyrup(outputCurrency.symbol.toLowerCase(), 'Buying')
      }
    },
    [onCurrencySelection, checkForSyrup, priceData, priceA]
  )

  const onChangePrice = () => {
    const t = priceA;
    setPriceA(priceB);
    setPriceB(t);
  }
  return (
    <div className='swap' style={{ color: 'white', justifyContent: 'space-between', padding: 10, fontSize: '28px' }}>
      <div style={{ display: 'flex', gap: '40px', paddingTop: '50px', margin: '40px', background: 'transparent', borderBottom: 'solid 1px' }}>
        <Heading style={{ color: 'white', fontWeight: 700, borderBottom: 'solid 2px white' }}>Swap</Heading>
        <Heading>Pairs&Token</Heading>
        <Heading>Hartson</Heading>
      </div>
      <TokenWarningModal
        isOpen={urlLoadedTokens.length > 0 && !dismissTokenWarning && !tokenWhitelisted}
        tokens={urlLoadedTokens}
        onConfirm={handleConfirmTokenWarning}
      />
      <SyrupWarningModal
        isOpen={isSyrup}
        transactionType={syrupTransactionType}
        onConfirm={handleConfirmSyrupWarning}
      />
      {/* <CardNav /> */}
      <div style={{ position: 'absolute', width: '1920px', top: '80px', left: '-10px', zIndex: 1 }}>
        <img src={Rect1} alt="rect" style={{ position: 'absolute', width: '1920px', transform: '50% 50% 0 0', zIndex: 1 }} />
        <img src={Ellipse1} alt='ellipse' style={{ width: '20%', top: '-70px', position: 'absolute', left: '0px', zIndex: 3 }} />
        <img src={Ellipse2} alt='ellipse' style={{ width: '20%', position: 'absolute', right: '300px', top: '50px', borderRadius: '50%' }} />
      </div>
      <AppBody>
        <Wrapper id="swap-page" style={{ display: 'flex', placeContent: 'center', alignItems: 'center' }}>
          <ConfirmSwapModal
            isOpen={showConfirm}
            trade={trade}
            originalTrade={tradeToConfirm}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            allowedSlippage={allowedSlippage}
            onConfirm={handleSwap}
            swapErrorMessage={swapErrorMessage}
            onDismiss={handleConfirmDismiss}
          />
          {/* <PageHeader title="Exchange" description="Trade tokens in an instant" /> */}
          <CardBody style={{ position: 'relative', padding: '0px', marginRight: '10px', width: '100%', minWidth: '100px', maxWidth: '670px' }}>
            <AutoColumn gap="sm">
              <CurrencyInputPanel
                label={
                  independentField === Field.OUTPUT && !showWrap && trade
                    ? 'From (estimated)'
                    : TranslateString(76, 'From')
                }
                value={formattedAmounts[Field.INPUT]}
                showMaxButton={!atMaxAmountInput}
                currency={currencies[Field.INPUT]}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                onCurrencySelect={handleInputSelect}
                otherCurrency={currencies[Field.OUTPUT]}
                id="swap-currency-input"
              />
              <AutoColumn justify="space-between" style={{ position: 'absolute', zIndex: 50, left: 120, top: account ? 150 : 120 }}>
                <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable>
                    <IconButton
                      variant="tertiary"
                      onClick={() => {
                        setApprovalSubmitted(false) // reset 2 step UI for approvals
                        onSwitchTokens()
                        onChangePrice()
                      }}
                      style={{ borderRadius: '50%', border: 'solid 5px black' }}
                      size="md"
                    >
                      <CgArrowsExchangeAltV color="white" fontSize={36} style={{ background: '#007BB7', borderRadius: '50%' }} />
                    </IconButton>
                  </ArrowWrapper>
                  {recipient === null && !showWrap && isExpertMode ? (
                    <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                      + Add a send (optional)
                    </LinkStyledButton>
                  ) : null}
                </AutoRow>
              </AutoColumn>
              <CurrencyInputPanel
                value={formattedAmounts[Field.OUTPUT]}
                onUserInput={handleTypeOutput}
                label={
                  independentField === Field.INPUT && !showWrap && trade ? 'To (estimated)' : TranslateString(80, 'To')
                }
                showMaxButton={false}
                currency={currencies[Field.OUTPUT]}
                onCurrencySelect={handleOutputSelect}
                otherCurrency={currencies[Field.INPUT]}
                id="swap-currency-output"
              />

              {recipient !== null && !showWrap ? (
                <>
                  <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                    <ArrowWrapper clickable={false}>
                      <ArrowDown size="16" color={theme.colors.textSubtle} />
                    </ArrowWrapper>
                    <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                      - Remove send
                    </LinkStyledButton>
                  </AutoRow>
                  <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                </>
              ) : null}

              {showWrap ? null : (
                <Card padding=".25rem .75rem 0 .75rem" borderRadius="20px">
                  <AutoColumn gap="4px">
                    {Boolean(trade) && (
                      <RowBetween align="center">
                        <Text fontSize="14px">Price</Text>
                        <TradePrice
                          data={[priceA, priceB]}
                          price={trade?.executionPrice}
                          showInverted={showInverted}
                          setShowInverted={setShowInverted}
                        />
                      </RowBetween>
                    )}
                    {allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && (
                      <RowBetween align="center">
                        <Text fontSize="14px">Slippage Tolerance</Text>
                        <Text fontSize="14px">{allowedSlippage / 100}%</Text>
                      </RowBetween>
                    )}
                  </AutoColumn>
                </Card>
              )}
            </AutoColumn>
            <BottomGrouping>
              {!account ? (
                <ConnectWalletButton fullWidth />
              ) : showWrap ? (
                <Button disabled={Boolean(wrapInputError)} onClick={onWrap} fullWidth>
                  {wrapInputError ??
                    (wrapType === WrapType.WRAP ? 'Wrap' : wrapType === WrapType.UNWRAP ? 'Unwrap' : null)}
                </Button>
              ) : noRoute && userHasSpecifiedInputOutput ? (
                <GreyCard style={{ textAlign: 'center' }}>
                  <Main mb="4px">Insufficient liquidity for this trade.</Main>
                </GreyCard>
              ) : showApproveFlow ? (
                <RowBetween>
                  <Button
                    onClick={approveCallback}
                    disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                    style={{ width: '48%' }}
                    variant={approval === ApprovalState.APPROVED ? 'success' : 'primary'}
                  >
                    {approval === ApprovalState.PENDING ? (
                      <AutoRow gap="6px" justify="center">
                        Approving <Loader stroke="white" />
                      </AutoRow>
                    ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                      'Approved'
                    ) : (
                      `Approve ${currencies[Field.INPUT]?.symbol}`
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      if (isExpertMode) {
                        handleSwap()
                      } else {
                        setSwapState({
                          tradeToConfirm: trade,
                          attemptingTxn: false,
                          swapErrorMessage: undefined,
                          showConfirm: true,
                          txHash: undefined,
                        })
                      }
                    }}
                    style={{ width: '48%' }}
                    id="swap-button"
                    disabled={
                      !isValid || approval !== ApprovalState.APPROVED || (priceImpactSeverity > 3 && !isExpertMode)
                    }
                    variant={isValid && priceImpactSeverity > 2 ? 'danger' : 'primary'}
                  >
                    {priceImpactSeverity > 3 && !isExpertMode
                      ? `Price Impact High`
                      : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
                  </Button>
                </RowBetween>
              ) : (
                <Button
                  onClick={() => {
                    if (isExpertMode) {
                      handleSwap()
                    } else {
                      setSwapState({
                        tradeToConfirm: trade,
                        attemptingTxn: false,
                        swapErrorMessage: undefined,
                        showConfirm: true,
                        txHash: undefined,
                      })
                    }
                  }}
                  id="swap-button"
                  // disabled={!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError}
                  disabled={!isValid || !!swapCallbackError}
                  variant={isValid && priceImpactSeverity > 2 && !swapCallbackError ? 'danger' : 'primary'}
                  fullWidth
                >
                  {swapInputError ||
                    (priceImpactSeverity > 3 && !isExpertMode
                      ? `Price Impact Too High`
                      : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`)}
                </Button>
              )}
              {showApproveFlow && <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />}
              {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
            </BottomGrouping>
            <AdvancedSwapDetailsDropdown trade={trade} />
          </CardBody>
          <Panel style={{ height: '100%' }}>
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
          </Panel>
        </Wrapper>
      </AppBody>
    </div>
  )
}

export default Swap
