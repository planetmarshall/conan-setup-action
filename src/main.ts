import * as core from "@actions/core";
import { Constants } from "./constants";
import * as conan from "./conan";

async function configure_conan(): Promise<void> {
    const configPath = core.getInput(Constants.ConfigPathInput);
    if (configPath.length > 0) {
        core.debug(`installing configuration from ${configPath}`);
        await conan.install_config(configPath);
    }
    const profiles = await conan.installed_profiles();
    if (!profiles.includes("default")) {
        await conan.detect_default_profile();
    }
    const remotes = core.getMultilineInput(Constants.RemotePatternsInput);
    if (remotes.length > 0) {
        await conan.authorize_remotes(remotes);
    }
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run(): Promise<void> {
    try {
        const version = await conan.version();
        if (version == null) {
            core.setFailed("conan is not installed.");
            return;
        }
        core.info(`conan ${version.toString()} is installed.`);

        core.startGroup("Configure");
        await configure_conan();
        core.endGroup();

        core.startGroup("Restoring Cache");
        const key = await conan.cache_key();
        const primaryCacheHit = await conan.restore_cache(key);
        core.saveState(Constants.PrimaryCacheHit, primaryCacheHit);
        core.endGroup();
    } catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) core.setFailed(error.message);
    }
}

run();
