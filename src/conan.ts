import { getExecOutput, exec } from "@actions/exec";
import * as core from "@actions/core";
import * as io from "@actions/io";
import * as cache from "@actions/cache";
import * as utils from "./utils";
import * as fs from "node:fs/promises";
import * as uuid from "uuid";
import { Input, InstallOptions } from "./constants";
import * as os from "node:os";
import { Version, parse_version } from "./version";

function pip_exe(venv: string): string {
    if (core.platform.isWindows) {
        return `${venv}/Scripts/pip`;
    } else {
        return `${venv}/bin/pip`;
    }
}

export async function install(versionOption: string): Promise<Conan> {
    const installDir = `${os.tmpdir()}/${uuid.v4()}/conan-${versionOption}`;
    const pip = pip_exe(installDir);
    await io.mkdirP(installDir);
    core.debug(`Installing python virtualenv to "${installDir}"`);
    await exec("python", ["-m", "venv", installDir], {
        silent: true,
        ignoreReturnCode: false,
    });

    if (versionOption == InstallOptions.Latest) {
        core.info("Installing the latest version");
        await exec(pip, ["install", "conan", "--upgrade"], {
            silent: true,
            ignoreReturnCode: false,
        });
    } else {
        core.info(`Installing version ${versionOption}`);
        await exec(pip, ["install", `conan==${versionOption}`], {
            ignoreReturnCode: false,
        });
    }
    if (core.platform.isWindows) {
        return new Conan(core.toWin32Path(`${installDir}/Scripts/conan`));
    } else {
        return new Conan(`${installDir}/bin/conan`);
    }
}

export async function get_lockfile_hash(
    lockfile_path: string,
): Promise<string> {
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

export function cache_key_from_components(
    version: Version,
    key_suffix: string,
): string {
    return `conan-v${version}-${key_suffix}`;
}

export class Conan {
    readonly path: string;

    constructor(path: string) {
        this.path = path;
    }

    async version(): Promise<Version> {
        const output = await getExecOutput(this.path, ["--version"], {
            silent: true,
            ignoreReturnCode: false,
        });
        return parse_version(output.stdout);
    }

    async install_config(configPath: string): Promise<void> {
        await exec(this.path, ["config", "install", configPath]);
    }

    async authorize_remotes(patterns: string[]): Promise<void> {
        for (const pattern of patterns) {
            await exec(this.path, ["remote", "enable", pattern]);
            await exec(this.path, ["remote", "auth", pattern, "--force"]);
        }
    }

    async detect_default_profile(): Promise<void> {
        await exec(this.path, ["profile", "detect"]);
    }

    async installed_profiles(): Promise<string[]> {
        const output = await getExecOutput(
            this.path,
            ["profile", "list", "--format", "json"],
            { silent: true },
        );
        return JSON.parse(output.stdout);
    }

    async profile_hash(host_profiles: string[]): Promise<string> {
        const host_profile_args = host_profiles.map(
            (pr) => `--profile:host=${pr}`,
            host_profiles,
        );
        const result = await getExecOutput(
            this.path,
            ["profile", "show", "--format", "json"].concat(host_profile_args),
            { silent: true, ignoreReturnCode: true },
        );
        if (result.exitCode != 0) {
            throw new Error(`failed to hash profile: '${result.stderr}'`);
        }
        return utils.json_hash(result.stdout);
    }

    async cache_key(
        host_profiles: string[],
        lockfile_component: string | null = null,
    ): Promise<string> {
        const v = await this.version();
        let key = core.getInput(Input.CacheKey);
        if (key.length == 0) {
            const profile_component = await this.profile_hash(host_profiles);
            if (lockfile_component === null) {
                key = profile_component;
            } else {
                key = `${profile_component}-${lockfile_component}`;
            }
        }
        return cache_key_from_components(v, key);
    }

    async restore_cache(key: string): Promise<boolean> {
        const tempdir = process.env["RUNNER_TEMP"];
        const cacheFile = `${tempdir}/conan-cache.tgz`;
        const cacheHitKey = await cache.restoreCache([cacheFile], key, [key]);
        if (cacheHitKey == null) {
            core.info(`No cache hit found for ${key}`);
            return false;
        } else {
            core.info(`Cache hit on key: ${cacheHitKey}`);
            core.debug(`Restoring cache file to ${cacheFile}`);
            await exec(this.path, ["cache", "restore", cacheFile]);
            return key === cacheHitKey;
        }
    }

    async save_cache(key: string): Promise<void> {
        core.startGroup("prepare the cache file");
        await exec(this.path, ["cache", "clean", "*"]);
        const tempdir = process.env["RUNNER_TEMP"];
        const cacheFile = `${tempdir}/conan-cache.tgz`;
        core.debug(`Writing cache file to ${cacheFile}`);
        await exec(this.path, [
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
}
