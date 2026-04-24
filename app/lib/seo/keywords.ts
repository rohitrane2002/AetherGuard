/**
 * AetherGuard pSEO Keyword Database
 * ──────────────────────────────────
 * Static keyword data for programmatic SEO pages.
 * Zero API dependency — all content is baked into the build.
 *
 * Each entry generates a page at:
 *   /audit/{slug}   — vulnerability deep-dives
 *   /tools/{slug}   — security tool landing pages
 */

export type PageCategory = "audit" | "tools";

export interface SEOPage {
  slug: string;
  category: PageCategory;
  title: string;
  h1: string;
  metaDescription: string;
  keywords: string[];
  severity: "critical" | "high" | "medium" | "low" | "info";
  whatIsIt: string;
  whyItMatters: string;
  example: string;
  howToFix: string;
  relatedSlugs: string[];
}

// ─────────────────────────────────────────────────
// AUDIT PAGES  —  Vulnerability Encyclopedia
// ─────────────────────────────────────────────────

const auditPages: SEOPage[] = [
  {
    slug: "reentrancy",
    category: "audit",
    title: "Reentrancy Attack in Solidity — Detection & Prevention",
    h1: "Reentrancy Attack in Smart Contracts",
    metaDescription: "Learn how reentrancy attacks exploit Solidity contracts, see real code examples, and discover how to prevent them with checks-effects-interactions and ReentrancyGuard.",
    keywords: ["reentrancy attack", "solidity reentrancy", "smart contract vulnerability", "reentrancy guard", "checks effects interactions"],
    severity: "critical",
    whatIsIt: "A reentrancy attack occurs when a malicious contract calls back into the victim contract before the first invocation completes. This allows the attacker to repeatedly drain funds by re-entering the withdrawal function before the balance is updated.",
    whyItMatters: "The DAO hack in 2016 exploited this exact vulnerability, draining $60M worth of ETH. Reentrancy remains one of the most common and devastating attack vectors in DeFi. Any contract that sends ETH or tokens before updating state is potentially vulnerable.",
    example: `// VULNERABLE: sends ETH before updating balance
function withdraw() public {
    uint bal = balances[msg.sender];
    (bool sent, ) = msg.sender.call{value: bal}("");
    require(sent, "Failed");
    balances[msg.sender] = 0; // updated AFTER external call
}`,
    howToFix: `Use the checks-effects-interactions pattern: update state BEFORE making external calls. Additionally, use OpenZeppelin's ReentrancyGuard modifier.

// SAFE: uses checks-effects-interactions
function withdraw() public nonReentrant {
    uint bal = balances[msg.sender];
    balances[msg.sender] = 0; // update BEFORE external call
    (bool sent, ) = msg.sender.call{value: bal}("");
    require(sent, "Failed");
}`,
    relatedSlugs: ["unchecked-call-return", "delegatecall-vulnerability", "flash-loan-attack"],
  },
  {
    slug: "integer-overflow-underflow",
    category: "audit",
    title: "Integer Overflow & Underflow in Solidity — Complete Guide",
    h1: "Integer Overflow and Underflow Vulnerabilities",
    metaDescription: "Understand how integer overflow and underflow bugs work in Solidity smart contracts, why Solidity 0.8 changed everything, and how to protect older contracts.",
    keywords: ["integer overflow solidity", "underflow vulnerability", "safeMath", "solidity 0.8 overflow", "arithmetic bug smart contract"],
    severity: "high",
    whatIsIt: "Integer overflow occurs when an arithmetic operation produces a value larger than the maximum for that type (e.g., uint256 max is 2^256-1). Underflow happens when subtracting below zero. In Solidity < 0.8, the value silently wraps around, allowing attackers to manipulate balances.",
    whyItMatters: "Before Solidity 0.8, all arithmetic was unchecked by default. Attackers could exploit this to mint unlimited tokens, bypass balance checks, or manipulate voting systems. Legacy contracts deployed before 0.8 remain vulnerable unless they use SafeMath.",
    example: `// Solidity < 0.8 — VULNERABLE
uint8 balance = 0;
balance -= 1; // wraps to 255 instead of reverting

// token transfer bypass
function transfer(address to, uint256 amount) {
    require(balances[msg.sender] - amount >= 0); // always true!
    balances[msg.sender] -= amount;
    balances[to] += amount;
}`,
    howToFix: `Upgrade to Solidity ≥ 0.8 which has built-in overflow checks. For legacy contracts, use OpenZeppelin's SafeMath library.

// Solidity ≥ 0.8 — automatically reverts on overflow
uint256 a = type(uint256).max;
a + 1; // reverts

// Legacy: use SafeMath
using SafeMath for uint256;
balances[msg.sender] = balances[msg.sender].sub(amount);`,
    relatedSlugs: ["reentrancy", "access-control", "unchecked-call-return"],
  },
  {
    slug: "flash-loan-attack",
    category: "audit",
    title: "Flash Loan Attacks Explained — DeFi Security Guide",
    h1: "Flash Loan Attack Vectors in DeFi",
    metaDescription: "Deep dive into flash loan attacks: how they exploit DeFi protocols, real-world examples from Euler and bZx, and proven mitigation strategies for your contracts.",
    keywords: ["flash loan attack", "defi exploit", "flash loan vulnerability", "oracle manipulation", "aave flash loan"],
    severity: "critical",
    whatIsIt: "Flash loans allow borrowing massive amounts of capital with zero collateral, as long as the loan is repaid within a single transaction. Attackers use this instant capital to manipulate oracle prices, exploit arbitrage, or drain liquidity pools.",
    whyItMatters: "Flash loan attacks have caused billions in losses across DeFi. The Euler Finance hack ($197M), bZx exploits, and numerous Pancake/Uniswap LP drains all used flash loans as the primary attack vector. Any protocol relying on spot prices is a target.",
    example: `// Attacker contract
function attack() external {
    // 1. Borrow $100M via flash loan
    aave.flashLoan(address(this), DAI, 100_000_000e18, "");
}

function executeOperation(...) {
    // 2. Dump tokens to manipulate oracle price
    uniswap.swap(DAI, WETH, 100_000_000e18);
    // 3. Exploit price-dependent function
    vulnerableProtocol.liquidate(victim);
    // 4. Repay flash loan, keep profit
}`,
    howToFix: `- Use time-weighted average prices (TWAP) instead of spot prices
- Integrate Chainlink or other decentralized oracles
- Add multi-block delay for price-sensitive operations
- Implement circuit breakers for large price movements

// Use Chainlink oracle instead of spot price
AggregatorV3Interface feed = AggregatorV3Interface(priceFeedAddress);
(, int price,,,) = feed.latestRoundData();`,
    relatedSlugs: ["oracle-manipulation", "reentrancy", "price-manipulation"],
  },
  {
    slug: "access-control",
    category: "audit",
    title: "Access Control Vulnerabilities in Smart Contracts",
    h1: "Broken Access Control in Solidity",
    metaDescription: "Discover how missing or incorrect access control leads to contract takeovers. Learn to implement proper role-based access with OpenZeppelin's AccessControl.",
    keywords: ["access control solidity", "missing modifier", "onlyOwner bypass", "smart contract authorization", "role based access"],
    severity: "critical",
    whatIsIt: "Access control vulnerabilities occur when critical functions lack proper authorization checks. This allows any user to call admin-only functions like withdrawing funds, minting tokens, pausing contracts, or changing ownership.",
    whyItMatters: "The Parity Wallet hack froze $280M worth of ETH because the library contract's initialization function had no access control, allowing anyone to call it and self-destruct the contract. Missing modifiers remain the #1 cause of contract takeovers.",
    example: `// VULNERABLE: anyone can call
function mint(address to, uint256 amount) public {
    _mint(to, amount); // no access check!
}

function setPrice(uint256 newPrice) public {
    price = newPrice; // no onlyOwner modifier
}

function withdrawAll() public {
    payable(msg.sender).transfer(address(this).balance);
}`,
    howToFix: `Always use access control modifiers. Use OpenZeppelin's Ownable or AccessControl for role-based permissions.

// SAFE: proper access control
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyToken is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}`,
    relatedSlugs: ["delegatecall-vulnerability", "tx-origin", "uninitialized-proxy"],
  },
  {
    slug: "delegatecall-vulnerability",
    category: "audit",
    title: "Delegatecall Exploits in Solidity — Storage Collision Guide",
    h1: "Delegatecall Vulnerabilities & Storage Collision",
    metaDescription: "Learn how delegatecall preserves caller context, why storage layout collisions are dangerous, and how to safely use delegate calls in proxy patterns.",
    keywords: ["delegatecall vulnerability", "storage collision", "proxy pattern exploit", "solidity delegatecall", "contract upgrade vulnerability"],
    severity: "critical",
    whatIsIt: "delegatecall executes code from another contract but in the context of the calling contract. This means the called code can modify the caller's storage. If storage layouts don't match, or if the delegate target is attacker-controlled, the entire contract can be taken over.",
    whyItMatters: "The second Parity Wallet hack and numerous proxy contract exploits stem from delegatecall misuse. Any upgradeable contract using the proxy pattern is at risk if storage layouts aren't carefully managed.",
    example: `// VULNERABLE: delegatecall to user-supplied address
function execute(address target, bytes calldata data) public {
    target.delegatecall(data); // attacker controls target!
}

// Storage collision in proxy
contract Proxy {
    address public implementation; // slot 0
}
contract Logic {
    address public owner; // also slot 0 — COLLISION!
}`,
    howToFix: `- Never delegatecall to untrusted addresses
- Use OpenZeppelin's transparent or UUPS proxy patterns
- Ensure storage layouts are compatible between proxy and implementation
- Use storage gaps for future-proofing

// SAFE: OpenZeppelin UUPS pattern
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MyContract is UUPSUpgradeable {
    function _authorizeUpgrade(address) internal override onlyOwner {}
}`,
    relatedSlugs: ["access-control", "uninitialized-proxy", "selfdestruct-vulnerability"],
  },
  {
    slug: "frontrunning",
    category: "audit",
    title: "Frontrunning & MEV in Smart Contracts — Prevention Guide",
    h1: "Frontrunning and MEV Attacks",
    metaDescription: "Understand how miners and bots frontrun transactions on Ethereum, the MEV problem, and practical mitigation techniques including commit-reveal and Flashbots.",
    keywords: ["frontrunning ethereum", "mev attack", "sandwich attack", "transaction ordering", "flashbots protect"],
    severity: "high",
    whatIsIt: "Frontrunning occurs when a validator or bot observes a pending transaction in the mempool and submits their own transaction with a higher gas price to execute first. This is used to front-run DEX trades (sandwich attacks), snipe NFT mints, and exploit any state change visible in the mempool.",
    whyItMatters: "MEV extraction costs Ethereum users over $600M per year. Sandwich attacks on Uniswap alone drain millions monthly from retail traders. Any on-chain transaction that reveals exploitable intent in the mempool is a frontrunning target.",
    example: `// VULNERABLE: visible swap intent in mempool
function swapExact(uint amountIn, uint amountOutMin) public {
    // Bot sees this tx in mempool, frontruns with:
    // 1. Buy token (raises price)
    // 2. Your tx executes (at worse price)
    // 3. Bot sells (profits from your slippage)
    router.swapExactTokensForTokens(amountIn, amountOutMin, path, ...);
}`,
    howToFix: `- Use commit-reveal schemes for sensitive operations
- Set tight slippage tolerances on DEX trades
- Use Flashbots Protect or private mempools
- Implement batch auctions instead of first-come-first-served

// Commit-reveal pattern
mapping(bytes32 => uint) public commitments;

function commit(bytes32 hash) external {
    commitments[hash] = block.number;
}

function reveal(uint value, bytes32 salt) external {
    require(commitments[keccak256(abi.encode(value, salt))] > 0);
    // Process after delay
}`,
    relatedSlugs: ["oracle-manipulation", "flash-loan-attack", "timestamp-dependence"],
  },
  {
    slug: "unchecked-call-return",
    category: "audit",
    title: "Unchecked Call Return Values in Solidity",
    h1: "Unchecked External Call Return Values",
    metaDescription: "Learn why ignoring return values from low-level calls in Solidity leads to silent failures and fund loss. Fix with proper error handling patterns.",
    keywords: ["unchecked call return", "low level call solidity", "silent failure", "call return value", "send vs transfer"],
    severity: "high",
    whatIsIt: "Low-level calls in Solidity (call, send, delegatecall) return a boolean indicating success or failure but do NOT revert on failure. If the return value is not checked, the contract continues execution as if the call succeeded, leading to inconsistent state and potential fund loss.",
    whyItMatters: "King of the Ether and numerous DeFi protocols lost funds because failed ETH transfers were silently ignored. The contract believed it sent ETH when it actually didn't, leading to accounting errors and stuck funds.",
    example: `// VULNERABLE: ignoring return value
function withdraw(uint amount) public {
    balances[msg.sender] -= amount;
    msg.sender.call{value: amount}(""); // return ignored!
    // If call fails, balance is already deducted but ETH not sent
}

// Also dangerous:
payable(addr).send(amount); // returns false on failure, doesn't revert`,
    howToFix: `Always check return values or use transfer() (which auto-reverts). Better yet, use OpenZeppelin's Address library.

// SAFE: check return value
(bool success, ) = msg.sender.call{value: amount}("");
require(success, "ETH transfer failed");

// SAFE: use Address library
import "@openzeppelin/contracts/utils/Address.sol";
Address.sendValue(payable(recipient), amount);`,
    relatedSlugs: ["reentrancy", "integer-overflow-underflow", "access-control"],
  },
  {
    slug: "tx-origin",
    category: "audit",
    title: "tx.origin Phishing Attack in Solidity",
    h1: "tx.origin Authentication Vulnerability",
    metaDescription: "Discover why using tx.origin for authentication is dangerous in Solidity. Learn how attackers exploit it through phishing contracts and how to use msg.sender instead.",
    keywords: ["tx.origin vulnerability", "phishing attack solidity", "msg.sender vs tx.origin", "smart contract authentication"],
    severity: "medium",
    whatIsIt: "tx.origin returns the address of the externally owned account (EOA) that initiated the entire transaction chain, while msg.sender returns the immediate caller. Using tx.origin for authorization allows phishing attacks where a malicious contract tricks the owner into calling it, inheriting their tx.origin.",
    whyItMatters: "If an owner interacts with ANY malicious contract while tx.origin is used for auth, the attacker can execute privileged functions. This is a social engineering vector that bypasses technical security measures.",
    example: `// VULNERABLE: using tx.origin for auth
contract Wallet {
    address public owner;
    function transfer(address to, uint amount) public {
        require(tx.origin == owner); // WRONG!
        payable(to).transfer(amount);
    }
}

// Attacker deploys phishing contract:
contract Attack {
    function attack(Wallet wallet) public {
        wallet.transfer(attacker, wallet.balance);
        // tx.origin is the VICTIM who called this contract
    }
}`,
    howToFix: `Always use msg.sender for authentication. tx.origin should only be used to check if the caller is an EOA (not a contract).

// SAFE: use msg.sender
function transfer(address to, uint amount) public {
    require(msg.sender == owner, "Not owner");
    payable(to).transfer(amount);
}`,
    relatedSlugs: ["access-control", "delegatecall-vulnerability", "signature-malleability"],
  },
  {
    slug: "oracle-manipulation",
    category: "audit",
    title: "Oracle Manipulation Attacks — DeFi Price Feed Security",
    h1: "Oracle Manipulation in DeFi Protocols",
    metaDescription: "How attackers manipulate on-chain price oracles to exploit lending, DEX, and yield protocols. Implement TWAP and Chainlink for robust price feeds.",
    keywords: ["oracle manipulation", "price oracle attack", "chainlink oracle", "twap oracle", "defi oracle security"],
    severity: "critical",
    whatIsIt: "Oracle manipulation occurs when an attacker influences the price data that a DeFi protocol relies on for critical operations like liquidations, collateral valuation, or token swaps. On-chain oracles using spot prices from AMMs are especially vulnerable.",
    whyItMatters: "Hundreds of millions have been lost to oracle manipulation. Mango Markets lost $114M, Cream Finance lost $130M, and countless smaller protocols have been drained — all through manipulated price feeds.",
    example: `// VULNERABLE: using spot price from single AMM
function getPrice() public view returns (uint) {
    (uint reserve0, uint reserve1) = pair.getReserves();
    return reserve1 * 1e18 / reserve0; // spot price, easily manipulated
}

function liquidate(address user) public {
    uint price = getPrice(); // attacker controls this price
    require(collateral[user] * price < debt[user], "safe");
    // liquidate at manipulated price
}`,
    howToFix: `- Use Chainlink decentralized oracles for price feeds
- Implement TWAP (Time-Weighted Average Price) for AMM data
- Use multiple oracle sources with median aggregation
- Add price deviation circuit breakers

// SAFE: Chainlink oracle
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

function getPrice() public view returns (uint) {
    (, int price,, uint updatedAt,) = priceFeed.latestRoundData();
    require(block.timestamp - updatedAt < 1 hours, "Stale price");
    return uint(price);
}`,
    relatedSlugs: ["flash-loan-attack", "frontrunning", "price-manipulation"],
  },
  {
    slug: "timestamp-dependence",
    category: "audit",
    title: "Block Timestamp Manipulation in Solidity",
    h1: "Timestamp Dependence Vulnerability",
    metaDescription: "Learn why relying on block.timestamp for critical logic is risky. Miners can manipulate timestamps within bounds, affecting lotteries and time-locks.",
    keywords: ["block timestamp manipulation", "solidity timestamp", "miner manipulation", "block.timestamp vulnerability"],
    severity: "medium",
    whatIsIt: "block.timestamp is set by the block's miner/validator and can be manipulated within a range of roughly 15 seconds. Contracts that depend on exact timestamps for critical logic like lotteries, auctions, or time-based access control can be exploited.",
    whyItMatters: "While post-Merge Ethereum has more predictable timestamps, L2s and other EVM chains still allow manipulation. Lotteries, vesting contracts, and auction systems that use block.timestamp for randomness or deadlines remain vulnerable.",
    example: `// VULNERABLE: timestamp used for randomness
function roll() public {
    uint random = uint(keccak256(abi.encode(block.timestamp))) % 6;
    if (random == 0) { winner = msg.sender; }
}

// VULNERABLE: exact timestamp check
function claim() public {
    require(block.timestamp == unlockTime, "Not time"); // may never match
}`,
    howToFix: `- Use Chainlink VRF for verifiable randomness
- Use block.number instead of block.timestamp for ordering
- Use >= instead of == for time comparisons
- Add tolerance windows for time-dependent logic

// SAFE: use Chainlink VRF for randomness
function requestRandom() external {
    requestId = COORDINATOR.requestRandomWords(...);
}

// SAFE: use >= for time checks
require(block.timestamp >= unlockTime, "Too early");`,
    relatedSlugs: ["frontrunning", "entropy-illusion", "access-control"],
  },
  {
    slug: "selfdestruct-vulnerability",
    category: "audit",
    title: "selfdestruct Force-Send ETH Attack in Solidity",
    h1: "selfdestruct and Forced Ether Vulnerabilities",
    metaDescription: "How selfdestruct can force ETH into contracts that don't expect it, breaking invariants. Learn defensive patterns against forced Ether injection.",
    keywords: ["selfdestruct attack", "force send ether", "unexpected ether", "solidity selfdestruct", "contract balance manipulation"],
    severity: "medium",
    whatIsIt: "The selfdestruct opcode destroys a contract and force-sends its remaining ETH balance to any address — even contracts without receive/fallback functions. This allows attackers to inject ETH into contracts that track balances internally, breaking their invariants.",
    whyItMatters: "Contracts that use address(this).balance for critical logic (e.g., 'game is over when balance equals X') can be manipulated. The attacker simply selfdestructs a contract pointing at the victim, injecting unexpected ETH.",
    example: `// VULNERABLE: relies on exact balance
contract Game {
    function isGameOver() public view returns (bool) {
        return address(this).balance == 10 ether;
        // attacker can force-send ETH, making balance > 10
    }
}

// Attacker
contract Attacker {
    function attack(address target) public payable {
        selfdestruct(payable(target)); // forces ETH into target
    }
}`,
    howToFix: `- Never rely on address(this).balance for logic — track deposits internally
- Use an internal accounting variable instead of contract balance
- Note: selfdestruct is deprecated in EIP-6780 (Dencun upgrade)

// SAFE: internal tracking
contract Game {
    uint public totalDeposited;
    function deposit() public payable {
        totalDeposited += msg.value;
    }
    function isGameOver() public view returns (bool) {
        return totalDeposited == 10 ether; // not manipulable
    }
}`,
    relatedSlugs: ["unchecked-call-return", "reentrancy", "delegatecall-vulnerability"],
  },
  {
    slug: "signature-malleability",
    category: "audit",
    title: "ECDSA Signature Malleability in Solidity",
    h1: "Signature Malleability Vulnerability",
    metaDescription: "Discover how ECDSA signature malleability enables replay attacks in smart contracts. Learn to use EIP-712 and OpenZeppelin's ECDSA library for safe verification.",
    keywords: ["signature malleability", "ecdsa vulnerability", "replay attack", "ecrecover solidity", "eip712"],
    severity: "high",
    whatIsIt: "ECDSA signatures have a mathematical property where for every valid signature (v, r, s), there exists another valid signature (v', r, s') for the same message. If a contract uses the raw signature as a unique identifier (e.g., to prevent replay), the attacker can submit the alternate valid signature.",
    whyItMatters: "Signature replay attacks have been used to double-claim airdrops, bypass nonce systems, and drain bridge contracts. Any contract that uses ecrecover without proper safeguards is vulnerable.",
    example: `// VULNERABLE: no malleability check
function claimAirdrop(bytes memory signature) public {
    require(!claimed[signature], "Already claimed");
    address signer = ecrecover(hash, v, r, s);
    require(signer == authority, "Invalid");
    claimed[signature] = true; // attacker uses alternate (v', r, s')
    _mint(msg.sender, amount);
}`,
    howToFix: `Use OpenZeppelin's ECDSA library which rejects malleable signatures. Track claims by address or use EIP-712 typed data.

// SAFE: use OZ ECDSA + track by address
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

function claimAirdrop(bytes memory signature) public {
    require(!claimedByAddress[msg.sender], "Already claimed");
    bytes32 hash = keccak256(abi.encode(msg.sender, amount));
    address signer = ECDSA.recover(hash, signature);
    require(signer == authority, "Invalid");
    claimedByAddress[msg.sender] = true;
    _mint(msg.sender, amount);
}`,
    relatedSlugs: ["access-control", "tx-origin", "reentrancy"],
  },
  {
    slug: "uninitialized-proxy",
    category: "audit",
    title: "Uninitialized Proxy Vulnerability — Upgrade Pattern Risks",
    h1: "Uninitialized Proxy Contracts",
    metaDescription: "How forgetting to call initializers on proxy contracts lets attackers take ownership. Protect upgradeable contracts with proper initialization guards.",
    keywords: ["uninitialized proxy", "proxy takeover", "initializer vulnerability", "upgradeable contract security", "openzeppelin initializable"],
    severity: "critical",
    whatIsIt: "Proxy contracts use initializer functions instead of constructors. If the implementation contract's initializer is not called (or can be called by anyone), an attacker can initialize it themselves, setting themselves as the owner and gaining full control.",
    whyItMatters: "The Wormhole bridge hack ($320M) and several NFT project exploits involved uninitialized implementations. When the implementation is deployed but never initialized, anyone can call initialize() and take ownership.",
    example: `// VULNERABLE: implementation not initialized
contract MyTokenV1 is Initializable, UUPSUpgradeable {
    address public owner;
    
    function initialize() public initializer {
        owner = msg.sender;
    }
    
    function _authorizeUpgrade(address) internal override {
        require(msg.sender == owner);
    }
}
// If deployed without calling initialize(), attacker calls it first`,
    howToFix: `- Always call initialize in the deployment script
- Disable initializers in the constructor of implementation contracts
- Use OpenZeppelin's _disableInitializers()

// SAFE: disable initializers in constructor
contract MyTokenV1 is Initializable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // prevents anyone from initializing
    }
    
    function initialize() public initializer {
        __UUPSUpgradeable_init();
        owner = msg.sender;
    }
}`,
    relatedSlugs: ["delegatecall-vulnerability", "access-control", "selfdestruct-vulnerability"],
  },
  {
    slug: "price-manipulation",
    category: "audit",
    title: "Price Manipulation in DeFi — AMM & Lending Exploits",
    h1: "Price Manipulation Attack Vectors",
    metaDescription: "How attackers manipulate token prices through AMM pool imbalance to exploit lending protocols, liquidation bots, and yield farms. Prevention strategies inside.",
    keywords: ["price manipulation defi", "amm exploit", "lending protocol attack", "token price manipulation", "liquidity pool attack"],
    severity: "critical",
    whatIsIt: "Price manipulation exploits occur when an attacker temporarily changes the perceived price of a token by imbalancing an AMM pool, then uses that manipulated price to exploit a dependent protocol. This differs from oracle manipulation in that the price change is real (temporary), not just the oracle's reading.",
    whyItMatters: "DeFi protocols that compose with other protocols inherit price manipulation risk. Lending protocols using AMM spot prices, yield optimizers calculating TVL from pool balances, and liquidation bots can all be exploited.",
    example: `// VULNERABLE: price from pool reserves
function getTokenPrice(IUniswapV2Pair pair) view returns (uint) {
    (uint r0, uint r1,) = pair.getReserves();
    return r0 * 1e18 / r1; // manipulable via large swap
}

// Attacker in one tx:
// 1. Swap huge amount → skew reserves
// 2. Call victim protocol using manipulated price
// 3. Swap back → restore price, keep profit`,
    howToFix: `- Use Chainlink price feeds instead of AMM spot prices
- Implement TWAP with sufficient window (30min+)
- Add price impact limits and circuit breakers
- Use multiple price sources with median

// SAFE: TWAP implementation
function getAveragePrice(uint32 period) view returns (uint) {
    (int24 arithmeticMeanTick,) = OracleLibrary.consult(pool, period);
    uint quote = OracleLibrary.getQuoteAtTick(arithmeticMeanTick, 1e18, token0, token1);
    return quote;
}`,
    relatedSlugs: ["oracle-manipulation", "flash-loan-attack", "frontrunning"],
  },
  {
    slug: "entropy-illusion",
    category: "audit",
    title: "Weak Randomness in Solidity — On-Chain Entropy Risks",
    h1: "Weak Randomness and Entropy Illusion",
    metaDescription: "On-chain randomness using blockhash and timestamp is predictable. Learn why and how to use Chainlink VRF for verifiable random numbers in smart contracts.",
    keywords: ["weak randomness solidity", "blockhash predictable", "on-chain randomness", "chainlink vrf", "smart contract lottery vulnerability"],
    severity: "high",
    whatIsIt: "There is no true randomness on-chain. Values like block.timestamp, blockhash, block.number, and msg.sender are all either predictable or manipulable. Contracts that use these for lotteries, gaming, or NFT minting are vulnerable to prediction attacks.",
    whyItMatters: "Numerous lottery contracts, NFT mints, and gaming platforms have been exploited by attackers who predicted 'random' outcomes. Miners can also influence block values to win favorable outcomes.",
    example: `// VULNERABLE: predictable randomness
function random() view returns (uint) {
    return uint(keccak256(abi.encodePacked(
        block.timestamp,   // predictable
        block.number,      // predictable
        msg.sender         // known
    )));
}

// Attacker contract can simulate the exact same calculation
function attack(address lottery) external {
    uint result = uint(keccak256(abi.encodePacked(...)));
    if (result % 10 == 0) {
        lottery.play(); // only plays when they know they'll win
    }
}`,
    howToFix: `Use Chainlink VRF (Verifiable Random Function) for provably fair randomness.

// SAFE: Chainlink VRF v2.5
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2Plus.sol";

contract Lottery is VRFConsumerBaseV2Plus {
    function requestRandom() external {
        s_requestId = s_vrfCoordinator.requestRandomWords(...);
    }
    
    function fulfillRandomWords(uint requestId, uint[] memory randomWords) internal override {
        winner = players[randomWords[0] % players.length];
    }
}`,
    relatedSlugs: ["timestamp-dependence", "frontrunning", "flash-loan-attack"],
  },
  {
    slug: "dos-gas-limit",
    category: "audit",
    title: "Denial of Service (DoS) via Gas Limit in Solidity",
    h1: "DoS Attacks Through Gas Limits",
    metaDescription: "How unbounded loops and external calls in Solidity can be exploited for denial of service attacks. Learn pull-payment and pagination patterns to stay safe.",
    keywords: ["dos attack solidity", "gas limit vulnerability", "unbounded loop", "block gas limit", "pull payment pattern"],
    severity: "high",
    whatIsIt: "Denial of Service through gas limits occurs when a contract function's gas cost grows unboundedly, eventually exceeding the block gas limit. This can happen with loops over growing arrays, batch transfers to many addresses, or when external calls in a loop allow one recipient to cause a revert.",
    whyItMatters: "GovernorAlpha contracts, airdrop distributors, and dividend-paying tokens have all been bricked by DoS attacks. Once the array grows large enough, nobody can call the function and funds become permanently stuck.",
    example: `// VULNERABLE: unbounded loop
address[] public recipients;
function distributeRewards() public {
    for (uint i = 0; i < recipients.length; i++) {
        // If recipients grows large, exceeds block gas limit
        // If one recipient reverts, entire distribution fails
        payable(recipients[i]).transfer(reward);
    }
}`,
    howToFix: `Use pull-payment pattern, pagination, or Merkle distributor.

// SAFE: pull payment pattern
mapping(address => uint) public pendingWithdrawals;

function allocateRewards() public onlyOwner {
    for (uint i = start; i < start + BATCH_SIZE; i++) {
        pendingWithdrawals[recipients[i]] += reward;
    }
}

function withdraw() public {
    uint amount = pendingWithdrawals[msg.sender];
    pendingWithdrawals[msg.sender] = 0;
    payable(msg.sender).transfer(amount);
}`,
    relatedSlugs: ["unchecked-call-return", "reentrancy", "access-control"],
  },
  {
    slug: "read-only-reentrancy",
    category: "audit",
    title: "Read-Only Reentrancy — The Hidden DeFi Vulnerability",
    h1: "Read-Only Reentrancy in DeFi",
    metaDescription: "Read-only reentrancy exploits view functions during callback execution. Learn how composable DeFi protocols are vulnerable and how to add reentrancy locks to view functions.",
    keywords: ["read-only reentrancy", "view function exploit", "composable defi vulnerability", "curve reentrancy", "balancer read-only"],
    severity: "critical",
    whatIsIt: "Read-only reentrancy occurs when a view function returns stale or inconsistent data during an external call's callback. Protocol B reads Protocol A's state mid-transaction, getting manipulated values. Unlike classic reentrancy, no state is modified — the exploit is in reading wrong data.",
    whyItMatters: "Curve Finance and multiple Balancer integrations were exploited via read-only reentrancy. The attacker manipulates the state that view functions report, causing dependent protocols to miscalculate prices, collateral values, or LP token prices.",
    example: `// Protocol A — has reentrancy in ETH callback
function withdraw() external {
    uint shares = balances[msg.sender];
    // State NOT yet updated
    msg.sender.call{value: amount}(""); // callback here
    // Protocol B calls getPrice() during callback
    // getPrice() returns STALE data
    balances[msg.sender] = 0; // updated AFTER
}

function getPrice() public view returns (uint) {
    return totalAssets / totalSupply; // stale during callback
}`,
    howToFix: `Apply nonReentrant to view functions that expose critical state. Use reentrancy guards on all state-reading functions that other protocols depend on.

// SAFE: guard view functions too
modifier nonReentrantView() {
    require(!_locked, "Reentrancy");
    _;
}
function getPrice() public view nonReentrantView returns (uint) {
    return totalAssets / totalSupply;
}`,
    relatedSlugs: ["reentrancy", "oracle-manipulation", "flash-loan-attack"],
  },
  {
    slug: "cross-chain-bridge-exploit",
    category: "audit",
    title: "Cross-Chain Bridge Exploits — Bridge Security Guide",
    h1: "Cross-Chain Bridge Vulnerabilities",
    metaDescription: "How bridge exploits like Ronin ($625M), Wormhole ($320M), and Nomad ($190M) happened. Learn the attack vectors and security patterns for cross-chain bridges.",
    keywords: ["bridge exploit", "cross chain vulnerability", "ronin hack", "wormhole exploit", "bridge security"],
    severity: "critical",
    whatIsIt: "Cross-chain bridge exploits target the trust assumptions in message passing between blockchains. Attackers forge deposit proofs, compromise validator sets, or exploit signature verification flaws to mint unbacked tokens on the destination chain.",
    whyItMatters: "Bridge hacks account for the largest losses in crypto history: Ronin ($625M), Wormhole ($320M), Nomad ($190M). Bridges hold massive TVL and their security model is fundamentally different from single-chain contracts.",
    example: `// VULNERABLE: insufficient signature validation
function processMessage(bytes calldata message, bytes[] calldata sigs) external {
    // Only checks 1 of 5 validators
    require(verify(sigs[0], message), "bad sig");
    // Should require threshold (e.g., 3 of 5)
    _executeMessage(message);
}`,
    howToFix: `- Require threshold signatures (e.g., 3-of-5 multisig)
- Use optimistic verification with challenge periods
- Implement rate limits on minting/withdrawals
- Add independent monitoring and circuit breakers

// SAFE: threshold signature verification
require(validSignatures >= threshold, "Insufficient sigs");
require(block.timestamp > message.timestamp + DELAY, "Challenge period");`,
    relatedSlugs: ["signature-malleability", "access-control", "uninitialized-proxy"],
  },
  {
    slug: "governance-attack",
    category: "audit",
    title: "Governance Attacks in DAOs — Voting Exploit Prevention",
    h1: "DAO Governance Attack Vectors",
    metaDescription: "How attackers use flash loans, vote buying, and proposal manipulation to exploit DAO governance. Implement time-locks, quorum thresholds, and vote escrow for safety.",
    keywords: ["governance attack dao", "flash loan governance", "vote manipulation", "dao exploit", "timelock vulnerability"],
    severity: "high",
    whatIsIt: "Governance attacks exploit the voting mechanisms of DAOs. Attackers can flash-borrow governance tokens to pass malicious proposals, manipulate quorum calculations, or exploit time-lock bypasses to drain treasury funds within a single transaction.",
    whyItMatters: "Beanstalk ($182M), Build Finance, and Tornado Cash governance were all exploited through governance manipulation. As DAOs manage billions in treasury funds, governance security is critical infrastructure.",
    example: `// VULNERABLE: no snapshot, allows flash loan voting
function propose(uint proposalId) external {
    require(token.balanceOf(msg.sender) >= proposalThreshold);
    // Attacker flash-borrows tokens, proposes, then returns
}

function vote(uint proposalId) external {
    uint votes = token.balanceOf(msg.sender); // current balance
    // Can be inflated with flash loan
    proposals[proposalId].votes += votes;
}`,
    howToFix: `- Use vote snapshots at proposal creation block
- Implement time-locks between proposal and execution
- Require vote escrow (lock tokens to vote)
- Set meaningful quorum thresholds

// SAFE: snapshot-based voting
function vote(uint proposalId) external {
    uint votes = token.getPastVotes(msg.sender, proposals[proposalId].snapshot);
    proposals[proposalId].votes += votes;
}`,
    relatedSlugs: ["flash-loan-attack", "access-control", "timestamp-dependence"],
  },
  {
    slug: "erc20-approval-exploit",
    category: "audit",
    title: "ERC-20 Approval Front-Running & Infinite Allowance Risks",
    h1: "ERC-20 Approval Vulnerabilities",
    metaDescription: "How the ERC-20 approve function enables front-running attacks and why infinite allowances are dangerous. Learn safe approval patterns with increaseAllowance.",
    keywords: ["erc20 approval attack", "infinite allowance risk", "approve front running", "token approval exploit", "increaseAllowance"],
    severity: "medium",
    whatIsIt: "The ERC-20 approve() function has a known race condition: when a user changes an allowance from N to M, a spender can front-run to use N tokens, then use M more tokens after the approval updates. Additionally, infinite approvals (type(uint256).max) give permanent spending rights.",
    whyItMatters: "Users routinely grant infinite approvals to DeFi protocols. If any approved contract is later compromised or has a vulnerability, all approved tokens can be drained. Millions have been lost through approval-based attacks on compromised protocols.",
    example: `// VULNERABLE: approval race condition
// User approves spender for 100 tokens
token.approve(spender, 100);
// User changes approval to 50
token.approve(spender, 50);
// Spender frontruns: spends 100, then spends 50 more = 150 total

// DANGEROUS: infinite approval
token.approve(defiProtocol, type(uint256).max);
// If defiProtocol is exploited, attacker drains ALL your tokens`,
    howToFix: `Use increaseAllowance/decreaseAllowance or set to 0 first. Avoid infinite approvals. Use permit() for gasless approvals.

// SAFE: reset to 0 first
token.approve(spender, 0);
token.approve(spender, newAmount);

// BETTER: use increaseAllowance
token.increaseAllowance(spender, additionalAmount);

// BEST: use EIP-2612 permit
token.permit(owner, spender, value, deadline, v, r, s);`,
    relatedSlugs: ["frontrunning", "access-control", "signature-malleability"],
  },
  {
    slug: "rug-pull-detection",
    category: "audit",
    title: "Rug Pull Detection — Identify Scam Tokens & Contracts",
    h1: "Rug Pull Detection and Prevention",
    metaDescription: "How to detect rug pull smart contracts before investing. Learn red flags: hidden mints, ownership renounce fakes, honeypot patterns, and liquidity withdrawal traps.",
    keywords: ["rug pull detection", "scam token detector", "honeypot contract", "hidden mint function", "liquidity rug pull"],
    severity: "critical",
    whatIsIt: "A rug pull occurs when a token creator deploys a contract with hidden malicious functions — such as unlimited minting, transfer restrictions (honeypot), or the ability to drain the liquidity pool — then exploits these functions after attracting investors.",
    whyItMatters: "Rug pulls account for over $7B in losses across DeFi and NFTs. Common tactics include hidden owner mint functions, fake renounceOwnership, transfer blacklists that prevent selling, and time-delayed liquidity withdrawal mechanisms.",
    example: `// RED FLAGS in contract code:

// 1. Hidden mint capability
function _transfer(address from, address to, uint amount) internal {
    if (from == owner) { balances[to] += amount * 2; } // hidden inflation
}

// 2. Honeypot — can buy but not sell
mapping(address => bool) public blacklist;
function transfer(address to, uint amount) public {
    require(!blacklist[msg.sender]); // owner can blacklist sellers
}

// 3. Fake renounce
function renounceOwnership() public override {
    // Does nothing — owner retains control
}`,
    howToFix: `Before investing, scan the contract with AetherGuard to detect:
- Hidden mint or inflation functions
- Transfer restrictions or blacklists
- Fake renounce ownership patterns
- Proxy contracts that can change logic
- Liquidity lock status and unlock times

// Use AetherGuard scanner to check for these patterns automatically`,
    relatedSlugs: ["access-control", "erc20-approval-exploit", "uninitialized-proxy"],
  },
  {
    slug: "nft-security",
    category: "audit",
    title: "NFT Smart Contract Security — Common ERC-721 Vulnerabilities",
    h1: "NFT Contract Security Vulnerabilities",
    metaDescription: "Security guide for ERC-721 and ERC-1155 NFT contracts. Learn about mint manipulation, metadata exploits, royalty bypass, and reveal randomness attacks.",
    keywords: ["nft security", "erc721 vulnerability", "nft mint exploit", "nft randomness attack", "erc1155 security"],
    severity: "high",
    whatIsIt: "NFT contracts face unique vulnerabilities: predictable mint randomness allowing sniping of rare traits, re-entrancy in mint functions, metadata manipulation before reveal, unlimited minting through batch function abuse, and royalty enforcement bypass in secondary markets.",
    whyItMatters: "NFT exploits have caused millions in losses. Predictable reveals let bots snipe rare NFTs, reentrancy in mint functions enables free minting, and flawed access control lets attackers mint beyond supply limits.",
    example: `// VULNERABLE: predictable randomness for rarity
function mint() public payable {
    uint tokenId = totalSupply + 1;
    // Rarity determined by predictable hash
    uint rarity = uint(keccak256(abi.encode(block.timestamp, tokenId))) % 100;
    _safeMint(msg.sender, tokenId);
    // Attacker can predict rarity and only mint rare ones
}

// VULNERABLE: no max mint check
function batchMint(uint quantity) public payable {
    require(msg.value >= price * quantity);
    for (uint i = 0; i < quantity; i++) {
        _mint(msg.sender, totalSupply++);
    }
    // No check against MAX_SUPPLY
}`,
    howToFix: `- Use Chainlink VRF for rarity assignment
- Enforce MAX_SUPPLY and per-wallet limits
- Use commit-reveal for fair minting
- Apply nonReentrant to mint functions

// SAFE: proper NFT mint
function mint(uint qty) external payable nonReentrant {
    require(totalSupply() + qty <= MAX_SUPPLY, "Sold out");
    require(minted[msg.sender] + qty <= MAX_PER_WALLET, "Limit");
    require(msg.value >= PRICE * qty, "Underpaid");
    for (uint i = 0; i < qty; i++) {
        _safeMint(msg.sender, _nextTokenId++);
    }
    minted[msg.sender] += qty;
}`,
    relatedSlugs: ["entropy-illusion", "reentrancy", "access-control"],
  },
  {
    slug: "storage-collision",
    category: "audit",
    title: "Storage Collision in Upgradeable Contracts",
    h1: "Storage Collision Vulnerabilities",
    metaDescription: "How storage layout mismatches between proxy and implementation contracts cause critical data corruption. Learn EIP-1967 and storage gap patterns.",
    keywords: ["storage collision", "proxy storage layout", "eip1967", "storage gap", "upgradeable contract storage"],
    severity: "critical",
    whatIsIt: "Storage collision occurs when a proxy contract and its implementation contract use the same storage slots for different variables. Since delegatecall executes implementation code in the proxy's storage context, overlapping slots cause data corruption — potentially overwriting the admin address or critical state.",
    whyItMatters: "Incorrect storage layouts in upgradeable contracts have led to complete takeovers. When you upgrade an implementation, adding or reordering variables can corrupt existing data, corrupting user balances or admin access.",
    example: `// COLLISION: both use slot 0
contract Proxy {
    address public admin;       // slot 0
    address public implementation; // slot 1
}

contract ImplementationV1 {
    uint256 public totalSupply; // slot 0 — overwrites admin!
    mapping(address => uint) balances; // slot 1 — overwrites implementation!
}`,
    howToFix: `Use EIP-1967 standard storage slots and storage gaps.

// SAFE: EIP-1967 random slots for proxy data
bytes32 constant ADMIN_SLOT = bytes32(uint(keccak256("eip1967.proxy.admin")) - 1);
bytes32 constant IMPL_SLOT = bytes32(uint(keccak256("eip1967.proxy.implementation")) - 1);

// SAFE: storage gaps for future variables
contract BaseV1 {
    uint256 public value;
    uint256[49] private __gap; // reserve 49 slots
}`,
    relatedSlugs: ["delegatecall-vulnerability", "uninitialized-proxy", "access-control"],
  },
  {
    slug: "erc4626-inflation-attack",
    category: "audit",
    title: "ERC-4626 Vault Inflation Attack — Token Vault Security",
    h1: "ERC-4626 Inflation Attack",
    metaDescription: "How the first depositor in an ERC-4626 vault can steal subsequent deposits through share price manipulation. Implement virtual shares or minimum deposits.",
    keywords: ["erc4626 inflation attack", "vault share manipulation", "first depositor attack", "token vault vulnerability", "share price exploit"],
    severity: "critical",
    whatIsIt: "In ERC-4626 vaults, the first depositor can manipulate the share price by depositing 1 wei, then donating a large amount directly to the vault. This inflates the share price so that subsequent depositors receive 0 shares due to rounding, effectively losing their entire deposit to the attacker.",
    whyItMatters: "ERC-4626 is the standard for tokenized vaults across DeFi (yield aggregators, lending pools, staking). Every vault using this standard without mitigation is vulnerable to this first-depositor attack.",
    example: `// ATTACK SCENARIO:
// 1. Attacker deposits 1 wei → gets 1 share
// 2. Attacker donates 1000 USDC to vault directly
// 3. Vault now has 1000.000001 USDC, 1 share
// 4. Victim deposits 999 USDC
//    shares = 999 * 1 / 1000.000001 = 0 shares (rounded down)
// 5. Attacker redeems 1 share → gets ~1999 USDC`,
    howToFix: `Use virtual shares and assets offset (OpenZeppelin's approach).

// SAFE: virtual shares offset
function _decimalsOffset() internal pure override returns (uint8) {
    return 3; // adds virtual 1000 shares
}

// Or enforce minimum initial deposit
function deposit(uint assets, address receiver) public override returns (uint) {
    if (totalSupply() == 0) {
        require(assets >= MIN_DEPOSIT, "Too small");
    }
    return super.deposit(assets, receiver);
}`,
    relatedSlugs: ["price-manipulation", "flash-loan-attack", "integer-overflow-underflow"],
  },
  {
    slug: "return-bomb",
    category: "audit",
    title: "Return Bomb Attack — Excessive Return Data DoS",
    h1: "Return Bomb Attack",
    metaDescription: "How malicious contracts return huge data payloads to consume gas and cause out-of-gas reverts. Learn to limit returndata copy size in low-level calls.",
    keywords: ["return bomb attack", "returndata dos", "excessive return data", "gas griefing", "low level call gas"],
    severity: "medium",
    whatIsIt: "A return bomb attack occurs when a malicious contract returns an extremely large bytes payload (e.g., megabytes) from a call. The calling contract automatically copies all return data into memory, consuming massive amounts of gas and causing an out-of-gas revert.",
    whyItMatters: "Any contract that makes low-level calls to untrusted addresses and doesn't limit return data is vulnerable. This can brick fund distribution systems, multisigs, and batch processors.",
    example: `// VULNERABLE: copies unlimited return data
function execute(address target, bytes calldata data) external {
    (bool success, bytes memory result) = target.call(data);
    // If target returns 10MB of data, this consumes all gas
    require(success, "Failed");
}

// Attacker contract:
fallback() external {
    assembly { return(0, 1000000) } // returns 1MB of zeros
}`,
    howToFix: `Use assembly to limit returndatacopy size.

// SAFE: limit return data
function execute(address target, bytes calldata data) external {
    bool success;
    assembly {
        success := call(gas(), target, 0, add(data, 0x20), mload(data), 0, 0)
        // Only copy up to 256 bytes of return data
        let size := returndatasize()
        if gt(size, 256) { size := 256 }
        returndatacopy(0, 0, size)
    }
    require(success, "Failed");
}`,
    relatedSlugs: ["dos-gas-limit", "unchecked-call-return", "reentrancy"],
  },
  {
    slug: "permit-dos",
    category: "audit",
    title: "ERC-2612 Permit DoS — Gasless Approval Griefing",
    h1: "Permit Function DoS Attack",
    metaDescription: "How attackers front-run permit transactions to cause DoS. Learn why permit signatures should be handled in try-catch blocks and validated carefully.",
    keywords: ["permit dos", "erc2612 vulnerability", "gasless approval attack", "permit front run", "permit griefing"],
    severity: "medium",
    whatIsIt: "ERC-2612 permit() allows gasless token approvals via signatures. An attacker can front-run a user's permit call by submitting the same signature first. When the user's transaction executes, the nonce has already been used, causing a revert. If permit is called inside a critical function, the entire operation fails.",
    whyItMatters: "Many DeFi protocols call permit() as part of a larger transaction (deposit + permit, swap + permit). If the permit step reverts due to front-running, the entire user transaction fails, causing frustration and loss of gas fees.",
    example: `// VULNERABLE: permit failure blocks entire deposit
function depositWithPermit(uint amount, uint deadline, uint8 v, bytes32 r, bytes32 s) external {
    token.permit(msg.sender, address(this), amount, deadline, v, r, s);
    // If permit is front-run, this entire tx reverts
    token.transferFrom(msg.sender, address(this), amount);
    _deposit(msg.sender, amount);
}`,
    howToFix: `Wrap permit in a try-catch. If permit fails but allowance is already sufficient, continue.

// SAFE: graceful permit handling
function depositWithPermit(uint amount, uint deadline, uint8 v, bytes32 r, bytes32 s) external {
    try token.permit(msg.sender, address(this), amount, deadline, v, r, s) {} catch {}
    // Continue regardless — if allowance exists, transferFrom works
    token.transferFrom(msg.sender, address(this), amount);
    _deposit(msg.sender, amount);
}`,
    relatedSlugs: ["frontrunning", "signature-malleability", "dos-gas-limit"],
  },
  {
    slug: "callback-reentrancy",
    category: "audit",
    title: "Callback Reentrancy in ERC-721 & ERC-777 Tokens",
    h1: "Token Callback Reentrancy",
    metaDescription: "How ERC-721 safeTransferFrom and ERC-777 token hooks enable reentrancy attacks through callback functions. Learn to identify and prevent callback-based exploits.",
    keywords: ["callback reentrancy", "erc721 safetransfer reentrancy", "erc777 hooks exploit", "onERC721Received", "token callback attack"],
    severity: "high",
    whatIsIt: "ERC-721's safeTransferFrom and safeMint call onERC721Received on the recipient. ERC-777 tokens have send/receive hooks. These callbacks give control flow to potentially malicious contracts during token transfers, enabling reentrancy even without explicit ETH calls.",
    whyItMatters: "Many developers don't realize that token transfers can trigger callbacks. NFT minting functions using _safeMint are especially vulnerable because the callback happens during the mint, before supply counters are updated.",
    example: `// VULNERABLE: _safeMint callback before state update
function mint() external payable {
    require(totalMinted < MAX_SUPPLY);
    _safeMint(msg.sender, tokenId); // triggers onERC721Received
    totalMinted++; // updated AFTER callback!
}

// Attacker contract:
function onERC721Received(...) external returns (bytes4) {
    if (nft.totalMinted() < MAX_SUPPLY) {
        nft.mint(); // re-enters, totalMinted not yet updated
    }
    return this.onERC721Received.selector;
}`,
    howToFix: `Update state before calling _safeMint, or use _mint instead of _safeMint when the recipient is known. Apply nonReentrant.

// SAFE: update state first
function mint() external payable nonReentrant {
    require(totalMinted < MAX_SUPPLY);
    totalMinted++; // update BEFORE callback
    _safeMint(msg.sender, tokenId);
}`,
    relatedSlugs: ["reentrancy", "nft-security", "read-only-reentrancy"],
  },
  {
    slug: "merkle-tree-exploit",
    category: "audit",
    title: "Merkle Tree Verification Exploits in Airdrops & Allowlists",
    h1: "Merkle Tree Verification Vulnerabilities",
    metaDescription: "How flawed Merkle proofs enable double-claiming airdrops and bypassing allowlists. Learn proper leaf encoding, claim tracking, and second preimage resistance.",
    keywords: ["merkle tree exploit", "airdrop vulnerability", "merkle proof bypass", "allowlist exploit", "double claim airdrop"],
    severity: "high",
    whatIsIt: "Merkle proofs are used for efficient allowlist verification in airdrops and whitelists. Vulnerabilities arise from improper leaf encoding (allowing second preimage attacks), missing claim tracking (double-claiming), or using msg.sender-independent proofs (transferable proofs).",
    whyItMatters: "Flawed Merkle implementations have led to millions in stolen airdrop tokens. If leaves aren't properly encoded or claims aren't tracked per-address, attackers can claim multiple times or forge valid proofs.",
    example: `// VULNERABLE: leaf doesn't include msg.sender
bytes32 leaf = keccak256(abi.encodePacked(amount));
// Anyone with a valid proof can claim

// VULNERABLE: no double-claim protection
function claim(bytes32[] calldata proof, uint amount) external {
    bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
    require(MerkleProof.verify(proof, root, leaf));
    token.transfer(msg.sender, amount);
    // Can claim again with same proof!
}`,
    howToFix: `Encode msg.sender in leaf. Track claims per address. Use abi.encode (not encodePacked) for multi-value leaves.

// SAFE: proper Merkle claim
mapping(address => bool) public claimed;

function claim(bytes32[] calldata proof, uint amount) external {
    require(!claimed[msg.sender], "Already claimed");
    bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
    require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");
    claimed[msg.sender] = true;
    token.transfer(msg.sender, amount);
}`,
    relatedSlugs: ["signature-malleability", "access-control", "erc20-approval-exploit"],
  },
  {
    slug: "denial-of-service-revert",
    category: "audit",
    title: "DoS via Unexpected Revert in Solidity",
    h1: "Denial of Service via Unexpected Revert",
    metaDescription: "How a single reverting recipient can block batch operations like auctions, distributions, and refunds. Learn the pull-over-push pattern to prevent DoS.",
    keywords: ["dos revert solidity", "unexpected revert", "auction dos", "refund blocking", "pull over push pattern"],
    severity: "high",
    whatIsIt: "When a contract iterates over addresses to send ETH or tokens, a single recipient that always reverts (e.g., a contract without a receive function or one that intentionally reverts) can block the entire batch operation, preventing all other recipients from receiving their funds.",
    whyItMatters: "Auction contracts, refund mechanisms, and reward distributors are commonly affected. If the highest bidder is a contract that reverts on receive, nobody can collect their refunds and the auction is permanently stuck.",
    example: `// VULNERABLE: one revert blocks all refunds
function refundAll() external {
    for (uint i = 0; i < bidders.length; i++) {
        // If bidders[2] is a contract that reverts, everyone is stuck
        payable(bidders[i]).transfer(bids[i]);
    }
}

// Attacker contract — always reverts
receive() external payable { revert("no"); }`,
    howToFix: `Use pull-over-push: let recipients withdraw individually.

// SAFE: pull payment pattern
mapping(address => uint) public pendingReturns;

function refund() external {
    uint amount = pendingReturns[msg.sender];
    require(amount > 0, "Nothing to refund");
    pendingReturns[msg.sender] = 0;
    (bool ok,) = payable(msg.sender).call{value: amount}("");
    require(ok, "Transfer failed");
}`,
    relatedSlugs: ["dos-gas-limit", "unchecked-call-return", "reentrancy"],
  },
  {
    slug: "create2-address-collision",
    category: "audit",
    title: "CREATE2 Address Collision & Contract Redeployment Attacks",
    h1: "CREATE2 Address Collision Attacks",
    metaDescription: "How CREATE2 enables contract redeployment at the same address with different bytecode. Learn risks of pre-computed addresses and metamorphic contracts.",
    keywords: ["create2 attack", "address collision", "metamorphic contract", "contract redeployment", "create2 vulnerability"],
    severity: "high",
    whatIsIt: "CREATE2 deploys contracts to deterministic addresses based on deployer, salt, and init code. An attacker can deploy a benign contract, get it approved/trusted, selfdestruct it, then redeploy malicious code at the same address. Contracts trusting that address based on past behavior are now vulnerable.",
    whyItMatters: "Metamorphic contracts exploit the assumption that contract code at a given address is immutable. Approval systems, allowlists, and trust relationships based on address can be exploited when the code changes.",
    example: `// Attack flow:
// 1. Deploy benign contract via CREATE2 at address X
// 2. Get address X approved/whitelisted/trusted
// 3. selfdestruct the contract at X
// 4. Redeploy MALICIOUS contract at same address X via CREATE2
// 5. Execute exploit using the trusted address

// Deployer
function deploy(bytes32 salt, bytes memory code) external {
    address addr;
    assembly { addr := create2(0, add(code, 0x20), mload(code), salt) }
}`,
    howToFix: `- Check EXTCODESIZE and EXTCODEHASH before trusting addresses
- Don't trust contracts that can selfdestruct
- Use code hash verification, not just address checks
- Be wary of contracts deployed via CREATE2

// SAFE: verify code hash
bytes32 expectedHash = keccak256(type(TrustedContract).runtimeCode);
bytes32 actualHash;
assembly { actualHash := extcodehash(target) }
require(actualHash == expectedHash, "Code mismatch");`,
    relatedSlugs: ["selfdestruct-vulnerability", "delegatecall-vulnerability", "access-control"],
  },
  {
    slug: "msg-value-multicall",
    category: "audit",
    title: "msg.value Reuse in Multicall — Double-Spend Exploit",
    h1: "msg.value Reuse in Multicall Patterns",
    metaDescription: "How msg.value persists across delegatecall iterations in multicall, enabling double-spending of ETH. Learn why payable multicall is dangerous.",
    keywords: ["msg.value multicall", "msg.value reuse", "multicall exploit", "double spend eth", "payable multicall vulnerability"],
    severity: "critical",
    whatIsIt: "In a multicall pattern using delegatecall, msg.value is preserved across all sub-calls. If a user sends 1 ETH with a multicall containing 3 deposit calls, each sub-call sees msg.value as 1 ETH, allowing the user to deposit 3 ETH while only paying 1 ETH.",
    whyItMatters: "SushiSwap's RouteProcessor2 lost $3.3M to this exact vulnerability. Any contract with a payable multicall using delegatecall is vulnerable to msg.value being counted multiple times.",
    example: `// VULNERABLE: msg.value reused in each delegatecall
function multicall(bytes[] calldata data) external payable {
    for (uint i = 0; i < data.length; i++) {
        (bool ok,) = address(this).delegatecall(data[i]);
        require(ok);
    }
    // Each delegatecall sees the SAME msg.value!
}

function deposit() external payable {
    balances[msg.sender] += msg.value; // counted multiple times
}`,
    howToFix: `Track msg.value consumption or prevent payable multicall.

// SAFE: track consumed value
function multicall(bytes[] calldata data) external payable {
    uint remaining = msg.value;
    for (uint i = 0; i < data.length; i++) {
        // Use call instead of delegatecall for value-bearing ops
        // Or track remaining value explicitly
    }
    require(remaining == 0, "Unspent value");
}

// SAFEST: disallow payable multicall
function multicall(bytes[] calldata data) external { // NOT payable
    for (uint i = 0; i < data.length; i++) {
        (bool ok,) = address(this).delegatecall(data[i]);
        require(ok);
    }
}`,
    relatedSlugs: ["reentrancy", "delegatecall-vulnerability", "unchecked-call-return"],
  },
  {
    slug: "typehash-collision",
    category: "audit",
    title: "EIP-712 TypeHash Collision — Signature Forgery Risks",
    h1: "EIP-712 TypeHash Collision",
    metaDescription: "How incorrect EIP-712 domain separators and type hashes enable cross-contract signature replay. Implement proper domain separation and chain ID binding.",
    keywords: ["eip712 vulnerability", "typehash collision", "domain separator", "signature replay cross-chain", "structured data signing"],
    severity: "medium",
    whatIsIt: "EIP-712 provides structured data signing for Ethereum. Vulnerabilities arise when domain separators are missing chain ID (enabling cross-chain replay), when type hashes collide between contracts (enabling cross-contract replay), or when domain separators are cached and not updated after chain forks.",
    whyItMatters: "Signatures valid on Ethereum mainnet should not be valid on Polygon or Arbitrum. Without proper domain separation, a signature intended for one contract can be replayed on another, potentially on a different chain.",
    example: `// VULNERABLE: missing chain ID in domain separator
bytes32 DOMAIN_SEPARATOR = keccak256(abi.encode(
    keccak256("EIP712Domain(string name,string version)"),
    keccak256("MyProtocol"),
    keccak256("1")
    // Missing chainId! Replayable across chains
));

// VULNERABLE: cached domain separator
bytes32 immutable DOMAIN_SEPARATOR; // doesn't update on chain fork`,
    howToFix: `Include chainId in domain separator and recompute on each call.

// SAFE: include chainId, recompute dynamically
function DOMAIN_SEPARATOR() public view returns (bytes32) {
    return keccak256(abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256("MyProtocol"),
        keccak256("1"),
        block.chainid,
        address(this)
    ));
}`,
    relatedSlugs: ["signature-malleability", "cross-chain-bridge-exploit", "access-control"],
  },
  {
    slug: "griefing-attack",
    category: "audit",
    title: "Griefing Attacks in Smart Contracts",
    h1: "Griefing Attack Vectors",
    metaDescription: "How attackers can harm other users without direct profit through block stuffing, dust attacks, and state pollution. Minimize griefing surfaces in your contracts.",
    keywords: ["griefing attack", "block stuffing", "dust attack", "state pollution", "smart contract abuse"],
    severity: "medium",
    whatIsIt: "Griefing attacks harm other users without necessarily profiting the attacker. Examples include block stuffing (filling blocks to prevent others' transactions), dust attacks (sending tiny amounts to pollute accounting), and state manipulation that increases gas costs for other users.",
    whyItMatters: "Even without direct financial gain, griefing can disrupt protocol operations, increase costs for legitimate users, and damage protocol reputation. Auction sniping, last-minute bid blocking, and selective DoS all fall into this category.",
    example: `// GRIEFING: dust deposits to inflate array
function deposit() external payable {
    depositors.push(msg.sender); // attacker calls 10000 times with 1 wei
    // Now iterating depositors costs 10000x more gas
}

// GRIEFING: block stuffing to prevent auction close
// Attacker fills blocks with txs during auction close window
// Preventing legitimate bids from being included`,
    howToFix: `- Set minimum deposit/transaction amounts
- Use mappings instead of arrays for user tracking
- Implement time-weighted mechanisms resistant to last-block manipulation
- Design for adversarial environments

// SAFE: minimum deposit + mapping
uint constant MIN_DEPOSIT = 0.01 ether;
mapping(address => uint) public deposits;

function deposit() external payable {
    require(msg.value >= MIN_DEPOSIT, "Too small");
    deposits[msg.sender] += msg.value;
}`,
    relatedSlugs: ["dos-gas-limit", "denial-of-service-revert", "frontrunning"],
  },
  {
    slug: "immutable-bug",
    category: "audit",
    title: "Immutable Variable Bugs in Proxy Contracts",
    h1: "Immutable Variables in Upgradeable Contracts",
    metaDescription: "Why immutable variables break proxy/upgradeable contract patterns. Learn the difference between storage and bytecode variables and when to use constants vs immutables.",
    keywords: ["immutable proxy bug", "immutable upgradeable", "bytecode variable", "constant vs immutable", "proxy immutable issue"],
    severity: "medium",
    whatIsIt: "Immutable variables are embedded in contract bytecode, not stored in storage. In proxy patterns, the proxy delegates to the implementation's code but uses its own storage. Since immutables live in bytecode, they read from the implementation's values, not the proxy's intended values.",
    whyItMatters: "Using immutable in upgradeable contracts causes the proxy to read hardcoded values from the implementation, ignoring any proxy-specific configuration. This can lead to wrong addresses, incorrect parameters, and security bypasses.",
    example: `// BROKEN: immutable in upgradeable contract
contract ImplementationV1 is UUPSUpgradeable {
    address immutable TREASURY = 0x1234...; // baked into impl bytecode
    // Proxy reads 0x1234 even if proxy wants different treasury
    
    function withdraw() external {
        payable(TREASURY).transfer(balance); // always goes to impl's value
    }
}`,
    howToFix: `Use storage variables initialized in the initializer, or constants for truly universal values.

// SAFE: use storage variables for proxy-configurable values
contract ImplementationV1 is UUPSUpgradeable {
    address public treasury; // stored in proxy's storage
    
    function initialize(address _treasury) public initializer {
        treasury = _treasury;
    }
}

// SAFE: constants are fine (compile-time, same across all contexts)
uint256 constant MAX_SUPPLY = 10000;`,
    relatedSlugs: ["storage-collision", "uninitialized-proxy", "delegatecall-vulnerability"],
  },
  {
    slug: "solidity-compiler-bugs",
    category: "audit",
    title: "Known Solidity Compiler Bugs — Version-Specific Risks",
    h1: "Solidity Compiler Bug Exploits",
    metaDescription: "Critical Solidity compiler bugs by version: ABI encoding issues, optimizer bugs, and storage corruption. Check if your compiler version is affected.",
    keywords: ["solidity compiler bug", "solc vulnerability", "abi encoding bug", "optimizer bug solidity", "solidity version vulnerability"],
    severity: "high",
    whatIsIt: "The Solidity compiler itself has had critical bugs that generate incorrect bytecode. These include ABI encoder v2 bugs causing data corruption, optimizer bugs that remove necessary checks, and memory corruption in certain edge cases. Contracts compiled with affected versions may be silently vulnerable.",
    whyItMatters: "Even perfectly written Solidity code can be vulnerable if compiled with a buggy compiler version. Historical bugs include incorrect cleanup of storage bytes arrays (< 0.7.4), ABI encoder v2 data corruption (< 0.8.14), and optimizer issues removing safety checks.",
    example: `// Affected by solc < 0.8.14 ABI encoder v2 bug
// Nested dynamic types could be incorrectly encoded
function decode(bytes calldata data) external {
    (uint[][] memory arr) = abi.decode(data, (uint[][]));
    // May decode incorrectly with buggy compiler
}

// Affected by solc < 0.8.17 optimizer bug  
// Optimizer could remove necessary overflow checks in certain conditions`,
    howToFix: `- Always use the latest stable Solidity compiler
- Check known bugs list: https://soliditylang.org/bugs
- Run tests with different compiler versions
- Consider using compiler version >= 0.8.20 for production

// Specify exact compiler version
pragma solidity 0.8.24; // use latest stable`,
    relatedSlugs: ["integer-overflow-underflow", "storage-collision", "access-control"],
  },
  {
    slug: "low-level-staticcall",
    category: "audit",
    title: "Staticcall Safety — When View Functions Lie",
    h1: "Staticcall and View Function Safety",
    metaDescription: "Why staticcall doesn't guarantee safety. View functions can still consume unlimited gas, return misleading data, and be exploited by reentrancy-adjacent patterns.",
    keywords: ["staticcall solidity", "view function safety", "staticcall vulnerability", "read-only attack", "view function exploit"],
    severity: "low",
    whatIsIt: "staticcall prevents state modification but doesn't guarantee the returned data is trustworthy. A malicious contract's view function can consume excessive gas, return manipulated data based on transient state, or be used in read-only reentrancy patterns to exploit calling contracts.",
    whyItMatters: "Developers often assume view functions are 'safe' because they can't modify state. However, the data they return during reentrancy callbacks can be stale or manipulated, leading to incorrect calculations in the calling contract.",
    example: `// View function returns manipulated data during reentrancy
contract VulnerableVault {
    function totalAssets() public view returns (uint) {
        return address(this).balance; // changes during ETH transfers
    }
    
    function withdraw(uint shares) external {
        uint assets = shares * totalAssets() / totalSupply;
        // During reentrancy callback, totalAssets() returns wrong value
        (bool ok,) = msg.sender.call{value: assets}("");
        totalSupply -= shares;
    }
}`,
    howToFix: `- Don't trust view function outputs during callbacks
- Use reentrancy guards on view functions that report critical state
- Cache values before external calls

// SAFE: cache before external call
function withdraw(uint shares) external nonReentrant {
    uint cachedTotal = totalAssets(); // cache before any external calls
    uint assets = shares * cachedTotal / totalSupply;
    totalSupply -= shares;
    (bool ok,) = msg.sender.call{value: assets}("");
    require(ok);
}`,
    relatedSlugs: ["read-only-reentrancy", "return-bomb", "reentrancy"],
  },
  {
    slug: "cross-function-reentrancy",
    category: "audit",
    title: "Cross-Function Reentrancy in Solidity",
    h1: "Cross-Function Reentrancy Attacks",
    metaDescription: "How reentrancy can span multiple functions sharing state. Unlike classic reentrancy, cross-function attacks exploit shared storage across different entry points.",
    keywords: ["cross function reentrancy", "multi function reentrancy", "shared state exploit", "cross function attack solidity"],
    severity: "critical",
    whatIsIt: "Cross-function reentrancy occurs when two or more functions share state variables and one function can be called during the execution of another. The attacker re-enters through a different function than the one currently executing, bypassing single-function reentrancy guards.",
    whyItMatters: "Standard nonReentrant on individual functions may not protect against cross-function attacks. If withdraw() and transfer() share the same balance mapping, re-entering through transfer() during withdraw()'s callback can drain funds.",
    example: `// VULNERABLE: two functions share balances mapping
function withdraw() public {
    uint bal = balances[msg.sender];
    msg.sender.call{value: bal}(""); // callback here
    balances[msg.sender] = 0;
}

function transfer(address to, uint amount) public {
    // Attacker re-enters HERE during withdraw callback
    require(balances[msg.sender] >= amount); // still has old balance!
    balances[msg.sender] -= amount;
    balances[to] += amount;
}`,
    howToFix: `Apply the same reentrancy guard across ALL functions that share state. Use a contract-wide nonReentrant modifier.

// SAFE: contract-wide reentrancy guard
modifier nonReentrant() {
    require(!locked, "Reentrancy");
    locked = true;
    _;
    locked = false;
}

function withdraw() public nonReentrant { ... }
function transfer(address to, uint amount) public nonReentrant { ... }`,
    relatedSlugs: ["reentrancy", "read-only-reentrancy", "callback-reentrancy"],
  },
  {
    slug: "erc1155-reentrancy",
    category: "audit",
    title: "ERC-1155 Reentrancy via Batch Transfers",
    h1: "ERC-1155 Batch Transfer Reentrancy",
    metaDescription: "How ERC-1155 safeBatchTransferFrom and safeTransferFrom enable reentrancy through onERC1155Received callbacks. Protect multi-token contracts from callback attacks.",
    keywords: ["erc1155 reentrancy", "batch transfer attack", "onERC1155Received exploit", "multi token reentrancy", "erc1155 security"],
    severity: "high",
    whatIsIt: "ERC-1155's safeTransferFrom and safeBatchTransferFrom call onERC1155Received/onERC1155BatchReceived on recipients. These callbacks can re-enter the contract during transfers, enabling similar exploits to ERC-721 callback reentrancy but with batch amplification potential.",
    whyItMatters: "ERC-1155 powers gaming items, multi-token DeFi positions, and NFT collections. The batch transfer functionality adds complexity that makes reentrancy harder to spot and potentially more damaging per transaction.",
    example: `// VULNERABLE: state updated after batch callback
function craftItem(uint[] memory ids, uint[] memory amounts) external {
    // Burns ingredients (triggers callback on receiver)
    _safeBatchTransferFrom(msg.sender, BURN_ADDRESS, ids, amounts, "");
    // Mints result AFTER callback
    _mint(msg.sender, RESULT_ID, 1, "");
}`,
    howToFix: `Update state before transfers. Use nonReentrant on all ERC-1155 interaction functions.

// SAFE: mint before burn, use nonReentrant
function craftItem(uint[] memory ids, uint[] memory amounts) external nonReentrant {
    _mint(msg.sender, RESULT_ID, 1, "");
    _safeBatchTransferFrom(msg.sender, BURN_ADDRESS, ids, amounts, "");
}`,
    relatedSlugs: ["callback-reentrancy", "nft-security", "reentrancy"],
  },
  {
    slug: "sandwich-attack",
    category: "audit",
    title: "Sandwich Attack Prevention — DEX Trading Security",
    h1: "Sandwich Attacks on DEX Trades",
    metaDescription: "How MEV bots sandwich your DEX trades to extract value. Learn slippage protection, private mempools, and DEX aggregator defenses against sandwich attacks.",
    keywords: ["sandwich attack", "mev sandwich", "dex front running", "slippage exploit", "uniswap sandwich"],
    severity: "high",
    whatIsIt: "A sandwich attack is a specific form of MEV where a bot detects a pending swap in the mempool, places a buy order before it (front-run) and a sell order after it (back-run). This manipulates the price, causing the victim to receive fewer tokens while the bot profits from the price difference.",
    whyItMatters: "Sandwich attacks cost DEX users hundreds of millions annually. Any large swap on Uniswap, SushiSwap, or other AMMs without proper slippage protection is a target. Bots compete to sandwich every profitable swap.",
    example: `// Attack flow on Uniswap:
// 1. Victim submits: swap 10 ETH → USDC (slippage: 5%)
// 2. Bot frontruns: buy USDC with 50 ETH (price goes up)
// 3. Victim's swap executes at worse price
// 4. Bot backruns: sell USDC for ETH (profit = victim's slippage)

// VULNERABLE: high slippage tolerance
router.swapExactTokensForTokens(
    amountIn,
    0, // amountOutMin = 0 means accept ANY price!
    path, to, deadline
);`,
    howToFix: `- Set tight slippage tolerance (0.5-1%)
- Use Flashbots Protect or private transaction pools
- Use limit orders instead of market swaps
- Consider DEX aggregators with MEV protection

// SAFE: tight slippage
uint amountOutMin = getExpectedOutput(amountIn) * 995 / 1000; // 0.5% slippage max
router.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);`,
    relatedSlugs: ["frontrunning", "oracle-manipulation", "flash-loan-attack"],
  },
  {
    slug: "abi-encoding-vulnerability",
    category: "audit",
    title: "ABI Encoding Vulnerabilities — encodePacked Collision Risks",
    h1: "ABI Encoding Collision Vulnerabilities",
    metaDescription: "How abi.encodePacked creates hash collisions with dynamic types. Learn when to use abi.encode vs abi.encodePacked and how to prevent collision attacks.",
    keywords: ["abi encodePacked collision", "abi encoding vulnerability", "hash collision solidity", "encodePacked vs encode", "solidity encoding bug"],
    severity: "medium",
    whatIsIt: "abi.encodePacked concatenates arguments without length prefixes or padding. With dynamic types (string, bytes), different inputs can produce identical outputs: encodePacked('ab', 'c') == encodePacked('a', 'bc'). This enables hash collisions in signature verification and Merkle trees.",
    whyItMatters: "Hash collisions allow attackers to forge valid signatures, claim others' airdrops, or bypass access control that relies on encoded parameter hashing. Any signature or proof system using encodePacked with multiple dynamic types is vulnerable.",
    example: `// VULNERABLE: abi.encodePacked with dynamic types
bytes32 hash1 = keccak256(abi.encodePacked("ab", "cd"));
bytes32 hash2 = keccak256(abi.encodePacked("abc", "d"));
// hash1 == hash2! Both encode to "abcd"

// Attack on signature verification:
bytes32 msgHash = keccak256(abi.encodePacked(user, action));
// ("alice", "transfer") == ("alic", "etransfer")`,
    howToFix: `Use abi.encode for hashing with multiple dynamic types. It adds length prefixes preventing collisions.

// SAFE: abi.encode adds padding and length info
bytes32 hash = keccak256(abi.encode(user, action));
// abi.encode("ab", "cd") != abi.encode("abc", "d")

// Also safe: fixed-length types with encodePacked
bytes32 hash = keccak256(abi.encodePacked(address, uint256)); // OK: fixed types`,
    relatedSlugs: ["signature-malleability", "merkle-tree-exploit", "typehash-collision"],
  },
  {
    slug: "gas-griefing",
    category: "audit",
    title: "Gas Griefing Attacks — Insufficient Gas Forwarding",
    h1: "Gas Griefing Attacks",
    metaDescription: "How relayers and callers can grief contracts by forwarding insufficient gas for sub-calls to succeed. Learn 63/64 gas rule and proper gas stipend patterns.",
    keywords: ["gas griefing", "insufficient gas forwarding", "63/64 gas rule", "relay gas attack", "gas stipend solidity"],
    severity: "medium",
    whatIsIt: "Gas griefing occurs when an intermediary (relayer, multisig, or proxy) forwards a call with just enough gas for the outer call to succeed but not enough for inner sub-calls. The sub-call fails silently while the outer transaction appears successful, leading to inconsistent state.",
    whyItMatters: "Meta-transaction relayers and multisig wallets that forward calls are particularly vulnerable. An attacker controlling the gas parameter can make internal calls fail predictably, potentially skipping state updates while the outer call completes.",
    example: `// VULNERABLE: relayer controls gas
function relay(address target, bytes calldata data, uint gasLimit) external {
    (bool success,) = target.call{gas: gasLimit}(data);
    // Relayer sets gasLimit too low → inner call fails
    // But this function succeeds
    require(success); // might be false but relayer can DOS
}

// EIP-150: only 63/64 of remaining gas forwarded to sub-calls
// With 64000 gas: sub-call gets ~63000
// With 640 gas: sub-call gets ~630 (likely fails)`,
    howToFix: `Verify sufficient gas before sub-calls. Use OpenZeppelin's MinimalForwarder for meta-transactions.

// SAFE: check gas before forwarding
function relay(address target, bytes calldata data, uint gasLimit) external {
    require(gasleft() >= gasLimit + 5000, "Insufficient gas");
    (bool success, bytes memory result) = target.call{gas: gasLimit}(data);
    require(success, string(result));
}`,
    relatedSlugs: ["dos-gas-limit", "return-bomb", "griefing-attack"],
  },
  {
    slug: "hidden-backdoor",
    category: "audit",
    title: "Hidden Backdoors in Smart Contracts — Detection Guide",
    h1: "Hidden Backdoor Detection",
    metaDescription: "How malicious developers hide backdoors in smart contracts using obfuscated code, hidden functions, and deceptive naming. Learn detection patterns for due diligence.",
    keywords: ["hidden backdoor smart contract", "obfuscated solidity", "backdoor detection", "contract security review", "hidden function"],
    severity: "critical",
    whatIsIt: "Hidden backdoors are deliberately concealed malicious functions in smart contracts. They include: obfuscated function names (using bytes4 selectors directly), hidden state changes in seemingly innocent functions, assembly blocks that bypass Solidity safety checks, and external calls to attacker-controlled contracts.",
    whyItMatters: "Sophisticated rug pulls use non-obvious backdoors. The contract may look clean at first glance but contain obfuscated logic in inline assembly, misleading function names, or external dependencies that can be weaponized later.",
    example: `// HIDDEN BACKDOORS:

// 1. Obfuscated function selector
function 0x1234abcd(address to) external {
    _mint(to, 1000000); // hidden in bytecode
}

// 2. Assembly bypass
function safeTransfer(address to, uint amt) external {
    assembly {
        sstore(0x0, caller()) // secretly sets owner to caller
    }
    _transfer(msg.sender, to, amt);
}

// 3. External dependency backdoor
function _beforeTokenTransfer(...) internal {
    IValidator(externalContract).check(from, to); // can block transfers
}`,
    howToFix: `Use AetherGuard to scan for:
- Functions with obfuscated or non-standard selectors
- Inline assembly that modifies storage or makes external calls
- External contract dependencies with excessive control
- State changes in view/pure functions (through assembly)
- Misleading function names that don't match their behavior`,
    relatedSlugs: ["rug-pull-detection", "access-control", "delegatecall-vulnerability"],
  },
  {
    slug: "unchecked-erc20-transfer",
    category: "audit",
    title: "Unchecked ERC-20 Transfer Return Values",
    h1: "Unsafe ERC-20 Transfer Handling",
    metaDescription: "Why not all ERC-20 tokens return true on transfer. How USDT and non-standard tokens break contracts that assume transfer always returns a bool.",
    keywords: ["unsafe erc20 transfer", "usdt transfer bug", "safeTransfer", "non-standard erc20", "transfer return value"],
    severity: "high",
    whatIsIt: "The ERC-20 standard says transfer() should return bool, but many deployed tokens don't follow this. USDT returns nothing. BNB reverts instead. Some tokens return false instead of reverting. Contracts that assume standard behavior will break with these tokens.",
    whyItMatters: "USDT is the largest stablecoin by market cap. If your contract calls USDT.transfer() and tries to decode a bool return value, the transaction will revert because USDT returns nothing. This silently breaks compatibility with billions of dollars in tokens.",
    example: `// VULNERABLE: assumes transfer returns bool
function withdraw(IERC20 token, uint amount) external {
    bool success = token.transfer(msg.sender, amount);
    require(success, "Transfer failed");
    // REVERTS with USDT because USDT doesn't return bool!
}

// ALSO VULNERABLE: doesn't check return value at all
function pay(IERC20 token, address to, uint amount) external {
    token.transfer(to, amount); // ignores return value
    // Silently fails with tokens that return false
}`,
    howToFix: `Use OpenZeppelin's SafeERC20 library which handles all non-standard tokens.

// SAFE: use SafeERC20
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
using SafeERC20 for IERC20;

function withdraw(IERC20 token, uint amount) external {
    token.safeTransfer(msg.sender, amount); // handles all tokens correctly
}`,
    relatedSlugs: ["unchecked-call-return", "erc20-approval-exploit", "dos-gas-limit"],
  },
  {
    slug: "fee-on-transfer-token",
    category: "audit",
    title: "Fee-on-Transfer Token Compatibility Issues",
    h1: "Fee-on-Transfer Token Vulnerabilities",
    metaDescription: "How deflationary and fee-on-transfer tokens break DeFi integrations. Learn to handle tokens that take fees during transfer and why balance checks are critical.",
    keywords: ["fee on transfer token", "deflationary token bug", "rebasing token", "transfer fee erc20", "tax token vulnerability"],
    severity: "medium",
    whatIsIt: "Fee-on-transfer tokens deduct a percentage during every transfer. If a contract expects to receive exactly the amount it requested via transferFrom, the actual received amount will be less. This breaks accounting, prevents withdrawals, and can be exploited for profit.",
    whyItMatters: "Many popular tokens charge fees: SafeMoon, USDT (has fee toggle), and hundreds of 'reflection' tokens. DeFi protocols that don't account for transfer fees will have permanently locked funds or exploitable accounting mismatches.",
    example: `// VULNERABLE: assumes received == amount
function deposit(uint amount) external {
    token.transferFrom(msg.sender, address(this), amount);
    balances[msg.sender] += amount; // actual received is less!
    // Deposits 100, receives 95, records 100
    // Accounting mismatch grows with each deposit
}`,
    howToFix: `Check actual balance change instead of trusting the amount parameter.

// SAFE: measure actual received amount
function deposit(uint amount) external {
    uint balBefore = token.balanceOf(address(this));
    token.transferFrom(msg.sender, address(this), amount);
    uint received = token.balanceOf(address(this)) - balBefore;
    balances[msg.sender] += received; // use actual received amount
}`,
    relatedSlugs: ["unchecked-erc20-transfer", "erc20-approval-exploit", "integer-overflow-underflow"],
  },
  {
    slug: "rebasing-token-bug",
    category: "audit",
    title: "Rebasing Token Integration Risks — Elastic Supply Bugs",
    h1: "Rebasing Token Vulnerabilities",
    metaDescription: "How rebasing tokens like stETH, AMPL, and OHM break smart contract accounting. Learn wrapper patterns and share-based approaches for safe integration.",
    keywords: ["rebasing token", "elastic supply", "steth integration", "ampl vulnerability", "rebasing defi bug"],
    severity: "medium",
    whatIsIt: "Rebasing tokens automatically adjust all holder balances to maintain a target price or yield. This means token.balanceOf(contract) changes between transactions without any transfers occurring. Contracts that cache balances or use raw amounts will have accounting mismatches.",
    whyItMatters: "stETH (Lido), AMPL (Ampleforth), and OHM (Olympus) are major rebasing tokens. DeFi protocols that hold these tokens must account for balance changes between blocks, or user funds may become locked or exploitable.",
    example: `// VULNERABLE: caches rebasing token balance
function deposit() external payable {
    uint shares = stETH.submit{value: msg.value}(address(0));
    deposits[msg.sender] = stETH.balanceOf(address(this)); // wrong!
    // Balance changes on next rebase without any action
}

function withdraw() external {
    uint stored = deposits[msg.sender];
    stETH.transfer(msg.sender, stored); // may be more or less than stored
}`,
    howToFix: `Use share-based accounting or wrapped versions (wstETH instead of stETH).

// SAFE: use wrapped non-rebasing version
import {IWstETH} from "./interfaces/IWstETH.sol";

function deposit(uint stethAmount) external {
    stETH.transferFrom(msg.sender, address(this), stethAmount);
    uint wstethAmount = wstETH.wrap(stethAmount);
    shares[msg.sender] += wstethAmount; // stable accounting
}`,
    relatedSlugs: ["fee-on-transfer-token", "erc4626-inflation-attack", "price-manipulation"],
  },
  {
    slug: "struct-packing",
    category: "audit",
    title: "Struct Packing & Storage Optimization in Solidity",
    h1: "Struct Packing Vulnerabilities",
    metaDescription: "How incorrect struct ordering wastes gas and can cause subtle bugs in storage slots. Learn optimal packing strategies and storage layout best practices.",
    keywords: ["struct packing solidity", "storage optimization", "storage slot packing", "gas optimization struct", "solidity storage layout"],
    severity: "low",
    whatIsIt: "Solidity stores variables in 32-byte storage slots. Variables smaller than 32 bytes can be packed together if declared consecutively. Poorly ordered structs waste storage slots — costing gas for every read and write. In extreme cases, incorrect packing assumptions can cause data corruption in assembly code.",
    whyItMatters: "Each additional storage slot costs 20,000 gas for first write and 5,000 for updates. A poorly packed struct with 4 slots instead of 2 costs double the gas for every user interaction. Over a contract's lifetime, this adds up to significant costs.",
    example: `// UNOPTIMIZED: uses 3 storage slots
struct UserInfo {
    uint128 balance;    // slot 0 (16 bytes)
    bool isActive;      // slot 1 (1 byte) — new slot because of uint256 between!
    uint256 timestamp;  // slot 1-2
    uint128 reward;     // slot 3
}

// OPTIMIZED: uses 2 storage slots
struct UserInfo {
    uint128 balance;    // slot 0 (16 bytes)
    uint128 reward;     // slot 0 (16 bytes) — packed!
    uint256 timestamp;  // slot 1 (32 bytes)
    bool isActive;      // slot 2 (1 byte)
}`,
    howToFix: `Order struct members by size (largest first or group small types together). Use uint96 instead of uint256 where possible.

// OPTIMAL: 2 slots instead of 4
struct UserInfo {
    uint256 timestamp;  // slot 0 (full 32 bytes)
    uint128 balance;    // slot 1 (16 bytes)
    uint96 reward;      // slot 1 (12 bytes) — packed!
    bool isActive;      // slot 1 (1 byte) — packed!
}`,
    relatedSlugs: ["storage-collision", "immutable-bug", "dos-gas-limit"],
  },
  {
    slug: "private-data-exposure",
    category: "audit",
    title: "Private Data Exposure on Blockchain — Nothing is Hidden",
    h1: "Private Variable Data Exposure",
    metaDescription: "Why 'private' variables in Solidity are not private. Anyone can read any storage slot. Learn why passwords, keys, and secrets must never be stored on-chain.",
    keywords: ["private variable solidity", "on-chain data exposure", "storage slot reading", "blockchain privacy", "secret on chain"],
    severity: "high",
    whatIsIt: "Solidity's 'private' visibility modifier only prevents other contracts from reading the variable through the ABI. Anyone can still read any storage slot directly using eth_getStorageAt. Passwords, API keys, commit-reveal secrets, and encryption keys stored on-chain are fully visible.",
    whyItMatters: "Developers frequently store passwords, puzzle solutions, and game secrets in 'private' variables, believing they're hidden. CTF solutions, lottery numbers, and access passwords stored on-chain have been routinely extracted and exploited.",
    example: `// VULNERABLE: 'private' doesn't mean hidden
contract Vault {
    string private password = "s3cr3t"; // EVERYONE can read this!
    uint private secretNumber = 42;
    
    function unlock(string memory _password) external {
        require(keccak256(bytes(_password)) == keccak256(bytes(password)));
        // Attacker reads slot 0 with eth_getStorageAt
    }
}

// Reading private data:
// web3.eth.getStorageAt(contractAddress, 0) → reveals password`,
    howToFix: `Never store secrets on-chain. Use commit-reveal schemes or off-chain verification.

// SAFE: commit-reveal for secrets
bytes32 public commitment; // hash of secret

function commit(bytes32 _commitment) external {
    commitment = _commitment; // store hash, not secret
}

function reveal(string memory secret) external {
    require(keccak256(bytes(secret)) == commitment);
    // Process the revealed value
}`,
    relatedSlugs: ["entropy-illusion", "access-control", "hidden-backdoor"],
  },
  {
    slug: "force-feed-eth",
    category: "audit",
    title: "Force-Feeding ETH to Contracts — Beyond selfdestruct",
    h1: "Forced ETH Injection Attacks",
    metaDescription: "Three ways to force ETH into smart contracts: selfdestruct, coinbase rewards, and pre-computed CREATE2 addresses. Why your balance assumptions are wrong.",
    keywords: ["force feed eth", "forced ether", "coinbase transfer", "pre-deployment funding", "contract balance assumption"],
    severity: "medium",
    whatIsIt: "Contracts can receive ETH without any function being called through three mechanisms: selfdestruct sending from another contract, coinbase rewards (validator tips), and ETH sent to a pre-computed CREATE2 address before deployment. This means address(this).balance can never be fully trusted.",
    whyItMatters: "Any contract logic that depends on exact balance amounts (games, escrows, auctions with exact ETH checks) can be manipulated. Even with selfdestruct deprecated post-Dencun, coinbase and pre-deployment funding still work.",
    example: `// VULNERABLE: exact balance check
contract Escrow {
    function isFullyFunded() public view returns (bool) {
        return address(this).balance == 5 ether; // can be broken
    }
}

// Force-feed methods:
// 1. selfdestruct(payable(victim))
// 2. block.coinbase rewards sent to contract
// 3. Send ETH to CREATE2 address before deployment`,
    howToFix: `Track deposits internally. Never use address(this).balance == exact_value.

// SAFE: internal accounting
contract Escrow {
    uint256 public totalDeposited;
    
    function deposit() external payable {
        totalDeposited += msg.value;
    }
    
    function isFullyFunded() public view returns (bool) {
        return totalDeposited >= 5 ether; // >= not ==
    }
}`,
    relatedSlugs: ["selfdestruct-vulnerability", "create2-address-collision", "reentrancy"],
  },
  {
    slug: "short-address-attack",
    category: "audit",
    title: "Short Address Attack in ERC-20 Tokens",
    h1: "Short Address / Input Data Attack",
    metaDescription: "How malformed transaction data with shortened addresses can cause incorrect ABI decoding, leading to inflated transfer amounts in ERC-20 tokens.",
    keywords: ["short address attack", "abi decode vulnerability", "input padding attack", "erc20 short address", "transaction data manipulation"],
    severity: "low",
    whatIsIt: "The short address attack exploits the EVM's ABI encoding. If a caller provides a 19-byte address instead of 20 bytes, the ABI decoder pads the missing byte from the next parameter (amount). This effectively multiplies the transfer amount by 256, allowing the attacker to transfer more tokens than intended.",
    whyItMatters: "While modern Solidity versions and most clients validate input lengths, off-chain systems and direct contract interactions can still be vulnerable. Exchanges and wallets that don't validate address length before sending may enable this attack.",
    example: `// Example: transfer(address to, uint256 amount)
// Normal: transfer(0x1234...5678, 100)
// Input: 0xa9059cbb 0000...5678 0000...0064
// 
// Short address: transfer(0x1234...56, 100)
// Input: 0xa9059cbb 0000...5600 0000...6400
// Amount becomes 25600 instead of 100!`,
    howToFix: `Validate input data length in contracts and off-chain systems.

// SAFE: check msg.data length
modifier validPayloadSize(uint expectedSize) {
    require(msg.data.length >= expectedSize + 4, "Invalid input length");
    _;
}

function transfer(address to, uint amount) public validPayloadSize(64) returns (bool) {
    // 64 = 32 bytes address + 32 bytes uint
    return _transfer(msg.sender, to, amount);
}`,
    relatedSlugs: ["abi-encoding-vulnerability", "unchecked-erc20-transfer", "integer-overflow-underflow"],
  },
  {
    slug: "fallback-function-exploit",
    category: "audit",
    title: "Fallback & Receive Function Security in Solidity",
    h1: "Fallback Function Exploits",
    metaDescription: "Security implications of fallback and receive functions. How unintended fallback behavior enables reentrancy, fund trapping, and proxy confusion attacks.",
    keywords: ["fallback function exploit", "receive function solidity", "fallback reentrancy", "proxy fallback", "unintended fallback"],
    severity: "medium",
    whatIsIt: "Solidity's fallback() and receive() functions handle unexpected calls and plain ETH transfers. Security issues arise when: fallback contains expensive logic (gas limit issues), fallback enables reentrancy, missing receive() traps ETH that should be accepted, or fallback conflicts with proxy forwarding patterns.",
    whyItMatters: "Fallback functions are the 'catch-all' for a contract. A poorly designed fallback can enable reentrancy, waste gas, trap funds, or conflict with delegate call forwarding in proxy contracts.",
    example: `// VULNERABLE: fallback enables reentrancy
fallback() external payable {
    if (msg.value > 0) {
        balances[msg.sender] += msg.value;
        _processDeposit(msg.sender); // complex logic in fallback
    }
}

// FUND TRAP: missing receive()
contract MyContract {
    // No receive() or payable fallback
    // Cannot receive ETH from selfdestruct refunds
    // ETH sent here is permanently lost
}`,
    howToFix: `Keep fallback functions minimal. Always include receive() if the contract should accept ETH.

// SAFE: minimal fallback + explicit receive
receive() external payable {
    emit Received(msg.sender, msg.value);
}

fallback() external payable {
    revert("Unknown function"); // reject unexpected calls
}`,
    relatedSlugs: ["reentrancy", "selfdestruct-vulnerability", "delegatecall-vulnerability"],
  },
  {
    slug: "phishing-with-ecrecover",
    category: "audit",
    title: "Phishing via ecrecover — Zero Address Return",
    h1: "ecrecover Zero Address Vulnerability",
    metaDescription: "How ecrecover returns address(0) for invalid signatures instead of reverting. This enables bypass of signature verification if the zero address check is missing.",
    keywords: ["ecrecover zero address", "invalid signature ecrecover", "signature verification bypass", "ecrecover vulnerability", "zero address attack"],
    severity: "high",
    whatIsIt: "Solidity's ecrecover returns address(0) for invalid signatures instead of reverting. If a contract doesn't explicitly check that the recovered address is not address(0), an attacker can submit an invalid signature that 'validates' against the zero address, bypassing signature verification.",
    whyItMatters: "If the signer variable is uninitialized (defaults to address(0)) or if any logic path allows the zero address as a valid signer, an attacker can forge valid-looking verification with any random signature data.",
    example: `// VULNERABLE: no zero address check
address public signer; // defaults to address(0) if not set!

function verify(bytes32 hash, uint8 v, bytes32 r, bytes32 s) public view returns (bool) {
    address recovered = ecrecover(hash, v, r, s);
    return recovered == signer; // true if both are address(0)!
}`,
    howToFix: `Always check that ecrecover doesn't return address(0). Use OpenZeppelin's ECDSA library which does this automatically.

// SAFE: use OpenZeppelin ECDSA
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

function verify(bytes32 hash, bytes memory signature) public view returns (bool) {
    address recovered = ECDSA.recover(hash, signature);
    // ECDSA.recover reverts on address(0)
    return recovered == signer;
}`,
    relatedSlugs: ["signature-malleability", "access-control", "tx-origin"],
  },
  {
    slug: "upgradeable-constructor-trap",
    category: "audit",
    title: "Constructor vs Initializer in Upgradeable Contracts",
    h1: "Constructor Trap in Upgradeable Contracts",
    metaDescription: "Why constructors don't work in upgradeable proxy contracts. State set in constructors is stored in the implementation, not the proxy. Learn proper initializer patterns.",
    keywords: ["constructor upgradeable", "initializer pattern", "proxy constructor bug", "upgradeable initialization", "constructor vs initializer"],
    severity: "high",
    whatIsIt: "Constructors run once during deployment and bake state into the implementation contract's storage. Since proxies use delegatecall to the implementation, the proxy has its own storage — which never received the constructor's state. Variables set in constructors are invisible to the proxy.",
    whyItMatters: "Developers transitioning from non-upgradeable to upgradeable contracts often keep constructor logic, unknowingly leaving the proxy with uninitialized state. Critical values like owner, price feeds, or access control settings remain at default values.",
    example: `// BROKEN: constructor state only in implementation
contract VaultV1 is UUPSUpgradeable {
    address public owner;
    uint public fee;
    
    constructor() {
        owner = msg.sender; // only in implementation storage
        fee = 100;         // only in implementation storage
    }
    // Proxy's owner = address(0), fee = 0
}`,
    howToFix: `Replace constructors with initializer functions. Disable constructors with _disableInitializers().

// SAFE: initializer pattern
contract VaultV1 is Initializable, UUPSUpgradeable {
    address public owner;
    uint public fee;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }
    
    function initialize(uint _fee) external initializer {
        __UUPSUpgradeable_init();
        owner = msg.sender; // stored in PROXY's storage
        fee = _fee;
    }
}`,
    relatedSlugs: ["uninitialized-proxy", "storage-collision", "immutable-bug"],
  },
  {
    slug: "erc20-double-spend",
    category: "audit",
    title: "ERC-20 Double-Spend via Re-Entrancy",
    h1: "ERC-20 Token Double-Spend",
    metaDescription: "How reentrancy in custom ERC-20 implementations enables double spending. Learn to implement checks-effects-interactions in token transfer functions.",
    keywords: ["erc20 double spend", "token reentrancy", "transfer reentrancy", "double spend vulnerability", "erc20 callback exploit"],
    severity: "critical",
    whatIsIt: "Custom ERC-20 implementations with hooks, callbacks, or external calls during transfer can be exploited for double-spending. If balances are updated after an external call in the transfer flow, an attacker can re-enter and spend the same balance twice.",
    whyItMatters: "Custom token implementations with fee distribution, reflection mechanisms, or third-party integrations often introduce external calls during transfers. Each external call is a potential reentrancy vector for double-spending.",
    example: `// VULNERABLE: notifies recipient before updating balance
function _transfer(address from, address to, uint amount) internal {
    require(balances[from] >= amount);
    INotifier(to).onTokenReceived(from, amount); // external call!
    balances[from] -= amount; // updated AFTER external call
    balances[to] += amount;
}`,
    howToFix: `Update balances before any external calls. Apply nonReentrant to transfer functions.

// SAFE: checks-effects-interactions
function _transfer(address from, address to, uint amount) internal nonReentrant {
    require(balances[from] >= amount);
    balances[from] -= amount; // update BEFORE
    balances[to] += amount;   // update BEFORE
    INotifier(to).onTokenReceived(from, amount); // external call AFTER
}`,
    relatedSlugs: ["reentrancy", "callback-reentrancy", "unchecked-erc20-transfer"],
  },
  {
    slug: "l2-sequencer-downtime",
    category: "audit",
    title: "L2 Sequencer Downtime Risks — Stale Oracle Protection",
    h1: "Layer 2 Sequencer Downtime Vulnerabilities",
    metaDescription: "How L2 sequencer downtime creates stale oracle data and unfair liquidations. Implement Chainlink's sequencer uptime feed for L2-safe DeFi protocols.",
    keywords: ["l2 sequencer downtime", "sequencer uptime feed", "arbitrum sequencer", "optimism sequencer", "l2 oracle stale"],
    severity: "high",
    whatIsIt: "When an L2 sequencer goes down, oracle prices become stale but transactions queue up. When the sequencer restarts, queued transactions execute with outdated prices, enabling unfair liquidations and arbitrage. Borrowers can be liquidated at prices that no longer reflect reality.",
    whyItMatters: "Arbitrum and Optimism sequencers have experienced downtime. During outages, Chainlink price feeds freeze. When the sequencer returns, pending liquidations execute at stale prices, harming borrowers who couldn't act during downtime.",
    example: `// VULNERABLE: doesn't check sequencer status
function liquidate(address borrower) external {
    (, int price,,uint updatedAt,) = priceFeed.latestRoundData();
    // Price might be hours old if sequencer was down
    // Borrower couldn't repay during downtime
    if (getCollateralValue(borrower, price) < getDebt(borrower)) {
        _liquidate(borrower);
    }
}`,
    howToFix: `Check Chainlink's sequencer uptime feed before using oracle data on L2.

// SAFE: check sequencer uptime
AggregatorV3Interface sequencerFeed = AggregatorV3Interface(SEQUENCER_UPTIME_FEED);

function getPrice() public view returns (int) {
    (, int answer, uint startedAt,,) = sequencerFeed.latestRoundData();
    bool isSequencerUp = answer == 0;
    require(isSequencerUp, "Sequencer down");
    
    uint timeSinceUp = block.timestamp - startedAt;
    require(timeSinceUp > GRACE_PERIOD, "Grace period");
    
    (, int price,,uint updatedAt,) = priceFeed.latestRoundData();
    require(block.timestamp - updatedAt < STALENESS_THRESHOLD);
    return price;
}`,
    relatedSlugs: ["oracle-manipulation", "flash-loan-attack", "timestamp-dependence"],
  },
  {
    slug: "precision-loss",
    category: "audit",
    title: "Precision Loss & Rounding Errors in Solidity",
    h1: "Precision Loss and Rounding Vulnerabilities",
    metaDescription: "How integer division in Solidity causes precision loss, enabling share manipulation, dust amount exploits, and rounding-based theft. Learn safe math patterns.",
    keywords: ["precision loss solidity", "rounding error", "integer division", "dust amount exploit", "solidity math precision"],
    severity: "medium",
    whatIsIt: "Solidity has no floating-point numbers. Integer division always rounds down, losing precision. This creates exploitable situations: depositing amounts that round to 0 shares, withdrawal calculations that consistently round in the attacker's favor, or fee calculations that lose revenue.",
    whyItMatters: "Precision loss in share calculations, fee computations, and exchange rate math has been exploited in multiple DeFi protocols. Small rounding errors compounded over many transactions can drain significant value.",
    example: `// VULNERABLE: division before multiplication
function getReward(uint shares, uint totalRewards, uint totalShares) view returns (uint) {
    return shares / totalShares * totalRewards; // WRONG ORDER!
    // 99 / 100 * 1000 = 0 * 1000 = 0 (lost 990!)
}

// VULNERABLE: dust deposits for free shares
function deposit(uint amount) external {
    uint shares = amount * totalShares / totalAssets;
    // If amount * totalShares < totalAssets: shares = 0
    // Attacker loses nothing but contract received tokens
}`,
    howToFix: `Multiply before dividing. Add minimum amount checks. Use fixed-point libraries.

// SAFE: multiply before divide
function getReward(uint shares, uint totalRewards, uint totalShares) view returns (uint) {
    return shares * totalRewards / totalShares; // correct order
    // 99 * 1000 / 100 = 990
}

// SAFE: minimum deposit check
function deposit(uint amount) external {
    uint shares = amount * totalShares / totalAssets;
    require(shares > 0, "Amount too small");
    _mint(msg.sender, shares);
}`,
    relatedSlugs: ["erc4626-inflation-attack", "integer-overflow-underflow", "flash-loan-attack"],
  },
  {
    slug: "mapping-deletion-bug",
    category: "audit",
    title: "Mapping Deletion Bug — Incomplete State Cleanup",
    h1: "Mapping Deletion Vulnerabilities",
    metaDescription: "Why deleting a struct containing a mapping doesn't clear the mapping in Solidity. Learn how residual data creates security vulnerabilities in state cleanup.",
    keywords: ["mapping deletion bug", "struct delete incomplete", "solidity mapping clear", "residual state", "mapping cleanup"],
    severity: "medium",
    whatIsIt: "In Solidity, using 'delete' on a struct that contains a mapping does not clear the mapping entries — mappings don't have a concept of 'all keys' so they can't be iterated or cleared. This leaves residual state that can be exploited if the struct slot is reused.",
    whyItMatters: "If a user account is deleted and the slot is reused for a new user, the new user inherits the old user's mapping data (approvals, permissions, balances within the mapping). This can grant unintended access or funds.",
    example: `// VULNERABLE: delete doesn't clear the mapping
struct UserAccount {
    uint balance;
    bool active;
    mapping(address => uint) allowances; // NOT cleared by delete!
}

mapping(uint => UserAccount) public accounts;

function deleteAccount(uint id) external {
    delete accounts[id]; // balance = 0, active = false
    // BUT allowances mapping entries still exist!
}

function createAccount(uint id) external {
    accounts[id].active = true;
    // New user inherits old user's allowances!
}`,
    howToFix: `Manually clear known mapping keys before deleting structs. Use a separate nonce or version counter.

// SAFE: version-based invalidation
struct UserAccount {
    uint balance;
    uint version;
    mapping(address => mapping(uint => uint)) versionedAllowances;
}

function deleteAccount(uint id) external {
    accounts[id].version++; // invalidates all old allowances
    accounts[id].balance = 0;
}`,
    relatedSlugs: ["storage-collision", "access-control", "private-data-exposure"],
  },
  {
    slug: "block-gas-limit-exploit",
    category: "audit",
    title: "Block Gas Limit Exploitation — Transaction Size Attacks",
    h1: "Block Gas Limit Exploits",
    metaDescription: "How block gas limits create censorship vectors and transaction ordering attacks. Learn about gas-aware contract design and transaction splitting patterns.",
    keywords: ["block gas limit", "transaction censorship", "gas limit attack", "block stuffing", "gas aware design"],
    severity: "medium",
    whatIsIt: "The block gas limit caps the total gas consumable in a single block. Attackers can exploit this by: filling blocks to censor specific transactions, creating contracts with operations that approach the gas limit (making them uncallable if gas prices spike), or designing loops that grow beyond callable limits.",
    whyItMatters: "Governance proposals, auction endings, and time-sensitive operations can be blocked by block stuffing. Functions that grow in gas cost over time may become permanently uncallable, locking funds.",
    example: `// VULNERABLE: gas cost grows unboundedly
address[] public stakers;
function claimAll() external {
    for (uint i = 0; i < stakers.length; i++) {
        _sendReward(stakers[i]); // gas scales with staker count
    }
    // After 10000 stakers: exceeds block gas limit
    // Nobody can ever claim rewards again
}`,
    howToFix: `Implement pagination, batching, or pull-based patterns.

// SAFE: paginated processing
function claimBatch(uint start, uint batchSize) external {
    uint end = start + batchSize;
    if (end > stakers.length) end = stakers.length;
    for (uint i = start; i < end; i++) {
        _sendReward(stakers[i]);
    }
}`,
    relatedSlugs: ["dos-gas-limit", "denial-of-service-revert", "griefing-attack"],
  },
  {
    slug: "storage-gap-collision",
    category: "audit",
    title: "Storage Gap Collision in Upgradeable Contracts",
    h1: "Storage Gap Collision Vulnerabilities",
    metaDescription: "Learn why storage gaps are critical for upgradeable contracts. Prevent data corruption when adding variables to base contracts during upgrades.",
    keywords: ["storage gap collision", "upgradeable contract storage", "solidity storage gap", "proxy storage corruption"],
    severity: "high",
    whatIsIt: "Upgradeable contracts using inheritance must reserve 'gaps' in storage slots to allow adding variables to base contracts without shifting the layout of child contracts. Forgetting these gaps leads to storage collisions during upgrades.",
    whyItMatters: "Without gaps, adding a single variable to a base contract shifts all subsequent variables in derived contracts to new slots, corrupting critical data like user balances or admin addresses.",
    example: `// VULNERABLE: No storage gap
contract Base {
    uint256 public x;
}
contract Child is Base {
    uint256 public y; // stored in slot 1
}

// UPGRADE: Adding 'z' to Base
contract BaseV2 {
    uint256 public x;
    uint256 public z; // occupies slot 1
}
// Now Child.y is overwritten by BaseV2.z!`,
    howToFix: `Always include a storage gap in base contracts.
contract Base {
    uint256 public x;
    uint256[49] private __gap; // reserved slots for future use
}`,
    relatedSlugs: ["storage-collision", "uninitialized-proxy", "delegatecall-vulnerability"],
  },
  {
    slug: "reward-dilution-attack",
    category: "audit",
    title: "Reward Dilution Attacks in DeFi Staking Contracts",
    h1: "Reward Dilution Vulnerabilities",
    metaDescription: "How attackers dilute rewards for legitimate stakers by manipulating share calculations or timing. Protect your yield-bearing protocols from dilution.",
    keywords: ["reward dilution", "staking exploit", "yield farm vulnerability", "share manipulation", "defi reward bug"],
    severity: "medium",
    whatIsIt: "Reward dilution occurs when an attacker can artificially increase their share of a reward pool right before a distribution, or when the distribution logic fails to account for the 'time' factor, allowing instant profit at the expense of long-term stakers.",
    whyItMatters: "Fairness in reward distribution is key to protocol trust. Dilution attacks drain the value intended for loyal users, often leading to a 'bank run' on the protocol.",
    example: `// VULNERABLE: Instant reward distribution
function claimReward() public {
    uint reward = balances[msg.sender] * totalRewards / totalSupply;
    // Attacker can flash-loan tokens, deposit, claim, and withdraw
    _mintRewards(msg.sender, reward);
}`,
    howToFix: `Use time-weighted reward distribution (like Synthetix RewardDistributor) or snapshots.
// Use reward-per-token-stored pattern
function updateReward(address account) internal {
    rewardPerTokenStored = rewardPerToken();
    lastUpdateTime = lastTimeRewardApplicable();
    if (account != address(0)) {
        rewards[account] = earned(account);
        userRewardPerTokenPaid[account] = rewardPerTokenStored;
    }
}`,
    relatedSlugs: ["flash-loan-attack", "oracle-manipulation", "precision-loss"],
  },
  {
    slug: "unbounded-array-iteration",
    category: "audit",
    title: "Unbounded Array Iteration — The Gas Limit DoS",
    h1: "DoS via Unbounded Array Iteration",
    metaDescription: "Iterating over arrays that grow without limits will eventually exceed the block gas limit. Learn to avoid permanent contract bricking.",
    keywords: ["unbounded array", "gas limit dos", "solidity loop bug", "block gas limit vulnerability"],
    severity: "high",
    whatIsIt: "When a contract iterates through an array of unknown or growing size (like a list of stakers or voters), the gas cost increases as the array grows. Eventually, it will cost more than the block gas limit, rendering the function uncallable.",
    whyItMatters: "This is a permanent Denial of Service (DoS). Once the array is too large, those funds or actions are locked forever. Many early DeFi projects had to be abandoned for this reason.",
    example: `// VULNERABLE
function payAll() public {
    for (uint i = 0; i < stakers.length; i++) {
        payable(stakers[i]).transfer(reward);
    }
}
// If stakers has 10,000 entries, this function reverts permanently.`,
    howToFix: `Use pull-based payments or pagination.
function payInBatches(uint start, uint end) public {
    for (uint i = start; i < end; i++) {
        // ... process limited batch
    }
}`,
    relatedSlugs: ["dos-gas-limit", "denial-of-service-revert", "griefing-attack"],
  },
  {
    slug: "state-variable-shadowing",
    category: "audit",
    title: "State Variable Shadowing in Solidity Inheritance",
    h1: "Inheritance Variable Shadowing",
    metaDescription: "Understand how shadowing state variables leads to logic errors. Learn why Solidity 0.6+ made this a compiler error and how to manage legacy code.",
    keywords: ["variable shadowing", "solidity inheritance bug", "state variable shadow", "solidity 0.6 compiler"],
    severity: "medium",
    whatIsIt: "Shadowing occurs when a derived contract declares a state variable with the same name as one in its parent contract. This creates two distinct variables, leading to confusion where base functions use the parent variable while derived functions use the local one.",
    whyItMatters: "It causes 'invisible' bugs. You might think you updated a variable, but you only updated the 'shadowed' one. The core protocol logic remains unchanged, leading to unauthorized actions or incorrect state.",
    example: `contract Base {
    uint public x = 10;
}
contract Child is Base {
    uint public x = 20; // Shadows Base.x
    function getBaseX() public view returns (uint) {
        return Base.x; // returns 10
    }
}`,
    howToFix: `Avoid redeclaring variables in child contracts. In modern Solidity, this will trigger a compiler error. Use getters/setters or keep names unique.`,
    relatedSlugs: ["access-control", "storage-collision", "logic-error"],
  },
  {
    slug: "initializer-reentrancy",
    category: "audit",
    title: "Initializer Reentrancy in Upgradeable Contracts",
    h1: "Reentrancy during Initialization",
    metaDescription: "Special case of reentrancy where attackers exploit upgradeable contracts during their setup phase. Prevent uninitialized contract takeovers.",
    keywords: ["initializer reentrancy", "proxy setup vulnerability", "uups initialize attack", "initializable guard"],
    severity: "critical",
    whatIsIt: "Initializers are one-time set-up functions for proxies. If an initializer makes an external call before marking itself as 'initialized', an attacker can re-enter the initializer or another critical function to gain control before setup is complete.",
    whyItMatters: "The setup phase is the most vulnerable time. If an attacker can interfere during initialization, they can steal the owner role or set malicious parameters before you do.",
    example: `// VULNERABLE
function initialize(address firstUser) public {
    require(!initialized);
    // External call before setting initialized = true
    firstUser.call(""); 
    owner = msg.sender;
    initialized = true;
}`,
    howToFix: `Use OpenZeppelin's Initializable contract and ensure the initializer modifier is applied. Set state BEFORE external calls (Checks-Effects-Interactions).`,
    relatedSlugs: ["uninitialized-proxy", "reentrancy", "storage-collision"],
  },
  {
    slug: "floating-point-math-error",
    category: "audit",
    title: "Floating Point Math Simulation Errors in Solidity",
    h1: "Fixed-Point Math Vulnerabilities",
    metaDescription: "Simulating decimals in Solidity using integers is prone to errors. Learn about scaling factors and how to avoid precision bugs in financial logic.",
    keywords: ["floating point solidity", "fixed point math", "solidity decimals", "precision error contract"],
    severity: "medium",
    whatIsIt: "Solidity does not support floating-point numbers. Developers use large integers (like 10**18) to simulate decimals. Errors occur when performing division before multiplication, or when mixing different decimals (e.g., USDT @ 6 vs DAI @ 18).",
    whyItMatters: "Calculations in DeFi often involve complex ratios. A small rounding error can be exploited via high-volume swaps or flash loans to drain millions in 'dust' or accrued yield.",
    example: `// VULNERABLE
uint price = totalUSD / totalTokens; // result is truncated to 0 if USD < Tokens
uint totalValue = price * userTokens; // result is 0`,
    howToFix: `Always multiply before dividing to maintain precision. Use a high multiplier (e.g., 1e18) for intermediate ratios.
uint price_e18 = (totalUSD * 1e18) / totalTokens;
uint totalValue = (price_e18 * userTokens) / 1e18;`,
    relatedSlugs: ["precision-loss", "erc4626-inflation-attack", "integer-overflow-underflow"],
  },
  {
    slug: "proxy-selector-clash",
    category: "audit",
    title: "Proxy Selector Clash — Transparent vs UUPS Security",
    h1: "Function Selector Clash Vulnerabilities",
    metaDescription: "How identical function selectors in proxy and implementation contracts cause logic bypasses. Learn to secure your bridge and proxy patterns.",
    keywords: ["selector clash", "proxy function collision", "transparent proxy", "uups vs transparent", "solidity selector collision"],
    severity: "high",
    whatIsIt: "A selector clash happens when the 4-byte hash of a proxy administrative function matches a function in the implementation contract. The proxy might accidentally execute the implementation logic or block the management function.",
    whyItMatters: "It can lead to un-upgradable contracts or 'shadow' functions where you think you're calling an admin method but you're actually triggering a user-level logic error.",
    example: `// Proxy: function upgradeTo(address) -> selector 0x3659cfe6
// Implementation: function collidesWithUpgrade() -> selector 0x3659cfe6
// The Proxy will always take precedence if not handled.`,
    howToFix: `Use Transparent Proxy Pattern (checks msg.sender to distinguish admin from user) or the UUPS pattern which places upgrade logic in implementation storage.`,
    relatedSlugs: ["delegatecall-vulnerability", "uninitialized-proxy", "storage-collision"],
  },
  {
    slug: "slippage-tolerance-bypass",
    category: "audit",
    title: "Slippage Tolerance Bypass in DEX Integrations",
    h1: "Insufficient Slippage Protection",
    metaDescription: "Hardcoding slippage or using weak tolerance values makes your contract vulnerable to sandwich attacks. Learn to implement dynamic slippage.",
    keywords: ["slippage bypass", "dex swap vulnerability", "sandwich attack", "minAmountOut bug"],
    severity: "high",
    whatIsIt: "When interacting with a DEX, your contract must specify a 'minAmountOut'. If this is set to 0, or is too low, bots can manipulate the price (sandwich) so your contract receives much less value than expected.",
    whyItMatters: "If your contract handles user funds (like an aggregator or vault), lack of slippage protection allows attackers to steal the 'difference' in every trade by front-running and back-running the transaction.",
    example: `// VULNERABLE: minAmountOut = 0
router.swap(amountIn, 0, path, address(this), deadline);`,
    howToFix: `Calculate minAmountOut based on a reliable oracle or a user-provided percentage.
uint minOut = expectedOut * (1000 - slippageBps) / 1000;
router.swap(amountIn, minOut, path, address(this), deadline);`,
    relatedSlugs: ["sandwich-attack", "oracle-manipulation", "frontrunning"],
  },
  {
    slug: "governance-proposal-spam",
    category: "audit",
    title: "Governance Proposal Spam — DAO Denial of Service",
    h1: "DAO Proposal Spamming Vectors",
    metaDescription: "How low proposal thresholds allow attackers to flood DAOs with malicious votes. Protect your governance from spam and fatigue.",
    keywords: ["governance spam", "dao dos", "proposal threshold", "governance attack", "voting fatigue"],
    severity: "low",
    whatIsIt: "If the threshold to create a proposal is too low, an attacker can create thousands of malicious proposals. This floods the voting UI, fatigues voters, and can be used to hide a truly malicious vote in a mountain of noise.",
    whyItMatters: "Governance is the brain of the protocol. If the brain is overwhelmed, critical security upgrades might be missed or malicious changes could slip through unnoticed.",
    example: `// VULNERABLE: Anyone with 1 token can propose
function propose(...) {
    require(token.balanceOf(msg.sender) >= 1);
}`,
    howToFix: `Set a significant threshold (e.g., 1% of supply) and implement a small fee or deposit for creating proposals that is refunded if the vote passes.`,
    relatedSlugs: ["governance-attack", "flash-loan-attack", "griefing-attack"],
  },
  {
    slug: "vote-weight-inflation",
    category: "audit",
    title: "Vote Weight Inflation in Governance Contracts",
    h1: "Voting Power Manipulation",
    metaDescription: "Discover how double-voting and delegated weight inflation break DAO democracy. Secure your snapshots and voting logic.",
    keywords: ["vote inflation", "governance vulnerability", "double voting", "vote snapshot attack"],
    severity: "high",
    whatIsIt: "Vote inflation occurs when an attacker can use the same tokens multiple times to vote, or when transferring tokens to a new wallet 'creates' new voting power because the protocol uses current balances instead of snapshots.",
    whyItMatters: "It enables a user with 5% of tokens to have 50%+ voting power by cycling tokens between wallets. This leads to unauthorized treasury drains or malicious protocol upgrades.",
    example: `// VULNERABLE: Uses current balance
function vote(uint proposalId) {
    uint weight = token.balanceOf(msg.sender);
    proposals[proposalId].votes += weight;
    // Attacker votes, transfers to wallet B, votes again.
}`,
    howToFix: `Use Checkpoints and Snapshots. Vote weight should be determined at the block the proposal was created. Use OpenZeppelin's ERC20Votes.`,
    relatedSlugs: ["governance-attack", "flash-loan-attack", "timestamp-dependence"],
  },
  {
    slug: "zero-address-mint",
    category: "audit",
    title: "Zero Address Minting & Burning Edge Cases",
    h1: "Zero Address Vulnerabilities in Tokens",
    metaDescription: "Why checking for address(0) is critical in ERC-20 and NFT contracts. Prevent 'lost' supply and broken accounting invariants.",
    keywords: ["zero address mint", "address(0) bug", "erc20 audit", "token supply invariant"],
    severity: "medium",
    whatIsIt: "Failing to check if a recipient is address(0) during minting or transfers can resolve in permanent loss of tokens. More criticially, if address(0) is treated as a valid user, it can break bridge accounting where address(0) might be used for 'locked' tokens.",
    whyItMatters: "Proper validation preserves supply invariants. If a contract burns tokens by sending to address(0) but also allows minting to it, the 'TotalSupply' vs 'Sum of Balances' invariant is broken.",
    example: `// VULNERABLE
function mint(address to, uint val) public {
    _mint(to, val); // If 'to' is 0, supply increases but tokens are unrecoverable
}`,
    howToFix: `Always require(to != address(0)). 
function _mint(address account, uint256 amount) internal virtual {
    require(account != address(0), "mint to zero address");
    // ...
}`,
    relatedSlugs: ["unchecked-erc20-transfer", "contract-logic-error", "logic-error"],
  },
  {
    slug: "divide-by-zero-panic",
    category: "audit",
    title: "Division by Zero Panic in Smart Contracts",
    h1: "Denial of Service via Division by Zero",
    metaDescription: "How unvalidated math operations can brick your contract. Learn to handle empty states and zero-inputs in DeFi formulas.",
    keywords: ["divide by zero", "solidity panic", "contract revert", "math safety"],
    severity: "medium",
    whatIsIt: "If a denominator in a division evaluates to zero, the transaction reverts (Panic(0x12) in Solidity 0.8+). If this occurs in a critical path like liquidation or reward claiming where state is stuck at 0, the function may be permanently broken.",
    whyItMatters: "DoS via calculation failure. For example, if 'totalSupply' becomes 0 in a vault, and a withdrawal function divides by it, no further actions can be taken.",
    example: `// VULNERABLE
function getPricePerShare() public view returns (uint) {
    return totalAssets / totalSupply; // Reverts if first user hasn't deposited
}`,
    howToFix: `Always check for zero denominators.
function getPricePerShare() public view returns (uint) {
    if (totalSupply == 0) return 1e18;
    return totalAssets / totalSupply;
}`,
    relatedSlugs: ["dos-gas-limit", "precision-loss", "logic-error"],
  },
  {
    slug: "l2-cost-manipulation",
    category: "audit",
    title: "L2 Execution Cost Manipulation & Gas Discrepancies",
    h1: "Layer 2 Gas Pricing Vulnerabilities",
    metaDescription: "How L2 nodes calculate gas differently than L1. Learn about L1 submission fees and why msg.gas assumptions are dangerous on rollups.",
    keywords: ["l2 gas cost", "sequencer fee", "arbitrum gas bug", "optimism gas security"],
    severity: "medium",
    whatIsIt: "L2s separate L2 execution cost from L1 security fees (submission cost). Contracts that assume Ethereum-style gas pricing might miscalculate fees, allowing attackers to perform 'cheap' DoS on L2 that would be expensive on L1.",
    whyItMatters: "If a bridge or relayer pays gas for the user on L2, they might be drained if the user can manipulate the L1 submission fee component to be much higher than estimated.",
    example: `// VULNERABLE: Relayer pays up to 10M gas on Arbitrum
function relay(bytes data) {
    // Arbitrum L2 gas is cheap, but L1 calldata is expensive
    // Attacker sends huge data payload that fits L2 limit but exhausts relayer
}`,
    howToFix: `Use L2-specific gas oracles. Account for calldata size in fee calculations. On Arbitrum, use the ArbGasInfo precompile.`,
    relatedSlugs: ["l2-sequencer-downtime", "dos-gas-limit", "griefing-attack"],
  },
  {
    slug: "shadowing-inherited-state",
    category: "audit",
    title: "Shadowing Inherited State Variables — Security Risks",
    h1: "Inherited State Variable Shadowing",
    metaDescription: "Deep dive into inheritance bugs. How redeclaring variables in child contracts creates parallel state and breaks authorization checks.",
    keywords: ["inherited shadowing", "solidity inheritance", "state variable bug", "access control shadow"],
    severity: "medium",
    whatIsIt: "When a child contract redeclares a variable already found in its parent, it doesn't overwrite it — it creates a second entry in storage. Functions defined in the parent will use the parent's variable, while functions in the child use the child's variable.",
    whyItMatters: "If the 'owner' variable is shadowed, calling 'transferOwnership' (defined in parent) updates the parent's variable, but 'onlyOwner' modifiers in the child might still be checking the child's (un-updated) variable.",
    example: `contract A { address owner; }
contract B is A { address owner; } // 2 owners in storage now!`,
    howToFix: `Explicitly use variables from the base contract. Never redeclare state variables with the same name. Use compiler version 0.6.0+ which flags this as a warning/error.`,
    relatedSlugs: ["access-control", "storage-collision", "logic-error"],
  },
  {
    slug: "logic-error-shorthand",
    category: "audit",
    title: "Shorthand Logic Errors in Solidity — the += Trap",
    h1: "Shorthand Operator Vulnerabilities",
    metaDescription: "How typos in shorthand operators like =+ vs += create critical logic bugs. Learn to audit for 'assignment vs addition' errors.",
    keywords: ["shorthand bug", "solidity typo", "balance overwrite", "logic error contract"],
    severity: "high",
    whatIsIt: "A common typo is writing `variable =+ value` instead of `variable += value`. In many languages (and older Solidity), `=+` was interpreted as assigning a positive value, not adding to the current one.",
    whyItMatters: "This bug causes balances to be 'reset' to the deposit amount instead of incremented. If I have 1000 tokens and deposit 1, my balance becomes 1 instead of 1001.",
    example: `// VULNERABLE
function deposit(uint val) public {
    balances[msg.sender] =+ val; // Overwrites instead of adding
}`,
    howToFix: `Standardize on += and use static analysis tools like Slither which catch this instantly. Review all arithmetic changes carefully.`,
    relatedSlugs: ["integer-overflow-underflow", "logic-error", "precision-loss"],
  },
  {
    slug: "metamorphic-contracts",
    category: "audit",
    title: "Metamorphic Contracts — Code Changing at One Address",
    h1: "Metamorphic Contract Vulnerabilities",
    metaDescription: "How CREATE2 allows deploying different bytecode to the same address. Understand the security risks of trusting code that can change.",
    keywords: ["metamorphic contract", "create2 bytecode", "selfdestruct redeploy", "contract address collision"],
    severity: "high",
    whatIsIt: "Metamorphic contracts use CREATE2 and selfdestruct to change their source code while keeping the same contract address. An attacker can deploy a 'safe' contract, wait for it to be trusted/funded, destroy it, and redeploy malicious code to the same spot.",
    whyItMatters: "This breaks the fundamental assumption of blockchain: that code at an address is immutable. This allows bypassing multisig approvals, external audits, and token whitelists.",
    example: `// 1. Deploy factory at X
// 2. Factory deploys 'SafeV1' at Y (using CREATE2)
// 3. User deposits into Y
// 4. Factory triggers 'selfdestruct' in Y
// 5. Factory deploys 'EvilV2' at Y (using same salt)`,
    howToFix: `Never trust a contract that has 'selfdestruct' capability or is deployed by a factory using CREATE2 without auditing the factory itself. Check extcodehash regularly.`,
    relatedSlugs: ["create2-address-collision", "selfdestruct-vulnerability", "hidden-backdoor"],
  },
  {
    slug: "unprotected-selfdestruct",
    category: "audit",
    title: "Unprotected selfdestruct — The Contract Killer Bug",
    h1: "Missing Access Control on selfdestruct",
    metaDescription: "The most dangerous bug: any user can destroy the contract. Learn to secure your death-functions and why selfdestruct is being deprecated.",
    keywords: ["unprotected selfdestruct", "kill contract", "selfdestruct access control", "parity hack"],
    severity: "critical",
    whatIsIt: "A function containing the `selfdestruct` opcode is exposed without access control (no `onlyOwner`). Any user can call it to wipe the contract's code and storage and send its funds to their own address.",
    whyItMatters: "This is a total loss of the contract. The second Parity Wallet hack was caused by a library contract having an unprotected 'init' function that led to a selfdestruct, freezing $280M worth of ETH.",
    example: `// VULNERABLE
function kill() public {
    selfdestruct(payable(msg.sender)); // Anyone can call
}`,
    howToFix: `Apply strict access control. Most modern contracts should avoid selfdestruct entirely. Note EIP-6780 removes selfdestruct's ability to delete code except in the same tx it was created.`,
    relatedSlugs: ["access-control", "selfdestruct-vulnerability", "delegatecall-vulnerability"],
  },
  {
    slug: "delegatecall-to-self",
    category: "audit",
    title: "Delegatecall to Self — Recursive Context Exploits",
    h1: "Recursive Delegatecall Vulnerabilities",
    metaDescription: "How delegatecalling into your own contract can trigger unintended function execution and storage corruption. Secure your multicall patterns.",
    keywords: ["delegatecall self", "multicall reentrancy", "recursive context", "delegatecall exploit"],
    severity: "high",
    whatIsIt: "If a contract allows a delegatecall to itself, or to an address controlled by the user, it can be used to execute public functions from 'within' the contract's own context, often bypassing access control or reentrancy guards.",
    whyItMatters: "It enables 'Context Confusion'. If I multicall a protected function from inside a delegatecall, I might bypass the `nonReentrant` flag because the contract is calling 'itself' in a way it wasn't designed to handle.",
    example: `// VULNERABLE: can delegatecall back into 'withdraw'
function multicall(bytes[] data) {
    for (uint i; i<data.length; i++) {
        address(this).delegatecall(data[i]);
    }
}`,
    howToFix: `Disallow delegatecalling to the contract's own address. Use separate internal functions for multicall logic instead of delegatecalling to public ones.`,
    relatedSlugs: ["delegatecall-vulnerability", "reentrancy", "msg-value-multicall"],
  },
  {
    slug: "unbounded-loop-dos",
    category: "audit",
    title: "Unbounded Loop DoS — Preventing Permanent Fund Loss",
    h1: "Denial of Service via Unbounded Loops",
    metaDescription: "Loops that grow with user count will eventually fail. Learn to implement pull-payment and storage-based solutions to avoid DoS.",
    keywords: ["unbounded loop", "loop dos", "gas limit exceed", "contract bricking"],
    severity: "high",
    whatIsIt: "Any function that contains a loop without a fixed maximum iteration count is a potential DoS vector. As more data is added to the array or mapping, the gas cost of the loop will eventually exceed the block gas limit.",
    whyItMatters: "Once the gas limit is exceeded, that function can NEVER be executed again. If it is a 'withdrawAll' or 'finalize' function, all funds in the contract are stuck forever.",
    example: `// VULNERABLE
function finalize() public {
    for (uint i=0; i < participants.length; i++) {
        _payout(participants[i]);
    }
} // Bricks if participants > ~1000`,
    howToFix: `Use a pull-payment pattern: let each user withdraw their own portion. If iteration is required, use pagination (start/stop indices).`,
    relatedSlugs: ["dos-gas-limit", "denial-of-service-revert", "griefing-attack"],
  },
  {
    slug: "oracle-staleness-check",
    category: "audit",
    title: "Missing Oracle Staleness Checks — Market Risks",
    h1: "Price Oracle Staleness Vulnerabilities",
    metaDescription: "How using old prices leads to arbitrage and liquidations. Learn to check updatedAt and heartbeat values in your Chainlink feeds.",
    keywords: ["oracle staleness", "stale price feed", "chainlink heartbeat", "price manipulation"],
    severity: "high",
    whatIsIt: "Price oracles provide a 'updatedAt' timestamp. If the oracle stops updating (due to network congestion or node failure) and the contract continues to use the old price, it no longer reflects real market conditions.",
    whyItMatters: "Attackers can buy or liquidate assets at prices that are minutes or hours old, profiting from market movements that occurred after the oracle's last update. This is essentially free arbitrage at the protocol's expense.",
    example: `// VULNERABLE: No staleness check
(, int price, , ,) = feed.latestRoundData();
return uint(price);`,
    howToFix: `Check the updatedAt timestamp.
(, int price, , uint updated, ) = feed.latestRoundData();
require(block.timestamp - updated < HEARTBEAT_THRESHOLD, "Stale");`,
    relatedSlugs: ["oracle-manipulation", "flash-loan-attack", "price-manipulation"],
  },
  {
    slug: "liquidity-drain-exploit",
    category: "audit",
    title: "Liquidity Drain Exploits in DEX & Lending Protocols",
    h1: "Incentive-Driven Liquidity Drains",
    metaDescription: "Attackers can drain liquidity by manipulating fee rewards or collateral ratios. Learn to secure your AMM and lending pool liquidity.",
    keywords: ["liquidity drain", "amm exploit", "yield drain", "liquidity pool vulnerability"],
    severity: "critical",
    whatIsIt: "A liquidity drain occurs when a protocol's math allows an attacker to withdraw more assets than they deposited, often by manipulating the 'value' of their shares or by exploiting a flaw in how fees/rewards are accrued and distributed.",
    whyItMatters: "It's a direct theft of user funds. Unlike a hack of the owner wallet, this exploit uses the protocol's own logic 'correctly' to slowly or instantly empty its reserves.",
    example: `// VULNERABLE: Rounding error allows stealing 1 wei per tx
function withdraw() {
    uint amt = shares * balance / supply;
    // ... if supply is manipulated, amt can be > deposit`,
    howToFix: `Implement strict rounding rules (always round in favor of protocol). Use virtual liquidity and guard against share price manipulation.`,
    relatedSlugs: ["erc4626-inflation-attack", "price-manipulation", "flash-loan-attack"],
  },
  {
    slug: "flash-mint-attack",
    category: "audit",
    title: "Flash Mint Attacks — ERC-3156 Security Guide",
    h1: "Flash Minting Vulnerabilities",
    metaDescription: "Flash minting allows creating unlimited tokens for one transaction. Learn how this amplifies flash loan attacks and how to secure your token supply.",
    keywords: ["flash mint attack", "erc3156", "token inflation", "temporary supply exploit"],
    severity: "high",
    whatIsIt: "Flash minting (ERC-3156) allows anyone to mint an arbitrary number of tokens, provided they burn them in the same transaction. This provides infinite capital to execute other attacks like oracle manipulation or governance takeovers.",
    whyItMatters: "Compared to flash loans (which are limited by pool reserves), flash minting is limited only by `uint256.max`. It allows for much larger attacks with zero up-front capital.",
    example: `// 1. Flash mint 1 Quadrillion tokens
// 2. Dump tokens to destroy the price on a DEX
// 3. Liquidate everyone at the new price
// 4. Buy back and burn the tokens to close the mint`,
    howToFix: `Limit the maximum flash mint amount. Require a fee for flash mints. Ensure your oracles are resistant to such massive, temporary supply shocks.`,
    relatedSlugs: ["flash-loan-attack", "oracle-manipulation", "price-manipulation"],
  },
  {
    slug: "block-hash-prediction",
    category: "audit",
    title: "Block Hash Prediction — Exploiting On-Chain Randomness",
    h1: "Vulnerability to Block Hash Prediction",
    metaDescription: "Why blockhash() is not random. Learn how miners and savvy users can predict 'random' numbers and win lotteries on-chain.",
    keywords: ["blockhash prediction", "solidity randomness", "lottery exploit", "miner manipulation"],
    severity: "high",
    whatIsIt: "The `blockhash(uint blockNumber)` function returns the hash of an old block. Since users know the hash of past blocks, and miners can influence the hash of the current block, using it for randomness in the same or future transaction is exploitable.",
    whyItMatters: "Any lottery or game using blockhash can be 'solved' off-chain. An attacker can calculate the result and only submit their transaction if it's guaranteed to be a win.",
    example: `// VULNERABLE
uint rand = uint(blockhash(block.number - 1)) % 100;
if (rand == 0) winner = msg.sender;`,
    howToFix: `Use Chainlink VRF for verifiable randomness. If blockhash must be used, enforce a multi-block delay between the 'entry' and the 'result generation'.`,
    relatedSlugs: ["entropy-illusion", "timestamp-dependence", "frontrunning"],
  },
  {
    slug: "assembly-storage-overwrite",
    category: "audit",
    title: "Assembly Storage Overwrite — Inline Assembly Risks",
    h1: "Unsafe Assembly Storage Manipulation",
    metaDescription: "Bypassing Solidity's storage layout with sstore leads to data corruption. Learn to use assembly safely without overwriting critical variables.",
    keywords: ["assembly sstore", "storage overwrite", "inline assembly bug", "solidity storage slot"],
    severity: "critical",
    whatIsIt: "Solidity manages variables in numbered slots. Using `sstore` in inline assembly allows direct access to these slots. If you hardcode a slot number or calculate it incorrectly, you can overwrite critical variables like `owner` or `isPaused` without realizing it.",
    whyItMatters: "Assembly bypasses all compiler checks. It's 'god mode' for the contract. A tiny mistake in slot calculation can make the contract un-manageable or grant an attacker full administrative access.",
    example: `// VULNERABLE: Hardcoded slot overwrite
assembly {
    sstore(0, 0x1) // Overwrites whatever is in slot 0 (usually the first state variable)
}`,
    howToFix: `Use the .slot member to get the slot of a specific variable rather than hardcoding. 
assembly {
    sstore(myVariable.slot, 0x1)
}`,
    relatedSlugs: ["storage-collision", "logic-error", "hidden-backdoor"],
  },
  {
    slug: "floating-pragma",
    category: "audit",
    title: "Floating Pragma & Version Mismatch Risks",
    h1: "Floating Pragma Vulnerabilities",
    metaDescription: "Why ^0.8.0 is dangerous for production. Ensure consistent compilation and avoid version-specific compiler bugs by locking your pragma.",
    keywords: ["floating pragma", "solidity version", "compiler bug", "pragma lock"],
    severity: "low",
    whatIsIt: "A floating pragma (e.g., `pragma solidity ^0.8.0`) allows the contract to be compiled with any version within that range. This means it might be compiled with a newer version that has untested bugs or changes in behavior.",
    whyItMatters: "Production code should be deterministic. You should know EXACTLY what version was used to compile the bytecode. Using a floating pragma makes audits less effective because the audited code might not match the deployed code's behavior on a different compiler.",
    example: `pragma solidity ^0.8.0; // VULNERABLE to range of versions`,
    howToFix: `Lock the pragma for deployment.
pragma solidity 0.8.24;`,
    relatedSlugs: ["solidity-compiler-bugs", "logic-error"],
  },
];

