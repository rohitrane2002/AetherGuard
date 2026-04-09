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
