import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { STATE_PATH } from "./constants";

export type EdgeTunnelState = {
    workerProxyUrl: string;
    apiKey: string;
    signingSecret: string;
    previousProxy?: unknown;
};

export async function writeState(state: EdgeTunnelState): Promise<void> {
    await mkdir(dirname(STATE_PATH), { recursive: true });
    await writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export async function readState(): Promise<EdgeTunnelState | null> {
    try {
        const raw = await readFile(STATE_PATH, "utf8");
        return JSON.parse(raw) as EdgeTunnelState;
    } catch {
        return null;
    }
}
