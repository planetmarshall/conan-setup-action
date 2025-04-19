import { getExecOutput, exec } from "@actions/exec";
import * as core from "@actions/core";
import * as cache from "@actions/cache";
import * as utils from "./utils";
import * as fs from "node:fs/promises";
import { Input } from "./constants";

export class Version {
    major: number;
    minor: number;
    patch: number;

    constructor(major: number, minor: number, patch: number) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    toString(): string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }
}

export async function version(): Promise<Version | null> {
    const semverRegex = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/;
    const output = await getExecOutput("conan", ["--version"], {
        silent: true,
    });
    if (output.exitCode != 0) {
        return null;
    }
    const matchResult = output.stdout.match(semverRegex);
    if (matchResult == null) {
        return null;
    }
    return new Version(
        Number.parseInt(matchResult[1]),
        Number.parseInt(matchResult[2]),
        Number.parseInt(matchResult[3]),
    );
}

export async function install_config(configPath: string): Promise<void> {
    await exec("conan", ["config", "install", configPath]);
}

export async function authorize_remotes(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
        await exec("conan", ["remote", "auth", pattern, "--force"]);
    }
}

export async function detect_default_profile(): Promise<void> {
    await exec("conan", ["profile", "detect"]);
}

export async function installed_profiles(): Promise<string[]> {
    const output = await getExecOutput(
        "conan",
        ["profile", "list", "--format", "json"],
        { silent: true },
    );
    return JSON.parse(output.stdout);
}

async function profile_hash(): Promise<string> {
    const result = await getExecOutput(
        "conan",
        ["profile", "show", "--format", "json"],
        { silent: true },
    );
    return utils.json_hash(result.stdout);
}

export async function lockfile_hash(lockfile_path: string): Promise<string> {
    try {
        const lockfile = await fs.readFile(lockfile_path);
        return utils.json_hash(lockfile.toString());
    } catch {
        throw new Error(`lockfile "${lockfile_path}" does not exist`);
    }
}

export async function lockfile_path_or_null(
    lockfile_path: string,
): Promise<string | null> {
    if (lockfile_path.length == 0) {
        try {
            await fs.access("conan.lock", fs.constants.R_OK);
            return "conan.lock";
        } catch {
            // not an error - no lockfile exists but we didn't specifically
            // ask for one.
            return null;
        }
    }
    return lockfile_path;
}

export async function cache_key(
    lockfile_component: string | null = null,
): Promise<string> {
    const v = await version();
    let key = core.getInput(Input.CacheKey);
    if (key.length == 0) {
        const profile_component = await profile_hash();
        if (lockfile_component === null) {
            key = profile_component;
        } else {
            key = `${profile_component}-${lockfile_component}`;
        }
    }
    return cache_key_from_components(v as Version, key);
}

export function cache_key_from_components(
    version: Version,
    key_suffix: string,
): string {
    return `conan-v${version}-${key_suffix}`;
}

export async function restore_cache(key: string): Promise<boolean> {
    const tempdir = process.env["RUNNER_TEMP"];
    const cacheFile = `${tempdir}/conan-cache.tgz`;
    const cacheHitKey = await cache.restoreCache([cacheFile], key, [key]);
    if (cacheHitKey == null) {
        core.info(`No cache hit found for ${key}`);
        return false;
    } else {
        core.info(`Cache hit on key: ${cacheHitKey}`);
        core.debug(`Restoring cache file to ${cacheFile}`);
        await exec("conan", ["cache", "restore", cacheFile]);
        return key === cacheHitKey;
    }
}

export async function save_cache(key: string): Promise<void> {
    core.startGroup("prepare the cache file");
    await exec("conan", ["cache", "clean", "*"]);
    const tempdir = process.env["RUNNER_TEMP"];
    const cacheFile = `${tempdir}/conan-cache.tgz`;
    core.debug(`Writing cache file to ${cacheFile}`);
    await exec("conan", [
        "cache",
        "save",
        "--core-conf",
        // Don't compress the cache file as it will be compressed by ZSTD before upload
        "core.gzip:compresslevel=0",
        "--file",
        cacheFile,
        "*:*",
    ]);
    core.endGroup();
    await cache.saveCache([cacheFile], key);
}
