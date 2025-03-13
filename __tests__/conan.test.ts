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

import { getExecOutput, exec } from "@actions/exec";
import { restoreCache, saveCache } from "@actions/cache";
import { getInput } from "@actions/core";

describe("conan module", () => {
    test("get version if conan is installed", async () => {
        jest.mocked(getExecOutput).mockReturnValueOnce(
            Promise.resolve({
                stdout: "Conan version 2.8.0",
                exitCode: 0,
                stderr: "",
            }),
        );
        const version = await conan.version();
        expect(version).toEqual({ major: 2, minor: 8, patch: 0 });
    });

    test("install config", async () => {
        await conan.install_config("some_config");
        expect(exec).toBeCalledWith("conan", [
            "config",
            "install",
            "some_config",
        ]);
    });

    test("auth remote", async () => {
        await conan.authorize_remotes(["my_remote", "*"]);
        expect(exec).toBeCalledWith("conan", [
            "remote",
            "auth",
            "my_remote",
        ]);
        expect(exec).toBeCalledWith("conan", [
            "remote",
            "auth",
            "*",
        ]);
    });

    test("detect default profile", async () => {
        await conan.detect_default_profile();
        expect(exec).toBeCalledWith("conan", ["profile", "detect"]);
    });

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

    test("list installed profiles", async () => {
        const profiles_json: string = '[ "default", "gcc" ]';
        jest.mocked(getExecOutput).mockReturnValueOnce(
            Promise.resolve({
                stdout: profiles_json,
                exitCode: 0,
                stderr: "",
            }),
        );

        const profiles = await conan.installed_profiles();
        expect(profiles).toContain("default");
        expect(profiles).toContain("gcc");
    });

    test("cache is restored if cache hit", async () => {
        process.env.RUNNER_TEMP = "/faketmp";
        const cacheKey = "12345-key";
        const cacheFile = "/faketmp/conan-cache.tgz";
        jest.mocked(restoreCache).mockReturnValueOnce(
            Promise.resolve(cacheKey),
        );

        await conan.restore_cache(cacheKey);
        expect(restoreCache).toBeCalledWith([cacheFile], cacheKey, [cacheKey]);

        expect(exec).toHaveBeenCalledWith("conan", [
            "cache",
            "restore",
            cacheFile,
        ]);
    });

    test("cache is restored on partial cache hit", async () => {
        process.env.RUNNER_TEMP = "/faketmp";
        const cacheKey = "12345-key";
        const cacheFile = "/faketmp/conan-cache.tgz";
        jest.mocked(restoreCache).mockReturnValueOnce(
            Promise.resolve("12345-key-1"),
        );

        await conan.restore_cache(cacheKey);
        expect(restoreCache).toBeCalledWith([cacheFile], cacheKey, [cacheKey]);

        expect(exec).toHaveBeenCalledWith("conan", [
            "cache",
            "restore",
            cacheFile,
        ]);
    });

    test("return true if there is a cache hit on the primary key", async () => {
        process.env.RUNNER_TEMP = "/faketmp";
        const cacheKey = "12345-key";
        jest.mocked(restoreCache).mockReturnValueOnce(
            Promise.resolve(cacheKey),
        );

        const isPrimaryCacheHit = await conan.restore_cache(cacheKey);
        expect(isPrimaryCacheHit).toBe(true);
    });

    test("save cache to github", async () => {
        process.env.RUNNER_TEMP = "/faketmp";
        await conan.save_cache("key");

        expect(exec).toHaveBeenCalledWith("conan", ["cache", "clean", "*"]);
        expect(exec).toHaveBeenCalledWith("conan", [
            "cache",
            "save",
            "--core-conf",
            "core.gzip:compresslevel=0",
            "--file",
            "/faketmp/conan-cache.tgz",
            "*:*",
        ]);
        expect(saveCache).toBeCalled();
    });
});
