import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd } from "react-icons/md";
import { RiSubtractLine } from "react-icons/ri";
import styled from 'styled-components';

const AccordionWrapper = styled.div`
    background-color: black;
    text-align: left;
    width: 100%;
    left: 0px;
    z-index: 10;
    color:white;
    div {
        &.active {
            flex-direction: column;
        }

        .heading {
            display: flex;
            align-items: center;
            padding: 0.5rem 1rem;
            cursor: pointer;
            &:hover {
                background-color: gray;
            }
            .expand-icon {
                &.active {
                    color: white;
                }
            }
        }

        .sub-menu {
            display: none;
            flex-direction: column;
            margin-left: 2rem;
            a {
                display: block;
                padding: 0.5rem 1rem;
                cursor: pointer;
                &:hover {
                    background-color: gray;
                }
            }
        }

        &.active .sub-menu {
            display: flex;
        }
    }

    .menu-item {
        display: block;
        padding: 0.5rem 1rem;
        cursor: pointer;
        &:hover {
            background-color: gray;
        }
    }
`;

const Accordion = () => {
    const [flag, setFlag] = useState(-1);
    const handleFlag = (id: any) => {
        // if (id === flag) {
        //     setFlag(-1);
        // } else {
        //     setFlag(id);
        // }
        if (flag === id) setFlag(-1);
        else setFlag(id);
    };

    return (
        <AccordionWrapper>
            <div className={`${flag === 1 ? 'active' : ''}`} aria-hidden onClick={() => handleFlag(1)}>
                <div
                    className="heading"
                >
                    {flag !== 1 ? (
                        <MdAdd className='expand-icon' />
                    ) : (
                        <RiSubtractLine className='expand-icon active' />
                    )}
                    <span>Trade</span>
                </div>
                <div className="sub-menu">
                    <Link to='/swap' className="menu-item">Swap</Link>
                    <Link to='/liquidity' className="menu-item">Liquidity</Link>
                </div>
            </div>
            <div className={`${flag === 2 ? 'active' : ''}`} aria-hidden onClick={() => handleFlag(2)}>
                <div
                    className="heading"
                >
                    {flag !== 2 ? (
                        <MdAdd className='expand-icon' />
                    ) : (
                        <RiSubtractLine className='expand-icon active' />
                    )}
                    <span>Earn</span>
                </div>
                <div className="sub-menu">
                    <Link to='/farms' className="menu-item">Farms</Link>
                    <Link to='/pools' className="menu-item">Pools</Link>
                </div>
            </div>
            <div className="menu-item">Launch</div>
            <div className="menu-item">Referrals</div>
        </AccordionWrapper>
    )
}

export default Accordion;