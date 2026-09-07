import { describe, expect, test, jest } from "@jest/globals";
import * as exec from "../__fixtures__/exec.js";
import * as fs from "../__fixtures__/fs.js";
import * as cache from "../__fixtures__/cache.js";

jest.unstable_mockModule("@actions/exec", () => exec);

jest.unstable_mockModule("node:fs/promises", () => fs);

jest.unstable_mockModule("@actions/cache", () => cache);

const { Conan, lockfile_path_or_null } = await import("../src/conan.js");

describe("conan module", () => {
    test("get version if conan is installed", async () => {
        jest.mocked(exec.getExecOutput).mockReturnValueOnce(
            Promise.resolve({
                stdout: "Conan version 2.8.0",
                exitCode: 0,
                stderr: "",
            }),
        );
        const conan = new Conan("conan");
        const version = await conan.version();
        expect(version).toEqual({ major: 2, minor: 8, patch: 0 });
    });

    test("get default lockfile if setting is empty and lockfile exists", async () => {
        jest.mocked(fs.access).mockReturnValueOnce(Promise.resolve());
        const lockfile_path = await lockfile_path_or_null("");

        expect(fs.access).toHaveBeenCalledWith("conan.lock", fs.constants.R_OK);
        expect(lockfile_path).toEqual("conan.lock");
    });

    test("return null if setting is empty and lockfile does not exist", async () => {
        jest.mocked(fs.access).mockReturnValueOnce(Promise.reject());
        const lockfile_path = await lockfile_path_or_null("");

        expect(fs.access).toHaveBeenCalledWith("conan.lock", fs.constants.R_OK);
        expect(lockfile_path).toBeNull();
    });

    test("get specified lockfile", async () => {
        const lockfile_path = await lockfile_path_or_null("foo/conan.lock");
        expect(lockfile_path).toEqual("foo/conan.lock");
    });

    test("install config", async () => {
        const conan = new Conan("conan");
        await conan.install_config("some_config");
        expect(exec.exec).toHaveBeenCalledWith("conan", [
            "config",
            "install",
            "some_config",
        ]);
    });

    test("auth remote", async () => {
        const conan = new Conan("conan");
        await conan.authorize_remotes(["my_remote", "*"]);
        expect(exec.exec).toHaveBeenCalledWith("conan", [
            "remote",
            "enable",
            "my_remote",
        ]);
        expect(exec.exec).toHaveBeenCalledWith("conan", [
            "remote",
            "auth",
            "my_remote",
            "--force",
            "--out-file=auth.json",
            "--format=json",
        ]);
        expect(exec.exec).toHaveBeenCalledWith("conan", [
            "remote",
            "enable",
            "*",
        ]);
        expect(exec.exec).toHaveBeenCalledWith("conan", [
            "remote",
            "auth",
            "*",
            "--force",
            "--out-file=auth.json",
            "--format=json",
        ]);
    });

    test("detect default profile", async () => {
        const conan = new Conan("conan");
        await conan.detect_default_profile();
        expect(exec.exec).toHaveBeenCalledWith("conan", ["profile", "detect"]);
    });

    test("list installed profiles", async () => {
        const profiles_json: string = '[ "default", "gcc" ]';
        jest.mocked(exec.getExecOutput).mockReturnValueOnce(
            Promise.resolve({
                stdout: profiles_json,
                exitCode: 0,
                stderr: "",
            }),
        );

        const conan = new Conan("conan");
        const profiles = await conan.installed_profiles();
        expect(profiles).toContain("default");
        expect(profiles).toContain("gcc");
    });

    test("cache is restored if cache hit", async () => {
        process.env.RUNNER_TEMP = "/faketmp";
        const cacheKey = "12345-key";
        const cacheFile = "/faketmp/conan-cache.tgz";
        jest.mocked(cache.restoreCache).mockReturnValueOnce(
            Promise.resolve(cacheKey),
        );

        const conan = new Conan("conan");
        await conan.restore_cache(cacheKey);
        expect(cache.restoreCache).toHaveBeenCalledWith([cacheFile], cacheKey, [
            cacheKey,
        ]);

        expect(exec.exec).toHaveBeenCalledWith("conan", [
            "cache",
            "restore",
            cacheFile,
            "--out-file=restore.json",
            "--format=json",
        ]);
    });

    test("cache is restored on partial cache hit", async () => {
        process.env.RUNNER_TEMP = "/faketmp";
        const cacheKey = "12345-key";
        const cacheFile = "/faketmp/conan-cache.tgz";
        jest.mocked(cache.restoreCache).mockReturnValueOnce(
            Promise.resolve("12345-key-1"),
        );

        const conan = new Conan("conan");
        await conan.restore_cache(cacheKey);
        expect(cache.restoreCache).toHaveBeenCalledWith([cacheFile], cacheKey, [
            cacheKey,
        ]);

        expect(exec.exec).toHaveBeenCalledWith("conan", [
            "cache",
            "restore",
            cacheFile,
            "--out-file=restore.json",
            "--format=json",
        ]);
    });

    test("return true if there is a cache hit on the primary key", async () => {
        process.env.RUNNER_TEMP = "/faketmp";
        const cacheKey = "12345-key";
        jest.mocked(cache.restoreCache).mockReturnValueOnce(
            Promise.resolve(cacheKey),
        );

        const conan = new Conan("conan");
        const isPrimaryCacheHit = await conan.restore_cache(cacheKey);
        expect(isPrimaryCacheHit).toBe(true);
    });

    test("save cache to github", async () => {
        process.env.RUNNER_TEMP = "/faketmp";
        const conan = new Conan("conan");
        await conan.save_cache("key");

        expect(exec.exec).toHaveBeenCalledWith("conan", [
            "cache",
            "clean",
            "*",
        ]);
        expect(exec.exec).toHaveBeenCalledWith("conan", [
            "cache",
            "save",
            "--core-conf",
            "core.gzip:compresslevel=0",
            "--file",
            "/faketmp/conan-cache.tgz",
            "*:*",
        ]);
        expect(cache.saveCache).toHaveBeenCalled();
    });
});
