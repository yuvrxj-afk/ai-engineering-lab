import Anthropic from "@anthropic-ai/sdk";

export const tools: Anthropic.Messages.Tool[] = [{
    name: "analyze_transaction",
    description: "Analyze a crypto transaction and return structured insights",
    input_schema: {
        type: "object",
        properties: {
            action: {
                type: "string",
                enum: ["swap", "transfer", "stake", "approve", "unknown"],
            },
            protocol: { type: "string" },
            asset_in: { type: "string" },
            asset_out: { type: "string" },
            risk_flags: {
                type: "array",
                items: { type: "string" },
            },
        },
        required: ["action", "protocol", "asset_in", "asset_out", "risk_flags"],
    },
}
]