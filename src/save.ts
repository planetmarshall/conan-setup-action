import * as core from "@actions/core";
import * as conan from "./conan";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function post(): Promise<void> {
    try {
        const key = await conan.cache_key();
        core.debug(`Saving cache with key: ${key}`);
        await conan.save_cache(key);
    } catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) core.setFailed(error.message);
    }
}

post();
