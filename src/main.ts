import * as core from "@actions/core";
import { conan_version } from "./conan";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
    try {
        const version = await conan_version();
        if (version != null) {
            core.info(`conan ${version.toString()} is installed.`);
        } else {
            core.setFailed("conan is not installed.");
        }
    } catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) core.setFailed(error.message);
    }
}
