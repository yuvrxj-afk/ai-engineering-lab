import { config } from "dotenv";
import { resolve } from "node:path";

// In env.ts — at module load time
import { validateEnv } from "./configSchema";
config({ path: resolve(process.cwd(), ".env") });
export const env = validateEnv(); // throws at startup if config broken
