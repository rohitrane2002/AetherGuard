// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

contract OverflowExample {
    uint8 public balance = 250;

    function add(uint8 _value) public {
        balance = balance + _value; // ⚠️ vulnerable to overflow
    }
}
