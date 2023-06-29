import React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Button, ButtonProps, ConnectorId, useWalletModal } from '@wakandaswap-libs/uikit'
import { injected, walletconnect, bsc } from 'connectors'
import { AiOutlineArrowRight } from 'react-icons/ai';
import useI18n from 'hooks/useI18n'

interface ConnectButtonProps {
  title: string
}

export default function UnlockButton({
  title
}: ConnectButtonProps) {
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
    <Button style={{ zIndex: 20, position: 'relative', background: '#00ACFF' }} onClick={onPresentConnectModal}>
      {TranslateString(292, title)}
      &nbsp;
      <AiOutlineArrowRight />
    </Button>
  )
}
