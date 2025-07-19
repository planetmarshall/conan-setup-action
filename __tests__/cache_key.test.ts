import { describe, expect, test, jest } from "@jest/globals";

jest.mock("@actions/exec", () => ({
    getExecOutput: jest.fn(),
    exec: jest.fn(),
}));

jest.mock("@actions/cache", () => ({
    restoreCache: jest.fn(),
    saveCache: jest.fn(),
}));

jest.mock("@actions/core", () => ({
    getInput: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    startGroup: jest.fn(),
    endGroup: jest.fn(),
}));

jest.useFakeTimers().setSystemTime(new Date("2025-01-01"));

import { getExecOutput } from "@actions/exec";
import { getInput } from "@actions/core";
import { Version } from "../src/version";
import { Conan, cache_key_from_components } from "../src/conan";

describe("compute cache key", () => {
    test("get hash of host profiles", async () => {
        jest.mocked(getExecOutput).mockReturnValue(
            Promise.resolve({
                stdout: "{}",
                exitCode: 0,
                stderr: "",
            }),
        );

        const conan = new Conan("conan");
        const profile_hash = await conan.profile_hash(["default", "linux_gcc"]);

        expect(getExecOutput).toBeCalledWith(
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
        jest.mocked(getExecOutput).mockReturnValue(
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
        jest.mocked(getExecOutput).mockReturnValueOnce(
            Promise.resolve({
                stdout: "Conan version 2.8.0",
                exitCode: 0,
                stderr: "",
            }),
        );
        jest.mocked(getInput).mockReturnValue("linux-x86_64-cache-key");
        const conan = new Conan("conan");
        const key = await conan.cache_key(["default"]);
        expect(getInput).toBeCalledWith("cache-key");
        expect(key).toEqual("conan-v2.8.0-linux-x86_64-cache-key");
    });
});
