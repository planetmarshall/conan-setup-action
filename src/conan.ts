import { getExecOutput, exec } from "@actions/exec";
import * as core from "@actions/core";
import * as cache from "@actions/cache";
import * as process from "node:process";

class Version {
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

export async function cache_key(): Promise<string> {
    const v = await version();
    return `conan-${core.platform.platform}-${core.platform.arch}-${v}`;
}

export async function restore_cache(key: string): Promise<void> {
    const tempdir = process.env["RUNNER_TEMP"];
    const cacheFile = `${tempdir}/conan-cache.tgz`;
    const cacheHitKey = await cache.restoreCache([cacheFile], key);
    if (cacheHitKey == null) {
        core.info(`No cache hit found for ${key}`);
    } else {
        core.info(`Cache hit. Restoring cache for key ${cacheHitKey}`);
        core.debug(`Restoring cache file to ${cacheFile}`);
        await exec("conan", ["cache", "restore", cacheFile]);
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