// ─────────────────────────────────────────────────
// TOOLS PAGES  —  Security Tool Landing Pages
// ─────────────────────────────────────────────────

const toolsPages: SEOPage[] = [
  {
    slug: "smart-contract-scanner",
    category: "tools",
    title: "Free Smart Contract Scanner — AI-Powered Solidity Auditor",
    h1: "Smart Contract Security Scanner",
    metaDescription: "Scan your Solidity smart contracts for vulnerabilities in seconds. AetherGuard AI detects reentrancy, overflow, access control bugs, and 50+ other security issues.",
    keywords: ["smart contract scanner", "solidity scanner", "contract audit tool", "automated security scanner", "free smart contract audit"],
    severity: "info",
    whatIsIt: "AetherGuard's Smart Contract Scanner uses deep learning to analyze your Solidity code and detect security vulnerabilities in real-time. It identifies issues that traditional static analyzers miss by understanding the semantic meaning of your code.",
    whyItMatters: "Manual audits cost $20,000–$100,000+ and take weeks. Automated scanners catch most common vulnerabilities instantly, letting you fix issues before deployment. Use AetherGuard as your first line of defense, then follow up with a professional audit for critical contracts.",
    example: `// Paste your contract and get instant results:
// ✅ Reentrancy detection
// ✅ Access control analysis
// ✅ Integer overflow checks
// ✅ Gas optimization suggestions
// ✅ Best practice recommendations`,
    howToFix: "Paste your Solidity code into the scanner above. Get instant vulnerability analysis, risk scoring, and fix recommendations.",
    relatedSlugs: ["reentrancy-checker", "solidity-auditor", "defi-security-suite"],
  },
  {
    slug: "reentrancy-checker",
    category: "tools",
    title: "Reentrancy Checker — Detect Reentrancy Bugs Online",
    h1: "Reentrancy Vulnerability Checker",
    metaDescription: "Instantly detect reentrancy vulnerabilities in your Solidity contracts. Our AI analyzer checks for classic, cross-function, and read-only reentrancy patterns.",
    keywords: ["reentrancy checker", "detect reentrancy", "reentrancy scanner", "cross-function reentrancy", "read-only reentrancy"],
    severity: "info",
    whatIsIt: "AetherGuard's Reentrancy Checker specifically targets all forms of reentrancy: classic single-function, cross-function, cross-contract, and the newer read-only reentrancy pattern that affects view functions in composable DeFi.",
    whyItMatters: "Reentrancy is the #1 smart contract vulnerability by $ lost. From the DAO hack to recent DeFi exploits, this single bug class has caused over $500M in losses. Catching it before deployment is critical.",
    example: `// Our checker detects patterns like:
// 1. External calls before state updates
// 2. Cross-function state dependencies
// 3. Read-only reentrancy in view functions
// 4. Missing ReentrancyGuard usage`,
    howToFix: "Paste your contract into the scanner. AetherGuard will highlight every reentrancy-vulnerable function and show you exactly how to fix it.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "defi-security-suite"],
  },
  {
    slug: "solidity-auditor",
    category: "tools",
    title: "AI Solidity Auditor — Instant Contract Security Review",
    h1: "AI-Powered Solidity Auditor",
    metaDescription: "Get a comprehensive AI security audit for your Solidity contract in seconds. AetherGuard's deep learning model finds bugs that rule-based tools miss.",
    keywords: ["solidity auditor", "ai audit", "smart contract review", "automated audit", "contract security tool"],
    severity: "info",
    whatIsIt: "AetherGuard's AI Auditor goes beyond pattern matching. It uses a deep learning model trained on thousands of audited contracts to understand code semantics and identify complex multi-step vulnerabilities.",
    whyItMatters: "Traditional static analyzers have high false positive rates and miss complex bugs. Our AI model achieves higher accuracy because it understands context — like whether a reentrancy is actually exploitable or safely guarded.",
    example: `// AI audit report includes:
// 🔴 Critical: 2 findings
// 🟡 Medium: 3 findings  
// 🟢 Info: 5 findings
// 📊 Risk Score: 73/100
// 🔧 Auto-fix suggestions for each issue`,
    howToFix: "Upload your .sol file or paste code directly. Receive a detailed security report with risk scoring, finding explanations, and one-click fix suggestions.",
    relatedSlugs: ["smart-contract-scanner", "reentrancy-checker", "gas-optimizer"],
  },
  {
    slug: "defi-security-suite",
    category: "tools",
    title: "DeFi Security Suite — Protect Your Protocol",
    h1: "DeFi Protocol Security Suite",
    metaDescription: "Comprehensive security tooling for DeFi protocols. Scan for flash loan vulnerabilities, oracle manipulation, MEV exposure, and governance attacks.",
    keywords: ["defi security", "protocol security", "flash loan protection", "defi audit", "protocol scanner"],
    severity: "info",
    whatIsIt: "AetherGuard's DeFi Security Suite is purpose-built for protocol teams. It scans for DeFi-specific attack vectors that generic scanners miss: flash loan exploitability, oracle dependency analysis, MEV exposure assessment, and governance attack surface mapping.",
    whyItMatters: "DeFi protocols face unique threats. A contract can be individually secure but vulnerable when composed with other protocols. Our suite analyzes cross-protocol interactions and economic attack vectors.",
    example: `// DeFi-specific checks include:
// ⚡ Flash loan attack simulation
// 📈 Oracle manipulation risk assessment
// 🔄 Cross-protocol reentrancy detection
// 🏛️ Governance attack surface analysis
// 💰 Economic exploit modeling`,
    howToFix: "Submit your protocol contracts for a comprehensive DeFi security assessment. Get a detailed report covering all DeFi-specific attack vectors with prioritized remediation steps.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "reentrancy-checker"],
  },
  {
    slug: "gas-optimizer",
    category: "tools",
    title: "Solidity Gas Optimizer — Reduce Contract Gas Costs",
    h1: "Smart Contract Gas Optimizer",
    metaDescription: "Analyze and optimize gas usage in your Solidity contracts. Find expensive storage operations, unnecessary computations, and optimize your contract's gas footprint.",
    keywords: ["gas optimizer solidity", "reduce gas cost", "gas optimization", "efficient smart contract", "solidity gas tips"],
    severity: "info",
    whatIsIt: "AetherGuard's Gas Optimizer analyzes your Solidity code for gas-inefficient patterns. It identifies expensive storage reads/writes, unnecessary computation, suboptimal data types, and missed opportunities for gas-saving techniques like immutable variables and packed storage.",
    whyItMatters: "High gas costs price out users and reduce protocol adoption. Even small optimizations can save thousands of dollars over a contract's lifetime. Our optimizer finds savings that manual review typically misses.",
    example: `// Common gas optimizations we detect:
// ❌ Using uint8 in storage (costs more than uint256)
// ❌ Reading storage in loops
// ❌ Not using immutable for constructor-set values
// ❌ String comparison instead of bytes32
// ❌ Missing unchecked blocks for safe math`,
    howToFix: "Paste your contract to get a detailed gas analysis. See exactly which lines are expensive and get optimized alternatives.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "defi-security-suite"],
  },
  {
    slug: "token-contract-checker",
    category: "tools",
    title: "Token Contract Checker — Detect Scam Tokens Instantly",
    h1: "Token Contract Safety Checker",
    metaDescription: "Check if a token contract is safe before investing. Detect honeypots, hidden mints, blacklists, and rug pull patterns in ERC-20 token contracts.",
    keywords: ["token checker", "is token safe", "scam token check", "honeypot checker", "token contract analysis"],
    severity: "info",
    whatIsIt: "AetherGuard's Token Checker analyzes ERC-20 contracts for common scam patterns: hidden mint functions, transfer restrictions, blacklists, fake renounceOwnership, proxy contracts that can upgrade to malicious logic, and excessive owner privileges.",
    whyItMatters: "Over 50% of new tokens launched on DEXes are scams. Our checker identifies red flags that manual review misses, protecting you from honeypots, rug pulls, and hidden inflation. Don't invest in what you can't verify.",
    example: `// Token safety checks include:
// 🔴 Hidden mint or inflation functions
// 🔴 Transfer restrictions / blacklists
// 🔴 Fake renounceOwnership
// 🟡 Proxy patterns that can change logic
// 🟡 High owner token allocation
// 🟢 Liquidity lock status`,
    howToFix: "Paste a token contract address or code to get an instant safety analysis. We check for 30+ scam patterns and give you a clear safe/unsafe verdict.",
    relatedSlugs: ["smart-contract-scanner", "reentrancy-checker", "solidity-auditor"],
  },
  {
    slug: "eth-security-audit",
    category: "tools",
    title: "Ethereum Smart Contract Audit — Professional AI Review",
    h1: "Ethereum Smart Contract Audit",
    metaDescription: "Professional-grade Ethereum smart contract audit powered by AI. Get detailed vulnerability reports, risk scoring, and remediation guidance for your Solidity contracts.",
    keywords: ["ethereum audit", "smart contract audit service", "eth contract review", "professional audit", "ethereum security review"],
    severity: "info",
    whatIsIt: "AetherGuard provides comprehensive Ethereum smart contract audits using advanced AI. Our system analyzes your contract for all known vulnerability classes including reentrancy, access control, integer handling, and DeFi-specific attack vectors like flash loan exploitability.",
    whyItMatters: "Deploying unaudited contracts puts your users' funds at risk. Professional audits cost $20,000-$100,000+. AetherGuard's AI audit gives you 80% of the coverage at a fraction of the cost and in seconds instead of weeks.",
    example: `// Our audit covers:
// 📋 Full vulnerability assessment (50+ bug classes)
// 📊 Risk score with severity breakdown
// 🔧 Line-by-line fix suggestions
// 📝 Detailed audit report (exportable)
// ⚡ Results in under 30 seconds`,
    howToFix: "Upload your Solidity files or paste code directly. Get a comprehensive audit report with findings, risk scoring, and fix recommendations.",
    relatedSlugs: ["solidity-auditor", "smart-contract-scanner", "defi-security-suite"],
  },
  {
    slug: "bsc-contract-scanner",
    category: "tools",
    title: "BSC Contract Scanner — BNB Chain Security Analysis",
    h1: "BNB Smart Chain Contract Scanner",
    metaDescription: "Scan BNB Smart Chain contracts for security vulnerabilities. Detect rug pulls, honeypots, and common BSC token scams with AetherGuard's AI analyzer.",
    keywords: ["bsc scanner", "bnb chain audit", "bsc contract checker", "binance smart chain security", "bsc token scanner"],
    severity: "info",
    whatIsIt: "AetherGuard's BSC Scanner is optimized for the BNB Smart Chain ecosystem. It detects BSC-specific patterns including PancakeSwap integration vulnerabilities, BEP-20 implementation flaws, and the unique scam patterns prevalent on the BSC network.",
    whyItMatters: "BSC has a higher concentration of scam tokens than Ethereum mainnet due to lower deployment costs. Our scanner specifically targets the rug pull and honeypot patterns most common on BSC, helping you avoid the worst projects.",
    example: `// BSC-specific checks:
// 🔴 PancakeSwap liquidity lock verification
// 🔴 BEP-20 compliance and hidden functions
// 🟡 Fee-on-transfer token analysis
// 🟡 Anti-bot mechanism review
// 🟢 Router approval safety check`,
    howToFix: "Paste your BSC contract code for instant analysis. Our AI is trained on thousands of BSC-specific scams and vulnerabilities.",
    relatedSlugs: ["smart-contract-scanner", "token-contract-checker", "solidity-auditor"],
  },
  {
    slug: "polygon-security-scanner",
    category: "tools",
    title: "Polygon Contract Scanner — Matic Network Security Tool",
    h1: "Polygon Smart Contract Scanner",
    metaDescription: "Security analysis for Polygon smart contracts. Detect vulnerabilities in your Matic network deployments with AI-powered analysis tuned for L2 patterns.",
    keywords: ["polygon scanner", "matic contract audit", "polygon security", "l2 contract scanner", "polygon vulnerability"],
    severity: "info",
    whatIsIt: "AetherGuard's Polygon Scanner analyzes contracts deployed on Polygon PoS and zkEVM. It checks for L2-specific issues including bridge interaction vulnerabilities, gas price manipulation on L2, and cross-chain message handling flaws unique to Polygon's architecture.",
    whyItMatters: "Polygon's growing DeFi ecosystem means more contracts with potential vulnerabilities. L2-specific attack vectors like sequencer manipulation and bridge exploits require specialized analysis that generic scanners don't provide.",
    example: `// Polygon-specific analysis:
// 🔍 L2 bridge interaction safety
// 🔍 Cross-chain reentrancy detection
// 🔍 Gas price assumption validation
// 🔍 Checkpointing mechanism review
// 🔍 Polygon-specific ERC standards check`,
    howToFix: "Paste your Polygon contract code for comprehensive security analysis optimized for the Polygon L2 environment.",
    relatedSlugs: ["smart-contract-scanner", "defi-security-suite", "solidity-auditor"],
  },
  {
    slug: "arbitrum-contract-audit",
    category: "tools",
    title: "Arbitrum Contract Audit — L2 Security Analysis Tool",
    h1: "Arbitrum Smart Contract Audit",
    metaDescription: "Audit Arbitrum smart contracts for L2-specific vulnerabilities. Detect sequencer dependencies, delayed inbox exploits, and Nitro-specific security issues.",
    keywords: ["arbitrum audit", "arbitrum security", "l2 audit tool", "nitro contract scan", "arbitrum vulnerability"],
    severity: "info",
    whatIsIt: "AetherGuard's Arbitrum Auditor targets Layer 2-specific security concerns: sequencer dependency analysis, delayed inbox message handling, L1-to-L2 retryable ticket vulnerabilities, gas estimation differences, and ArbOS-specific patterns.",
    whyItMatters: "Arbitrum hosts billions in TVL across DeFi protocols. L2-specific assumptions about gas costs, block timing, and sequencer behavior can introduce vulnerabilities that don't exist on L1.",
    example: `// Arbitrum-specific checks:
// ⚠️ Sequencer dependency risk assessment
// ⚠️ L1-L2 message handling safety
// ⚠️ Gas estimation accuracy
// ⚠️ Block number vs L1 block number confusion
// ⚠️ Retryable ticket edge cases`,
    howToFix: "Upload your Arbitrum contracts for an L2-aware security assessment. We check for issues specific to Arbitrum's optimistic rollup architecture.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "defi-security-suite"],
  },
  {
    slug: "solana-security-scanner",
    category: "tools",
    title: "Solana Program Security Scanner — Rust Smart Contract Auditor",
    h1: "Solana Program Security Scanner",
    metaDescription: "Analyze Solana programs for security vulnerabilities. Detect missing signer checks, PDA seed collisions, and account validation issues in Anchor/Native Rust programs.",
    keywords: ["solana security scanner", "solana audit", "anchor vulnerability", "solana program exploit", "rust smart contract security"],
    severity: "info",
    whatIsIt: "AetherGuard's Solana Scanner detects vulnerabilities specific to the Solana programming model: missing signer checks, PDA seed collisions, account data matching failures, CPI (Cross-Program Invocation) exploits, and owner validation issues in both Anchor and native Rust programs.",
    whyItMatters: "Solana's account-based model has fundamentally different security concerns from EVM chains. Missing account checks, type cosplay attacks, and PDA exploitation have led to hundreds of millions in losses across Solana DeFi.",
    example: `// Solana-specific vulnerabilities we detect:
// 🔴 Missing signer checks
// 🔴 PDA seed collision / manipulation
// 🔴 Account type confusion (cosplay)
// 🟡 Unvalidated account ownership
// 🟡 Arithmetic overflow (no built-in check in Rust)
// 🟡 CPI privilege escalation`,
    howToFix: "Paste your Solana Rust code or Anchor program. Get instant analysis of Solana-specific vulnerabilities with detailed fix suggestions.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "defi-security-suite"],
  },
  {
    slug: "vyper-contract-scanner",
    category: "tools",
    title: "Vyper Contract Scanner — Python Smart Contract Auditor",
    h1: "Vyper Smart Contract Scanner",
    metaDescription: "Security analysis for Vyper smart contracts. Detect reentrancy, compiler bugs, and Vyper-specific vulnerabilities in your Python-like smart contracts.",
    keywords: ["vyper scanner", "vyper audit", "vyper vulnerability", "python smart contract security", "vyper reentrancy"],
    severity: "info",
    whatIsIt: "AetherGuard's Vyper Scanner is tailored for Vyper smart contracts. It detects Vyper-specific vulnerabilities including compiler bugs (like the Curve exploit), reentrancy in nonreentrant-decorated functions, and Vyper's unique storage layout and type system issues.",
    whyItMatters: "The Curve Finance exploit in July 2023 was caused by a Vyper compiler reentrancy bug affecting versions 0.2.15-0.3.0. Vyper code requires specialized analysis that Solidity-focused tools miss entirely.",
    example: `// Vyper-specific checks:
// 🔴 Vyper compiler version vulnerabilities
// 🔴 @nonreentrant decorator bypass (pre-0.3.1)
// 🟡 Default function handling differences
// 🟡 Storage layout assumptions
// 🟢 Type safety validation`,
    howToFix: "Paste your Vyper contract code for comprehensive analysis. We check for Vyper-specific compiler bugs and language-level vulnerabilities.",
    relatedSlugs: ["smart-contract-scanner", "reentrancy-checker", "defi-security-suite"],
  },
  {
    slug: "smart-contract-fuzzer",
    category: "tools",
    title: "Smart Contract Fuzzer — Automated Property Testing",
    h1: "Smart Contract Fuzz Testing Tool",
    metaDescription: "Automated fuzz testing for smart contracts. Generate random inputs to discover edge cases, invariant violations, and unexpected behaviors in your Solidity code.",
    keywords: ["smart contract fuzzer", "fuzz testing solidity", "invariant testing", "automated testing blockchain", "echidna alternative"],
    severity: "info",
    whatIsIt: "AetherGuard's Fuzzer generates thousands of randomized test inputs to probe your contract's behavior. It discovers edge cases in arithmetic, boundary conditions in access control, and invariant violations that unit tests miss. Think of it as hiring 1000 QA engineers simultaneously.",
    whyItMatters: "Manual testing covers only happy paths. Fuzzing discovers the unexpected: what happens with zero amounts, max uint values, empty arrays, or combinations of function calls that nobody anticipated. It's the only way to find bugs you didn't think to test for.",
    example: `// Fuzzing finds bugs like:
// ❌ Deposit 0 tokens → get 1 share (rounding)
// ❌ MAX_UINT overflow in unchecked blocks
// ❌ Empty array causes division by zero
// ❌ Re-entrant call sequence breaks invariant
// ❌ Specific timestamp triggers edge case`,
    howToFix: "Upload your contract and define invariants (e.g., 'total shares must equal total deposits'). Our fuzzer will generate millions of inputs to try to break them.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "gas-optimizer"],
  },
  {
    slug: "upgrade-safety-checker",
    category: "tools",
    title: "Upgrade Safety Checker — Validate Proxy Contract Upgrades",
    h1: "Proxy Upgrade Safety Checker",
    metaDescription: "Verify that your proxy contract upgrade is safe. Check storage layout compatibility, initializer requirements, and function selector conflicts before deploying.",
    keywords: ["upgrade safety", "proxy upgrade checker", "storage layout check", "safe upgrade", "openzeppelin upgrade"],
    severity: "info",
    whatIsIt: "AetherGuard's Upgrade Safety Checker compares your old and new implementation contracts to verify storage layout compatibility. It catches storage collisions, removed variables, changed types, and missing storage gaps that would corrupt data on upgrade.",
    whyItMatters: "A single storage layout mistake during a proxy upgrade can corrupt user balances, lock funds permanently, or hand ownership to an attacker. This tool prevents those disasters by validating compatibility before deployment.",
    example: `// We check for upgrade safety issues:
// 🔴 Storage variable reordering
// 🔴 Changed variable types (uint256 → uint128)
// 🔴 Removed storage variables
// 🟡 Missing __gap storage slots
// 🟡 New immutable variables in V2
// 🟢 Safe additions at end of storage`,
    howToFix: "Paste both your current implementation and the new version. We'll validate storage compatibility and flag any breaking changes before you deploy.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "defi-security-suite"],
  },
  {
    slug: "access-control-analyzer",
    category: "tools",
    title: "Access Control Analyzer — Map Contract Permissions",
    h1: "Smart Contract Access Control Analyzer",
    metaDescription: "Visualize and audit access control in your smart contracts. Map all privileged functions, identify missing modifiers, and verify role hierarchies.",
    keywords: ["access control analyzer", "permission audit", "privilege analysis", "modifier checker", "role mapping tool"],
    severity: "info",
    whatIsIt: "AetherGuard's Access Control Analyzer maps every function in your contract by its access level: public unrestricted, owner-only, role-based, or internally restricted. It identifies functions that should be restricted but aren't, and visualizes the complete permission hierarchy.",
    whyItMatters: "Missing access control is the #1 cause of contract takeovers. Our analyzer gives you a complete map of who can call what, making it impossible to accidentally deploy a function without the proper modifier.",
    example: `// Access control map output:
// 🔴 withdraw() — PUBLIC (should be onlyOwner?)
// 🔴 setPrice() — PUBLIC (missing modifier)
// 🟢 mint() — onlyRole(MINTER_ROLE)
// 🟢 pause() — onlyOwner
// 🟢 transfer() — PUBLIC (intended)`,
    howToFix: "Paste your contract to generate a complete access control map. We highlight every function that has weaker access control than similar functions in audited contracts.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "defi-security-suite"],
  },
  {
    slug: "slither-alternative",
    category: "tools",
    title: "Slither Alternative — AI-Enhanced Static Analysis",
    h1: "AetherGuard: AI Static Analysis",
    metaDescription: "A modern alternative to Slither static analysis. AetherGuard combines traditional pattern detection with deep learning for fewer false positives and deeper vulnerability detection.",
    keywords: ["slither alternative", "static analysis solidity", "smart contract linter", "solidity static analyzer", "better than slither"],
    severity: "info",
    whatIsIt: "AetherGuard improves on traditional static analyzers like Slither by combining pattern matching with deep learning. Our AI model understands code semantics — it knows when a potential reentrancy is safely guarded vs actually exploitable, drastically reducing false positives.",
    whyItMatters: "Slither is powerful but generates many false positives, causing alert fatigue. AetherGuard's AI contextualizes each finding, scoring confidence and providing actionable fix suggestions instead of generic warnings.",
    example: `// AetherGuard vs Traditional Static Analysis:
// ✅ 60% fewer false positives
// ✅ Semantic understanding of guard patterns
// ✅ DeFi-specific vulnerability detection
// ✅ AI-generated fix suggestions
// ✅ No setup required — runs in browser`,
    howToFix: "Paste your Solidity code for instant AI-powered static analysis. No installation, no configuration, no CLI — just results.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "reentrancy-checker"],
  },
  {
    slug: "mythril-alternative",
    category: "tools",
    title: "Mythril Alternative — Fast Symbolic Execution Analysis",
    h1: "AetherGuard: Modern Mythril Alternative",
    metaDescription: "Faster and more accurate than Mythril for smart contract security analysis. Get instant symbolic execution results with AI-enhanced vulnerability classification.",
    keywords: ["mythril alternative", "symbolic execution solidity", "formal verification", "smart contract verification", "mythx alternative"],
    severity: "info",
    whatIsIt: "AetherGuard provides the deep analysis capabilities of symbolic execution tools like Mythril, but with dramatically faster execution and AI-powered result interpretation. We find the same critical bugs in seconds instead of minutes.",
    whyItMatters: "Mythril's thorough analysis comes at the cost of speed — a complex contract can take 30+ minutes. AetherGuard achieves comparable detection rates in under 30 seconds by combining targeted analysis with trained heuristics.",
    example: `// Comparison:
// 🚀 AetherGuard: 15 seconds average scan time
// 🐌 Mythril: 10-30 minutes average scan time
// ✅ Both detect: reentrancy, overflow, access control
// ✅ AetherGuard adds: DeFi-specific, AI-scored findings
// ✅ No Docker/CLI setup required`,
    howToFix: "Paste your contract for instant analysis. No Docker, no Python environment, no CLI commands — just paste and scan.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "slither-alternative"],
  },
  {
    slug: "hardhat-security-plugin",
    category: "tools",
    title: "Hardhat Security Plugin — CI/CD Contract Scanning",
    h1: "Hardhat Security Integration",
    metaDescription: "Integrate AetherGuard security scanning into your Hardhat development workflow. Automate vulnerability detection in CI/CD pipelines for every commit.",
    keywords: ["hardhat security", "hardhat plugin audit", "ci cd smart contract", "automated security testing", "hardhat vulnerability"],
    severity: "info",
    whatIsIt: "AetherGuard integrates with Hardhat through our API to provide automated security scanning in your development workflow. Run security checks on every compile, get instant feedback in your terminal, and block deployments with critical vulnerabilities.",
    whyItMatters: "Security should be part of the development cycle, not an afterthought. Catching vulnerabilities at compile-time is 100x cheaper than finding them after deployment. Our Hardhat integration makes security checks automatic.",
    example: `// Integrate into your Hardhat config:
// hardhat.config.ts
import "@aetherguard/hardhat-plugin";

// Run after every compile:
// npx hardhat compile
// → AetherGuard scan results inline
// → Critical issues block compilation
// → Warnings logged with fix suggestions`,
    howToFix: "Add AetherGuard to your Hardhat project for automated security scanning on every compilation. Integrates with GitHub Actions and GitLab CI.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "smart-contract-fuzzer"],
  },
  {
    slug: "foundry-security-tool",
    category: "tools",
    title: "Foundry Security Tool — Forge Test Security Extension",
    h1: "Foundry Security Testing Tool",
    metaDescription: "Enhance your Foundry test suite with AetherGuard security testing. Run vulnerability detection alongside forge test for comprehensive smart contract security.",
    keywords: ["foundry security", "forge test security", "foundry audit", "forge vulnerability", "foundry security plugin"],
    severity: "info",
    whatIsIt: "AetherGuard's Foundry integration adds security testing to your Forge workflow. Write security-focused tests, run invariant checks, and get AI-powered vulnerability analysis alongside your existing test suite.",
    whyItMatters: "Foundry is the fastest-growing development framework for Solidity. Integrating security scanning directly into forge test ensures that every test run includes vulnerability detection, catching bugs before they reach production.",
    example: `// Use with Foundry:
// forge test --security
// → Runs standard tests
// → AetherGuard scans compiled contracts
// → Reports vulnerabilities by severity
// → Suggests invariant tests for detected risks`,
    howToFix: "Integrate AetherGuard into your Foundry project. Security scanning runs alongside your existing forge tests with zero configuration.",
    relatedSlugs: ["smart-contract-scanner", "smart-contract-fuzzer", "hardhat-security-plugin"],
  },
  {
    slug: "solidity-visual-debugger",
    category: "tools",
    title: "Solidity Visual Debugger — Trace Transaction Logic",
    h1: "Visual Smart Contract Debugger",
    metaDescription: "Debug Solidity transactions with a visual trace. See storage changes, stack state, and call flow in a user-friendly interface.",
    keywords: ["solidity debugger", "visual debugger", "contract tracer", "transaction debugger", "solidity debug tool"],
    severity: "info",
    whatIsIt: "AetherGuard's Visual Debugger provides a step-by-step trace of your contract's execution. It visualizes the EVM stack, memory, and storage changes, making it easy to see exactly where logic fails or state corruption occurs.",
    whyItMatters: "Debugging raw transaction traces is difficult and error-prone. A visual interface allows developers to 'see' the code execute, drastically reducing the time required to find and fix complex logic bugs.",
    example: `// Debugger features:
// 🔍 Step-by-step instruction execution
// 📊 Real-time storage slot visualization
// 📞 External call tree mapping
// ⚠️ Opcode-level error highlighting
// 💾 Memory & Stack inspect mode`,
    howToFix: "Paste a transaction hash or run a local simulation to start debugging. Use the visual playback to step through your contract's logic.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "slither-alternative"],
  },
  {
    slug: "gas-fee-estimator",
    category: "tools",
    title: "Gas Fee Estimator — Real-time Transaction Costs",
    h1: "Smart Contract Gas Estimator",
    metaDescription: "Estimate precise gas costs for your contract deployments and functions. Get real-time cost analysis across Ethereum, BSC, Polygon, and L2s.",
    keywords: ["gas estimator", "contract gas cost", "deployment fee", "gas calculator", "eth gas tool"],
    severity: "info",
    whatIsIt: "AetherGuard's Gas Estimator provides precise USD and native token estimates for contract deployments and specific function calls. It accounts for current network congestion, base fees, and priority tips across all supported chains.",
    whyItMatters: "Gas price spikes can make deployments 10x more expensive in minutes. Our estimator helps you pick the optimal time to deploy and provides a clear breakdown of where gas is being spent (execution vs storage).",
    example: `// Estimate costs for:
// 🚀 Initial Contract Deployment
// 🔄 Complex State Updates
// 🌉 Bridge Transfers
// 🗳️ Governance Votes
// 💰 Bulk Token Distributions`,
    howToFix: "Enter your contract address or upload code. We'll simulate execution and provide a detailed cost breakdown based on current network prices.",
    relatedSlugs: ["gas-optimizer", "smart-contract-scanner", "defi-security-suite"],
  },
  {
    slug: "abi-decoder-online",
    category: "tools",
    title: "Online ABI Decoder — Inspect Transaction Data",
    h1: "Smart Contract ABI Decoder",
    metaDescription: "Decode raw transaction input data and event logs instantly. Convert hex data into human-readable function calls and parameters.",
    keywords: ["abi decoder", "decode transaction data", "hex to human readable", "event log decoder", "solidity abi tool"],
    severity: "info",
    whatIsIt: "AetherGuard's ABI Decoder translates raw hexagonal transaction data and event logs into human-readable format. Just paste your ABI and the data to see exactly which functions were called and what parameters were passed.",
    whyItMatters: "Block explorers don't always show decoded data for unverified contracts. Our tool lets you inspect any transaction data manually, helping you audit interactions with opaque or suspicious contracts.",
    example: `// Decode any hex data:
// Input: 0xa9059cbb...
// → Function: transfer(address,uint256)
// → To: 0x123...
// → Amount: 1,500.00 Token`,
    howToFix: "Paste your contract ABI and the hex data you want to decode. We'll provide a formatted view of all function calls and arguments.",
    relatedSlugs: ["smart-contract-scanner", "token-contract-checker", "solidity-auditor"],
  },
  {
    slug: "multi-sig-safety-checker",
    category: "tools",
    title: "Multi-Sig Safety Checker — Verify Owner Permissions",
    h1: "Multi-Sig Security Analyzer",
    metaDescription: "Audit the security of your Gnosis Safe or multi-sig wallet. Check owner distribution, threshold safety, and recovery mechanisms.",
    keywords: ["multi-sig safety", "gnosis safe audit", "wallet security", "owner management", "multisig checker"],
    severity: "info",
    whatIsIt: "AetherGuard's Multi-Sig Checker analyzes the configuration of your shared wallets. It flags dangerous setups like too few owners, centralized control, or un-removed former admin addresses.",
    whyItMatters: "Many protocols are hijacked not via code, but via compromised multi-sig owners. Regularly auditing who has power over your protocol's treasury and upgrade keys is the most basic security requirement.",
    example: `// Multi-sig security report:
// ⚠️ Warning: 1/3 threshold is too low
// ⚠️ Warning: Same owner controlled 2 keys
// ✅ Correct: Owners are geographically distributed
// ✅ Correct: No owner has >1 active key`,
    howToFix: "Connect your multi-sig or paste the address to receive a security configuration report and best-practice recommendations.",
    relatedSlugs: ["access-control-analyzer", "solidity-auditor", "defi-security-suite"],
  },
  {
    slug: "testnet-token-faucet",
    category: "tools",
    title: "Testnet Faucet Pool — Get Free Development Tokens",
    h1: "Universal Testnet Faucet",
    metaDescription: "Get free Sepolia, Goerli, Mumbai, and BSC Testnet tokens for smart contract development and security testing.",
    keywords: ["testnet faucet", "free eth", "sepolia faucet", "mumbai faucet", "development tokens"],
    severity: "info",
    whatIsIt: "AetherGuard's Testnet Faucet provides developers with the essential tokens needed to deploy and test contracts on public testnets. We support all major EVM networks including Ethereum L2s.",
    whyItMatters: "Finding reliable faucets can be time-consuming. We provide a single, reliable source for testnet funds, allowing you to focus on building and auditing your code rather than hunting for gas.",
    example: `// Supported Networks:
// 💎 Sepolia (Ethereum)
// 🟣 Mumbai (Polygon)
// 🟡 BSC Testnet
// 🔵 Arbitrum Goerli
// 🔴 Optimism Goerli`,
    howToFix: "Connect your wallet and solve the captcha to receive testnet funds instantly. Limits apply per account to prevent abuse.",
    relatedSlugs: ["smart-contract-scanner", "hardhat-security-plugin", "foundry-security-tool"],
  },
  {
    slug: "solidity-decompiler-pro",
    category: "tools",
    title: "Solidity Bytecode Decompiler — Inspect Verified Apps",
    h1: "EVM Bytecode Decompiler",
    metaDescription: "Decompile raw EVM bytecode into Solidity-like source code. Audit unverified contracts and understand the logic of any deployed dApp.",
    keywords: ["solidity decompiler", "bytecode to source", "evm decompiler", "reverse engineer contract", "unverified scanner"],
    severity: "info",
    whatIsIt: "AetherGuard's Decompiler takes deployment bytecode and reconstructs the original logic. While variable names are lost, the function structures, external calls, and storage mappings remain, allowing for deep security analysis of unverified contracts.",
    whyItMatters: "Malicious actors often leave contracts unverified to hide backdoors. Decompilation is the only way to see what's happening 'under the hood' of a suspicious token or dApp before interacting.",
    example: `// Decompilation output:
// function 0x41234123() external {
//   if (msg.sender == storage[0]) {
//     selfdestruct(msg.sender)
//   }
// }`,
    howToFix: "Paste the contract address or raw bytecode. We'll generate a Solidity-like abstraction of the code for your internal review.",
    relatedSlugs: ["smart-contract-scanner", "token-contract-checker", "solidity-auditor"],
  },
  {
    slug: "smart-contract-audit-checklist",
    category: "tools",
    title: "Smart Contract Audit Checklist — Pre-Audit Prep",
    h1: "Developer's Security Checklist",
    metaDescription: "A comprehensive checklist to prepare your smart contracts for a professional audit. Catch common bugs and optimize code quality.",
    keywords: ["audit checklist", "solidity best practices", "contract security checklist", "audit prep", "developer security"],
    severity: "info",
    whatIsIt: "AetherGuard's Checklist is a curated list of manual checks and automated tests that every project should pass before hiring a professional auditor. It covers everything from reentrancy to documentation requirements.",
    whyItMatters: "Most audit findings are for avoidable, common mistakes. Following this checklist ensures your professional audit focuses on complex, high-level logic rather than simple bugs, giving you better value for your money.",
    example: `// Essential checks:
// 🗳️ 100% Test Coverage reached?
// 🔒 Access control on sensitive functions?
// 🧪 Fuzz testing completed?
// 📝 Dynamic documentation updated?
// 🔧 Gas optimizations applied?`,
    howToFix: "Follow the itemized list in our dashboard and mark them off as you prepare your codebase for public release or professional review.",
    relatedSlugs: ["smart-contract-scanner", "solidity-auditor", "defi-security-suite"],
  },
];

// ─────────────────────────────────────────────────
//  COMBINED EXPORT
// ─────────────────────────────────────────────────

export const ALL_SEO_PAGES: SEOPage[] = [...auditPages, ...toolsPages];

export function getPageBySlug(slug: string): SEOPage | undefined {
  return ALL_SEO_PAGES.find((p) => p.slug === slug);
}

export function getPagesByCategory(category: PageCategory): SEOPage[] {
  return ALL_SEO_PAGES.filter((p) => p.category === category);
}

export function getRelatedPages(page: SEOPage): SEOPage[] {
  return page.relatedSlugs
    .map((s) => getPageBySlug(s))
    .filter(Boolean) as SEOPage[];
}
