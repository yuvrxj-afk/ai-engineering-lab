import type { CorpusDoc } from "../shared/embeddingClient";

export const CORPUS: CorpusDoc[] = [
    {
        id: "defi-uniswap",
        source: "defi-basics.md",
        heading: "Decentralized Exchanges",
        text: "Uniswap is a decentralized exchange for swapping ERC-20 tokens",
    },
    {
        id: "defi-aave",
        source: "defi-basics.md",
        heading: "Lending Protocols",
        text: "Aave lets users lend and borrow crypto assets against collateral",
    },
    {
        id: "defi-liquidity",
        source: "defi-basics.md",
        heading: "Liquidity",
        text: "A liquidity pool holds token pairs used for automated market making",
    },
    {
        id: "defi-slippage",
        source: "defi-basics.md",
        heading: "Trading Mechanics",
        text: "Slippage occurs when the execution price differs from the quoted price",
    },
    {
        id: "defi-gas",
        source: "defi-basics.md",
        heading: "Transaction Costs",
        text: "Gas fees on Ethereum compensate validators for processing transactions",
    },
    {
        id: "history-eiffel",
        source: "general.md",
        heading: "Landmarks",
        text: "The Eiffel Tower was built in Paris in 1889",
    },
    {
        id: "biology-photosynthesis",
        source: "general.md",
        heading: "Biology",
        text: "Photosynthesis converts sunlight into glucose in plant cells",
    },
    {
        id: "tech-typescript",
        source: "general.md",
        heading: "Programming",
        text: "TypeScript adds static types to JavaScript for better tooling",
    },
];
