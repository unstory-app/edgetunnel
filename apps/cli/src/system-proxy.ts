import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PROXY_HOST, PROXY_PORT } from "./constants";

const execFileAsync = promisify(execFile);

type ProxySnapshot = {
    platform: NodeJS.Platform;
    values: Record<string, string>;
};

async function tryExec(file: string, args: string[]): Promise<string> {
    const { stdout } = await execFileAsync(file, args);
    return stdout;
}

export async function captureProxySettings(): Promise<ProxySnapshot> {
    const platform = process.platform;

    if (platform === "darwin") {
        const services = await tryExec("networksetup", ["-listallnetworkservices"]);
        return { platform, values: { services } };
    }

    if (platform === "win32") {
        const result = await tryExec("reg", ["query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"]);
        return { platform, values: { registry: result } };
    }

    return {
        platform,
        values: {
            HTTP_PROXY: process.env.HTTP_PROXY ?? "",
            HTTPS_PROXY: process.env.HTTPS_PROXY ?? "",
        },
    };
}

export async function configureSystemProxy(): Promise<void> {
    const platform = process.platform;

    if (platform === "darwin") {
        const raw = await tryExec("networksetup", ["-listallnetworkservices"]);
        const services = raw
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("An asterisk"));

        await Promise.all(
            services.map(async (service) => {
                await tryExec("networksetup", ["-setwebproxy", service, PROXY_HOST, String(PROXY_PORT)]);
                await tryExec("networksetup", ["-setsecurewebproxy", service, PROXY_HOST, String(PROXY_PORT)]);
                await tryExec("networksetup", ["-setwebproxystate", service, "on"]);
                await tryExec("networksetup", ["-setsecurewebproxystate", service, "on"]);
            }),
        );
        return;
    }

    if (platform === "win32") {
        await tryExec("reg", [
            "add",
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
            "/v",
            "ProxyEnable",
            "/t",
            "REG_DWORD",
            "/d",
            "1",
            "/f",
        ]);
        await tryExec("reg", [
            "add",
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
            "/v",
            "ProxyServer",
            "/t",
            "REG_SZ",
            "/d",
            `${PROXY_HOST}:${PROXY_PORT}`,
            "/f",
        ]);
        return;
    }

    process.env.HTTP_PROXY = `http://${PROXY_HOST}:${PROXY_PORT}`;
    process.env.HTTPS_PROXY = `http://${PROXY_HOST}:${PROXY_PORT}`;
}

export async function restoreSystemProxy(snapshot?: ProxySnapshot): Promise<void> {
    const platform = process.platform;

    if (platform === "darwin") {
        const raw = snapshot?.values.services ?? (await tryExec("networksetup", ["-listallnetworkservices"]));
        const services = raw
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("An asterisk"));

        await Promise.all(
            services.map(async (service) => {
                await tryExec("networksetup", ["-setwebproxystate", service, "off"]);
                await tryExec("networksetup", ["-setsecurewebproxystate", service, "off"]);
            }),
        );
        return;
    }

    if (platform === "win32") {
        await tryExec("reg", [
            "add",
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
            "/v",
            "ProxyEnable",
            "/t",
            "REG_DWORD",
            "/d",
            "0",
            "/f",
        ]);
        return;
    }

    process.env.HTTP_PROXY = snapshot?.values.HTTP_PROXY ?? "";
    process.env.HTTPS_PROXY = snapshot?.values.HTTPS_PROXY ?? "";
}
