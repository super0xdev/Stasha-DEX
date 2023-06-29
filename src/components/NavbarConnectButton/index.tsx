import React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Button, ButtonProps, ConnectorId, useWalletModal } from '@wakandaswap-libs/uikit'
import { injected, walletconnect, bsc } from 'connectors'
import useI18n from 'hooks/useI18n'
import { BiRightArrowAlt } from 'react-icons/bi'

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
        !account ?
            <Button style={{ zIndex: 20, gap: '10px', position: 'relative', background: 'transparent' }} onClick={onPresentConnectModal} {...props}>
                {TranslateString(292, 'Connect Wallet')}
                <BiRightArrowAlt style={{ fontSize: '30px', padding: '5px', background: '#00ACFF', borderRadius: '12px' }} />
            </Button> : <p style={{ width: '200px', padding: '10px' }}>{account.slice(0, 4)}...{account.slice(account.length - 4, account.length)}</p>

    )
}

export default UnlockButton
