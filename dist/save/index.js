Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const constants_1 = require("./constants");
const conan_1 = require("./conan");
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function post() {
    try {
        if (!core.getBooleanInput(constants_1.Input.SaveCache) ||
            !core.getBooleanInput(constants_1.Input.CacheEnabled)) {
            core.info("Cache saving deactivated");
            return;
        }
        const appendTimestamp = core.getBooleanInput(constants_1.Input.AppendTimestamp);
        const primaryCacheHit = core.getState(constants_1.State.PrimaryCacheHit);
        if (JSON.parse(primaryCacheHit) && !appendTimestamp) {
            core.info("Cache hit on primary key. Cache will not be saved");
            return;
        }
        core.startGroup("Saving cache");
        let key = core.getState(constants_1.State.CacheKey);
        if (appendTimestamp) {
            key = `${key}-${Date.now()}`;
        }
        core.debug(`Saving cache with key: ${key}`);
        const conan = new conan_1.Conan(core.getState(constants_1.State.ConanPath));
        await conan.save_cache(key);
        core.endGroup();
    }
    catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error)
            core.setFailed(error.message);
    }
    finally {
        // Explicit process.exit() to not wait for hanging promises,
        // see https://github.com/actions/setup-node/issues/878
        process.exit();
    }
}
post();
//# sourceMappingURL=index.js.map
