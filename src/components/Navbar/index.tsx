import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useActiveWeb3React } from "hooks";
import { PiDotsThreeOutlineDuotone } from 'react-icons/pi';
import Accordion from "./Accordion";
import NavbarConnectButton from '../NavbarConnectButton';

const NavbarWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: black;
  color: gray;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 20px;
  padding-bottom: 0px;
  width: 100%;
  justify-content: space-between;
  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: space-between;
  }
`;

const Logo = styled.img`
  height: 50px;
  margin: 0 10px;
`;

const NavLinksWrapper = styled.div`
  display: flex;
  gap: 40px;
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  margin: 0 10px;
  font-size: 22px;
  font-family: 'Roboto';
  &:hover {
    color: white;
  }
`;

const Hamburger = styled.svg`
display: none;
@media (max-width: 768px) {
  display: block;
}
`

const Navbar = () => {
  const [vis, setVis] = useState(false);
  const [cur, setCur] = useState("");
  const [menu, setMenu] = useState(-1);

  const { account } = useActiveWeb3React()

  return (
    <>
      <NavbarWrapper>
        <div style={{ color: 'white' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Logo src="./logo.png" alt="logo" />
            <span style={{ fontFamily: 'Fredoka', fontSize: '40px' }}>Stasha</span>
          </Link>
        </div>

        <NavLinksWrapper>
          <NavLink
            to="/swap"
            onClick={() => setCur("swap")}
            style={{ color: `${cur === 'swap' ? 'white' : 'gray'}` }}
          >
            Swap
          </NavLink>
          <NavLink
            to="/liquidity"
            onClick={() => setCur("liquidity")}
            style={{ color: `${cur === 'liquidity' ? 'white' : 'gray'}` }}
          >
            Liquidity
          </NavLink>
          <NavLink
            to="/farm"
            onClick={() => setCur("farm")}
            style={{ color: `${cur === 'farm' ? 'white' : 'gray'}` }}
          >
            Farm
          </NavLink>
          <PiDotsThreeOutlineDuotone style={{ color: 'white', fontSize: '20px' }} />
        </NavLinksWrapper>

        <div>
          <Hamburger
            onClick={() => setVis(!vis)}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="30"
            height="30"
          >
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </Hamburger>
        </div>
        <NavbarConnectButton />
      </NavbarWrapper>

      <div aria-hidden style={{ display: vis ? "block" : "none", width: '100%' }}>
        <Accordion />
      </div>
    </>
  );
};

export default Navbar;