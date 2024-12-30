import * as core from "@actions/core";
import { Constants } from "./constants";
import * as conan from "./conan";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run(): Promise<void> {
    try {
        const version = await conan.version();
        if (version != null) {
            core.info(`conan ${version.toString()} is installed.`);
            const profiles = await conan.installed_profiles();
            if (!profiles.includes("default")) {
                await conan.detect_default_profile();
            }
            core.startGroup("Restoring Cache");
            const key = await conan.cache_key();
            const primaryCacheHit = await conan.restore_cache(key);
            core.saveState(Constants.PrimaryCacheHit, primaryCacheHit);
        } else {
            core.setFailed("conan is not installed.");
        }
    } catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) core.setFailed(error.message);
    }
}

run();
