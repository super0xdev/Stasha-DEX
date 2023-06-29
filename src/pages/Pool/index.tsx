import React, { useContext, useMemo } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Pair } from '@wakandaswap-libs/sdk'
import { Button, CardBody, Text } from '@wakandaswap-libs/uikit'
import { Link } from 'react-router-dom'
import Question from 'components/QuestionHelper'
import FullPositionCard from 'components/PositionCard'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { StyledInternalLink, TYPE } from 'components/Shared'
import { LightCard } from 'components/Card'
import { RowBetween } from 'components/Row'
import { AutoColumn } from 'components/Column'
import ConnectWalletButton from 'components/ConnectWalletButton'

import { useActiveWeb3React } from 'hooks'
import { usePairs } from 'data/Reserves'
import { toV2LiquidityToken, useTrackedTokenPairs } from 'state/user/hooks'
import { Dots } from 'components/swap/styleds'
import TranslatedText from 'components/TranslatedText'
import { TranslateString } from 'utils/translateTextHelpers'
import PageHeader from 'components/PageHeader'
import AppBody from '../AppBody'
import './index.css'
import Coin from './pool.svg'
import Ellipse1 from './swapEllipse1.svg'
import Rect1 from './swap1.svg'

const { body: Body } = TYPE

const PoolHeading = styled.div`
display: flex;
padding: 40px;
gap: 20px;
justify-content: space-between;
@media (max-width: 630px) {
  flex-direction: column;
}
position: relative;
z-index: 5;
`
const PoolHRight = styled.div`
display: flex;
align-self: center;
align-items: center;
text-align: center;
gap: 20px;
@media (max-width: 630px) {
}
`

const Details = styled.div`
margin-left: 30px;
margin-right: 30px;
padding-left: 30px;
padding-top: 30px;
display: flex;
background: #00ACFF40;
border-radius: 20px;
@media (max-width: 630px) {
  flex-direction: column;
}
`


const BlurCircle = styled.div`
width: 200px;
height: 200px;
position: absolute;
z-index: 5;
left: 0px;
top: 50px;
background: #5061FF40;
filter: blur(60px);
border-radius: 50%;
`

export default function Pool() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken), [
    tokenPairsWithLiquidityTokens,
  ])
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  )

  const v2Pairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const v2IsLoading =
    fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some((V2Pair) => !V2Pair)

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  return (
    <div className='pool'>
      {/* <CardNav activeIndex={1} /> */}
      <div style={{ position: 'absolute', width: '1920px', top: '80px', left: '-10px', zIndex: 1 }}>
        <img src={Ellipse1} alt='ellipse' style={{ width: '20%', top: '-70px', position: 'absolute', left: '0px', zIndex: 3 }} />
      </div>
      <AppBody>
        <PoolHeading>
          <p style={{ fontFamily: 'Fredoka', fontSize: '28px', alignSelf: 'center' }}>My Liquidity Pools</p>
          <PoolHRight>
            <p style={{ color: '#00ACFF', fontFamily: 'Fredoka' }}>Refresh Pools</p>
            <Button style={{ background: '#00ACFF', borderRadius: '10px' }} id="join-pool-button" as={Link} to="/add/ETH">
              <TranslatedText translationId={100}>Add Liquidity</TranslatedText>
            </Button>
          </PoolHRight>
        </PoolHeading>
        <Details>
          <div style={{ paddingRight: '10px' }}>
            <div style={{ fontFamily: 'Fredoka', fontSize: '28px' }}>Provide Liquidity and earn!</div>
            <div style={{ fontFamily: 'Roboto', fontSize: '16px', color: '#cccccc', paddingTop: '10px' }}>Our liquidity pools provide a seamless way for you to provide liquidity and earn fees from every token swap.Choose your preferred pool, add your assets, and watch as each transaction generates income.Join and start earning rewards today.</div>
          </div>
          <img src={Coin} alt='alt' width="200px" />
        </Details>
        <AutoColumn gap="lg" justify="center">
          <CardBody style={{ width: '100%', padding: '32px' }}>
            <AutoColumn gap="12px" style={{ width: '100%' }}>
              {!account ? (
                <LightCard padding="40px" style={{ zIndex: '10' }}>
                  <Body color='white' style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', paddingBottom: '20px' }}>Your wallet is not connected</div>
                    <div>Please connect your wallet</div>
                    <div style={{ paddingBottom: '20px' }}>Learn how to install and create Stasha Wallet</div>
                    <ConnectWalletButton title="Connect Wallet" />
                  </Body>
                </LightCard>
              ) : v2IsLoading ? (
                <LightCard padding="40px">
                  <Body color={theme.colors.textDisabled} textAlign="center">
                    <Dots>Loading</Dots>
                  </Body>
                </LightCard>
              ) : allV2PairsWithLiquidity?.length > 0 ? (
                <>
                  {allV2PairsWithLiquidity.map((v2Pair) => (
                    <FullPositionCard key={v2Pair.liquidityToken.address} pair={v2Pair} />
                  ))}
                </>
              ) : (
                <LightCard padding="40px">
                  <Body color={theme.colors.textDisabled} textAlign="center">
                    <TranslatedText translationId={104}>No liquidity found.</TranslatedText>
                  </Body>
                </LightCard>
              )}

              <div style={{ marginBottom: '100px' }}>
                <Text fontSize="14px" style={{ padding: '.5rem 0 .5rem 0' }}>
                  {TranslateString(106, "Pools")}{' '}
                </Text>
                <input placeholder="Search coin name" style={{ color: 'white', outline: 'none', border: 'none', background: '#005E8B40', width: '100%', padding: '12px', borderRadius: '15px' }} />
              </div>
            </AutoColumn>
          </CardBody>
        </AutoColumn>
      </AppBody>
    </div>
  )
}
