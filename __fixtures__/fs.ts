import type * as fs from "node:fs/promises";
import { jest } from "@jest/globals";

export const access = jest.fn<typeof fs.access>();
export const readFile = jest.fn(() =>
    Promise.resolve('{ "Local Cache": { "zlib": {}}}'),
);
export const constants = { R_OK: 1 };
