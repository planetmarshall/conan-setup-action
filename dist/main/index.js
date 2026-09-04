Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const constants_1 = require("./constants");
const conan_1 = require("./conan");
const io = tslib_1.__importStar(require("@actions/io"));
const version_1 = require("./version");
const path = tslib_1.__importStar(require("node:path"));
/**
 * Installs conan using the requested options
 */
async function install_conan() {
    const conan_path = await io.which("conan");
    const has_conan = conan_path.length != 0;
    let version_option = core.getInput(constants_1.Input.Version);
    if (has_conan) {
        const conan = new conan_1.Conan(conan_path);
        const installed_version = await conan.version();
        core.debug(`conan version ${installed_version.toString()} already installed`);
        if (version_option == constants_1.InstallOptions.Latest) {
            const latest_version = await (0, version_1.get_latest_version)();
            core.debug(`conan version ${latest_version.toString()} is available`);
            if (latest_version != installed_version) {
                return await (0, conan_1.install)(constants_1.InstallOptions.Latest);
            }
        }
        else if (version_option != constants_1.InstallOptions.Auto) {
            if (version_option != installed_version.toString()) {
                return await (0, conan_1.install)(version_option);
            }
        }
    }
    else {
        if (version_option == constants_1.InstallOptions.Auto) {
            version_option = constants_1.InstallOptions.Latest;
        }
        return await (0, conan_1.install)(version_option);
    }
    return new conan_1.Conan(conan_path);
}
async function configure_conan(conan) {
    const configPath = core.getInput(constants_1.Input.ConfigPath);
    if (configPath.length > 0) {
        core.debug(`installing configuration from ${configPath}`);
        await conan.install_config(configPath);
    }
    const profiles = await conan.installed_profiles();
    if (!profiles.includes("default")) {
        await conan.detect_default_profile();
    }
    const remotes = core.getMultilineInput(constants_1.Input.RemotePatterns);
    if (remotes.length > 0) {
        await conan.authorize_remotes(remotes);
    }
}
async function restore_cache(conan) {
    const lockfile_path = await (0, conan_1.lockfile_path_or_null)(core.getInput(constants_1.Input.Lockfile));
    const lockfile_hash = lockfile_path != null ? await (0, conan_1.get_lockfile_hash)(lockfile_path) : null;
    if (lockfile_hash != null) {
        core.info(`lockfile found at '${lockfile_path}' - appending hash to key`);
    }
    const key = await conan.cache_key(core.getMultilineInput(constants_1.Input.HostProfiles), lockfile_hash);
    const primaryCacheHit = await conan.restore_cache(key);
    core.saveState(constants_1.State.PrimaryCacheHit, primaryCacheHit);
    core.saveState(constants_1.State.CacheKey, key);
}
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
    try {
        core.startGroup("Install");
        const conan = await install_conan();
        const version = await conan.version();
        core.info(`conan version ${version.toString()} installed`);
        core.addPath(path.dirname(conan.path));
        core.saveState(constants_1.State.ConanPath, conan.path);
        core.endGroup();
        core.startGroup("Configure");
        await configure_conan(conan);
        core.endGroup();
        if (core.getBooleanInput(constants_1.Input.CacheEnabled)) {
            core.startGroup("Restoring Cache");
            await restore_cache(conan);
            core.endGroup();
        }
        else {
            core.info("Github cache is disabled");
        }
    }
    catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
run();
//# sourceMappingURL=index.js.map
