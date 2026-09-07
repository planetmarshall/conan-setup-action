import { describe, expect, test, jest } from "@jest/globals";
import * as core from "../__fixtures__/core.js";
import * as exec from "../__fixtures__/exec.js";

jest.unstable_mockModule("@actions/core", () => core);
jest.unstable_mockModule("@actions/exec", () => exec);

jest.useFakeTimers().setSystemTime(new Date("2025-01-01"));

import { Version } from "../src/version.js";
const { Conan, cache_key_from_components } = await import("../src/conan.js");

describe("compute cache key", () => {
    test("get hash of host profiles", async () => {
        jest.mocked(exec.getExecOutput).mockReturnValue(
            Promise.resolve({
                stdout: "{}",
                exitCode: 0,
                stderr: "",
            }),
        );

        const conan = new Conan("conan");
        const profile_hash = await conan.profile_hash(["default", "linux_gcc"]);

        expect(exec.getExecOutput).toHaveBeenCalledWith(
            "conan",
            [
                "profile",
                "show",
                "--format",
                "json",
                "--profile:host=default",
                "--profile:host=linux_gcc",
            ],
            { silent: true, ignoreReturnCode: true },
        );
        expect(profile_hash).toMatch(/[a-z0-9]{32}/);
    });

    test("get hash of host profiles throws on conan error", async () => {
        jest.mocked(exec.getExecOutput).mockReturnValue(
            Promise.resolve({
                stdout: "{}",
                exitCode: 1,
                stderr: "some error",
            }),
        );
        const conan = new Conan("conan");

        await expect(
            conan.profile_hash(["default", "linux_gcc"]),
        ).rejects.toThrow("some error");
    });

    test("cache key from components", () => {
        const key = cache_key_from_components(new Version(1, 2, 3), "my_key");
        expect(key).toBe("conan-v1.2.3-my_key");
    });

    test("get cache key if specified by input", async () => {
        jest.mocked(exec.getExecOutput).mockReturnValueOnce(
            Promise.resolve({
                stdout: "Conan version 2.8.0",
                exitCode: 0,
                stderr: "",
            }),
        );
        jest.mocked(core.getInput).mockReturnValue("linux-x86_64-cache-key");
        const conan = new Conan("conan");
        const key = await conan.cache_key(["default"]);
        expect(core.getInput).toHaveBeenCalledWith("cache-key");
        expect(key).toEqual("conan-v2.8.0-linux-x86_64-cache-key");
    });
});
