import { describe, expect, test, jest } from "@jest/globals";
import * as conan from "../src/conan";

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

describe("compute cache key", () => {
    test("get default cache key", async () => {
        jest.mocked(getExecOutput).mockReturnValue(
            Promise.resolve({
                stdout: "{}",
                exitCode: 0,
                stderr: "",
            }),
        );
        jest.mocked(getInput).mockReturnValue("");

        const key = await conan.cache_key();
        expect(key).toMatch(/^conan-.+$/);
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
        const key = await conan.cache_key();
        expect(getInput).toBeCalledWith("cache-key");
        expect(key).toEqual("conan-v2.8.0-linux-x86_64-cache-key");
    });

    test("get cache key if forcing save", async () => {
        jest.mocked(getExecOutput).mockReturnValueOnce(
            Promise.resolve({
                stdout: "Conan version 2.8.0",
                exitCode: 0,
                stderr: "",
            }),
        );
        jest.mocked(getInput).mockReturnValue("linux-x86_64-cache-key");
        const key = await conan.cache_key(true);
        expect(getInput).toBeCalledWith("cache-key");
        expect(key).toEqual(
            "conan-v2.8.0-linux-x86_64-cache-key-1735689600000",
        );
    });
});
