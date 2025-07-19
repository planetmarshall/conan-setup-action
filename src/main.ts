import * as core from "@actions/core";
import { Input, State, InstallOptions } from "./constants";
import {
    Conan,
    install,
    get_lockfile_hash,
    lockfile_path_or_null,
} from "./conan";
import * as io from "@actions/io";
import { get_latest_version } from "./version";
import * as path from "node:path";

/**
 * Installs conan using the requested options
 */
async function install_conan(): Promise<Conan> {
    const conan_path = await io.which("conan");
    const has_conan = conan_path.length != 0;
    let version_option = core.getInput(Input.Version);

    if (has_conan) {
        const conan = new Conan(conan_path);
        const installed_version = await conan.version();
        core.debug(
            `conan version ${installed_version.toString()} already installed`,
        );

        if (version_option == InstallOptions.Latest) {
            const latest_version = await get_latest_version();
            core.debug(
                `conan version ${latest_version.toString()} is available`,
            );
            if (latest_version != installed_version) {
                return await install(InstallOptions.Latest);
            }
        } else if (version_option != InstallOptions.Auto) {
            if (version_option != installed_version.toString()) {
                return await install(version_option);
            }
        }
    } else {
        if (version_option == InstallOptions.Auto) {
            version_option = InstallOptions.Latest;
        }
        return await install(version_option);
    }
    return new Conan(conan_path);
}

async function configure_conan(conan: Conan): Promise<void> {
    const configPath = core.getInput(Input.ConfigPath);
    if (configPath.length > 0) {
        core.debug(`installing configuration from ${configPath}`);
        await conan.install_config(configPath);
    }
    const profiles = await conan.installed_profiles();
    if (!profiles.includes("default")) {
        await conan.detect_default_profile();
    }
    const remotes = core.getMultilineInput(Input.RemotePatterns);
    if (remotes.length > 0) {
        await conan.authorize_remotes(remotes);
    }
}

async function restore_cache(conan: Conan): Promise<void> {
    const lockfile_path = await lockfile_path_or_null(
        core.getInput(Input.Lockfile),
    );
    const lockfile_hash =
        lockfile_path != null ? await get_lockfile_hash(lockfile_path) : null;

    if (lockfile_hash != null) {
        core.info(
            `lockfile found at '${lockfile_path}' - appending hash to key`,
        );
    }

    const key = await conan.cache_key(
        core.getMultilineInput(Input.HostProfiles),
        lockfile_hash,
    );
    const primaryCacheHit = await conan.restore_cache(key);

    core.saveState(State.PrimaryCacheHit, primaryCacheHit);
    core.saveState(State.CacheKey, key);
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run(): Promise<void> {
    try {
        core.startGroup("Install");
        const conan = await install_conan();
        const version = await conan.version();
        core.info(`conan version ${version.toString()} installed`);
        core.addPath(path.dirname(conan.path));
        core.saveState(State.ConanPath, conan.path);
        core.endGroup();

        core.startGroup("Configure");
        await configure_conan(conan);
        core.endGroup();

        if (core.getBooleanInput(Input.CacheEnabled)) {
            core.startGroup("Restoring Cache");
            await restore_cache(conan);
            core.endGroup();
        } else {
            core.info("Github cache is disabled");
        }
    } catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) core.setFailed(error.message);
    }
}

run();
