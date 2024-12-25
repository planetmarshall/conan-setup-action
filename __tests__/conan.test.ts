import { describe, expect, test, jest } from "@jest/globals";
import * as conan from "../src/conan";

jest.mock("@actions/exec", () => ({
    getExecOutput: jest.fn(),
    exec: jest.fn(),
}));

jest.mock("@actions/cache", () => ({ saveCache: jest.fn() }));

import { getExecOutput, exec } from "@actions/exec";
import { saveCache } from "@actions/cache";

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

    test("save cache to github", async () => {
        process.env.RUNNER_TEMP = "/faketmp";
        await conan.save_cache("key");

        //expect(exec).toHaveBeenCalledWith("conan", ["cache", "clean", "*"]);
        expect(exec).toHaveBeenCalledWith("conan", [
            "cache",
            "save",
            "--core-conf",
            "core.gzip:compresslevel=0",
            "--file",
            "/faketmp/conan-cache.tgz",
            "*",
        ]);
        expect(saveCache).toBeCalled();
    });
});
