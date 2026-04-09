import { writeFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PID_PATH, PROXY_HOST, PROXY_PORT } from "./constants";
import { startProxyServer } from "./proxy-server";
import { readState } from "./state";

export async function runDaemon(): Promise<void> {
    const state = await readState();
    if (!state) {
        throw new Error("Missing state file. Run edgetunnel start first.");
    }

    const server = await startProxyServer({
        host: PROXY_HOST,
        port: PROXY_PORT,
        workerProxyUrl: state.workerProxyUrl,
        apiKey: state.apiKey,
        signingSecret: state.signingSecret,
    });

    mkdirSync(dirname(PID_PATH), { recursive: true });
    await writeFile(PID_PATH, String(process.pid), "utf8");

    const shutdown = async (): Promise<void> => {
        await new Promise<void>((resolve) => server.close(() => resolve()));
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
