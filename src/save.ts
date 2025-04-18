import * as core from "@actions/core";
import { Input, State } from "./constants";
import * as conan from "./conan";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function post(): Promise<void> {
    try {
        const appendTimestamp = core.getBooleanInput(Input.AppendTimestamp);
        const primaryCacheHit = core.getState(State.PrimaryCacheHit);
        if (JSON.parse(primaryCacheHit) && !appendTimestamp) {
            core.info("Cache hit on primary key. Cache will not be saved");
        } else if (!core.getBooleanInput(Input.SaveCache)) {
            core.info("Cache saving deactivated");
        } else {
            core.startGroup("Saving cache");
            let key = core.getState(State.CacheKey);
            if (appendTimestamp) {
                key = `${key}-${Date.now()}`;
            }
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
