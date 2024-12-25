import * as core from "@actions/core";
import { conan_cache_save } from "./conan";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function post(): Promise<void> {
    try {
        await conan_cache_save("foo");
    } catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) core.setFailed(error.message);
    }
}

post();
