import React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Button, ButtonProps, ConnectorId, useWalletModal } from '@wakandaswap-libs/uikit'
import { injected, walletconnect, bsc } from 'connectors'
import { AiOutlineArrowRight } from 'react-icons/ai';
import useI18n from 'hooks/useI18n'

const UnlockButton: React.FC<ButtonProps> = props => {
  const TranslateString = useI18n()
  const { account, activate, deactivate } = useWeb3React()

  const handleLogin = (connectorId: ConnectorId) => {
    console.log(connectorId);
    if (connectorId === 'bsc') {
      return activate(bsc)
    }

    if (connectorId === 'walletconnect') {
      return activate(walletconnect)
    }

    return activate(injected)
  }

  const { onPresentConnectModal } = useWalletModal(handleLogin, deactivate, account as string)

  return (
    <Button style={{ zIndex: 20, position: 'relative', background: '#00ACFF' }} onClick={onPresentConnectModal} {...props}>
      {TranslateString(292, 'Connect Stasha Wallet')}
      &nbsp;
      <AiOutlineArrowRight />
    </Button>
  )
}

export default UnlockButton
