import { describe, expect, test } from "@jest/globals";
import { Version } from "../src/version";

describe("version module", () => {
    test("compare version with string", () => {
        const semver_str = "1.2.3";
        const semver = new Version(1, 2, 3);

        expect(semver_str).toEqual(semver.toString());
    });
});
