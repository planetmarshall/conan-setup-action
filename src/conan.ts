import { getExecOutput, exec } from "@actions/exec";
import * as core from "@actions/core";
import { saveCache } from "@actions/cache";
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

export async function conan_version(): Promise<Version | null> {
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

export async function conan_cache_save(key: string): Promise<void> {
    await exec("conan", ["cache", "clean"]);
    await exec("conan", [
        "cache",
        "save",
        "--core-conf",
        "core.gzip:compresslevel=0",
        "*",
    ]);
    const tempdir = process.env["RUNNER_TEMP"];
    const cacheFile = `${tempdir}/conan-cache.tgz`;
    core.debug(`Writing cache file to ${cacheFile}`);
    await saveCache([cacheFile], key);
}
