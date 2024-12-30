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

import { getExecOutput, exec } from "@actions/exec";
import { restoreCache, saveCache } from "@actions/cache";

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

        const key = await conan.cache_key();
        expect(key).toMatch(/^conan-.+$/);
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
        expect(restoreCache).toBeCalledWith([cacheFile], cacheKey);

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
