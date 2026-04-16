export interface GoldenCase {
    id: string;
    query: string;
    relevantDocIds: string[];
}

export const GOLDEN_SET: GoldenCase[] = [
    {
        id: "q-defi-swaps",
        query: "how do decentralized token swaps work?",
        relevantDocIds: ["defi-uniswap", "defi-liquidity"],
    },
    {
        id: "q-transaction-costs",
        query: "what are the costs of sending a transaction?",
        relevantDocIds: ["defi-gas"],
    },
    {
        id: "q-france-landmark",
        query: "tall landmark in France",
        relevantDocIds: ["history-eiffel"],
    },
];
