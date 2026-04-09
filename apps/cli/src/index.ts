#!/usr/bin/env node
import { readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import process from "node:process";
import { Command } from "commander";
import { DEFAULT_WORKER_PROXY_URL, PID_PATH } from "./constants";
import { runDaemon } from "./daemon";
import { readState, writeState } from "./state";
import { captureProxySettings, configureSystemProxy, restoreSystemProxy } from "./system-proxy";

async function readPid(): Promise<number | null> {
    try {
        const raw = await readFile(PID_PATH, "utf8");
        return Number(raw);
    } catch {
        return null;
    }
}

function isRunning(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

async function startCommand(opts: { apiKey: string; workerUrl: string; signingSecret: string }): Promise<void> {
    const existingPid = await readPid();
    if (existingPid && isRunning(existingPid)) {
        console.log(`EdgeTunnel is already running (pid ${existingPid}).`);
        return;
    }

    const previousProxy = await captureProxySettings();
    await configureSystemProxy();

    await writeState({
        apiKey: opts.apiKey,
        signingSecret: opts.signingSecret,
        workerProxyUrl: opts.workerUrl,
        previousProxy,
    });

    const child = spawn(process.execPath, [new URL(import.meta.url).pathname, "daemon"], {
        detached: true,
        stdio: "ignore",
    });

    child.unref();
    console.log("EdgeTunnel started. System proxy points to 127.0.0.1:8787.");
}

async function stopCommand(): Promise<void> {
    const pid = await readPid();
    if (!pid || !isRunning(pid)) {
        console.log("EdgeTunnel is not running.");
        return;
    }

    process.kill(pid, "SIGTERM");
    const state = await readState();
    await restoreSystemProxy(state?.previousProxy as any);
    await rm(PID_PATH, { force: true });
    console.log("EdgeTunnel stopped and system proxy restored.");
}

async function statusCommand(): Promise<void> {
    const pid = await readPid();
    if (!pid || !isRunning(pid)) {
        console.log("EdgeTunnel status: stopped");
        return;
    }

    const state = await readState();
    console.log(`EdgeTunnel status: running (pid ${pid})`);
    if (state) {
        console.log(`Upstream: ${state.workerProxyUrl}`);
    }
}

async function main(): Promise<void> {
    mkdirSync(dirname(PID_PATH), { recursive: true });

    const program = new Command()
        .name("edgetunnel")
        .description("One-command local proxy tunnel through Cloudflare Worker edge routing")
        .version("0.1.0");

    program
        .command("start")
        .requiredOption("--api-key <key>", "EdgeTunnel API key")
        .requiredOption("--signing-secret <secret>", "Shared request signing secret")
        .option("--worker-url <url>", "Worker /proxy endpoint", DEFAULT_WORKER_PROXY_URL)
        .action(startCommand);

    program.command("stop").action(stopCommand);
    program.command("status").action(statusCommand);
    program.command("daemon").action(runDaemon);

    await program.parseAsync(process.argv);
}

void main();
