import { evaluate } from "mathjs";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
    while (true) {

        const res = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content:
                        "You can call tools; use tool results; final answer must be plain text",
                },
                {
                    role: "user",
                    content: "what's the weather in Mumbai and what is 443 * 7?"
                }
            ],
            tools,
            tool_choice: "auto",
            model: "gpt-4.1-mini",
        });

        function calculate(expression: string) {
            return evaluate(expression);
        }

        function get_weather(city: string) {
            return { city, temp_c: 32, condition: "Hazy sunshine" };
        }

        const msg = res.choices[0]?.message
    }
}
main();
