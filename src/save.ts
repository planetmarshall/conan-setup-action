import * as core from "@actions/core";
import { Constants } from "./constants";
import * as conan from "./conan";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function post(): Promise<void> {
    try {
        const appendTimestamp = core.getBooleanInput(
            Constants.AppendTimestampInput,
        );
        const primaryCacheHit = core.getState(Constants.PrimaryCacheHit);
        if (JSON.parse(primaryCacheHit) && !appendTimestamp) {
            core.info("Cache hit on primary key. Cache will not be saved");
        } else {
            core.startGroup("Saving cache");
            const key = await conan.cache_key(appendTimestamp);
            core.debug(`Saving cache with key: ${key}`);
            await conan.save_cache(key);
            core.endGroup();
        }
        // Explicit process.exit() to not wait for hanging promises,
        // see https://github.com/actions/setup-node/issues/878
        process.exit();
    } catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) core.setFailed(error.message);
    }
}

post();
