// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SafeMathExample {
    uint256 public balance = 250;

    function add(uint256 _value) public {
        balance = balance + _value; // Safe in Solidity ≥ 0.8 (auto‑checks overflow)
    }
}
