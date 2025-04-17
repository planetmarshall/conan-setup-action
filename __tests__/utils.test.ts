import { describe, expect, test } from "@jest/globals";
import { json_hash } from "../src/utils";

describe("utils module", () => {
    test("hash from profile json is deterministic", async () => {
        const profile_a = `{"host": {"settings": {"arch": "x86_64", "compiler": "gcc"}}, "build": {"settings": {"compiler": "gcc"}}}`;
        const profile_b = `{"build": {"settings": {"compiler": "gcc"}}, "host": {"settings": {"compiler": "gcc", "arch": "x86_64"}}}`;

        const h_a = json_hash(profile_a);
        const h_b = json_hash(profile_b);

        expect(h_a.length).toBeGreaterThan(0);
        expect(h_a).toEqual(h_b);
    });
});
