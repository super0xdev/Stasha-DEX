import React from 'react'
import styled from 'styled-components'
import { Card } from '@wakandaswap-libs/uikit'

export const BodyWrapper = styled(Card)`
  position: relative;
  width: 100%;
  margin: auto;
  border-radius: 0px;
  background: transparent;
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children }: { children: React.ReactNode }) {
  return <BodyWrapper>{children}</BodyWrapper>
}
