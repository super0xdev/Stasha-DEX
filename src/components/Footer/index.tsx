import React from "react";
import "./index.css";
import { FaTelegram, FaTwitter, FaMedium, FaDiscord, FaArrowRight, FaRegMoon } from "react-icons/fa";
// import { useTheme } from "../context/ThemeContext";
import { BiSun } from "react-icons/bi";
import styled from "styled-components";
import SVG from './footer.svg';
import Ellipse from './ellipse.svg';

const Body = styled.div`
display: flex;
position:relative;
color: white;
gap: 80px;
width: 100%;
z-index: 5;
align-items:start;
@media (max-width: 1024px) {
    flex-direction: column;
    align-items:center;
    gap: 0px;
}
`

const Span = styled.span`
font-family: Roboto;
font-size: 20px;
`
const SpanItem = styled.span`
font-family: Roboto;
font-size: 14px;
color: gray;
`

const Grid = styled.div`
display: grid;
grid-template-columns: repeat(4, minmax(0, 1fr));
gap: 20px;
padding-top: 25px;
justify-content: space-between;
width: 80%;
@media (min-width: 576px) and (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 50%;
}
@media (max-width: 576px) {
    grid-template-columns: repeat(1, minmax(0, 1fr));
    width: 20%;
}
`

const Img = styled.img`
position: absolute;
z-index: 2;
top: -250px;
@media (max-width: 1024px) {
    display: none;
}
`
const Footer = () => {

    return (
        <Body>
            <Img src={Ellipse} alt='alt' />
            <div style={{ display: 'flex', paddingLeft: '30px' }}>
                <img src='./img/logo.png' alt='logo' />
                <span style={{ fontSize: '40px', fontFamily: 'Fredoka', alignSelf: 'center' }}>Stasha</span>
            </div>
            <Grid>
                <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                    <Span>Pages</Span>
                    <SpanItem style={{ color: '#00ACFF' }}>Swap</SpanItem>
                    <SpanItem>Liquidity Providing</SpanItem>
                    <SpanItem>Farming</SpanItem>
                    <SpanItem>Builder</SpanItem>
                    <SpanItem>Vesting</SpanItem>
                </div>
                <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                    <Span>Products</Span>
                    <SpanItem>Stasha Smartchain</SpanItem>
                    <SpanItem>Stasha Exchanges</SpanItem>
                    <SpanItem>Stasha Block Explorer</SpanItem>
                    <SpanItem>Stasha Wallet</SpanItem>
                    <SpanItem>Alterverse</SpanItem>
                    <SpanItem>NFT Marketplace</SpanItem>
                    <SpanItem>Stasha Coin</SpanItem>
                    <SpanItem>Staking Platform</SpanItem>
                    <SpanItem>Multi-sig Wallet</SpanItem>
                </div>
                <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                    <Span>Dev</Span>
                    <SpanItem>Documentation</SpanItem>
                    <SpanItem>Whitepaper</SpanItem>
                </div>
                <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                    <Span style={{ fontSize: '20px' }}>Audited by</Span>
                    <img src={SVG} alt='alt' style={{ width: '150px' }} />
                </div>
            </Grid>
        </Body>
    )
};

export default Footer;
