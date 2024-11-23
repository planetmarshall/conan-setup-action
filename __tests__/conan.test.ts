import { describe, expect, test, jest } from "@jest/globals";
import { conan_version } from "../src/conan";

jest.mock("@actions/exec", () => ({
    getExecOutput: jest
        .fn()
        .mockReturnValueOnce(
            Promise.resolve({ stdout: "Conan version 2.8.0", exitCode: 0 }),
        ),
}));

describe("conan module", () => {
    test("get version if conan is installed", async () => {
        const version = await conan_version();
        expect(version).toEqual({ major: 2, minor: 8, patch: 0 });
    });
});
