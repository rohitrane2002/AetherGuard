// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReentrancyExample {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) external {
        require(balances[msg.sender] >= _amount, "Insufficient");
        (bool sent, ) = msg.sender.call{value: _amount}(""); // ⚠️ vulnerable to reentrancy
        require(sent, "Failed");
        balances[msg.sender] -= _amount;
    }
}
