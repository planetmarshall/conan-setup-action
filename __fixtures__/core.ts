import type * as core from "@actions/core";
import { jest } from "@jest/globals";

export const getInput = jest.fn<typeof core.getInput>();
export const debug = jest.fn<typeof core.debug>();
export const info = jest.fn<typeof core.info>();
export const startGroup = jest.fn<typeof core.startGroup>();
export const endGroup = jest.fn<typeof core.endGroup>();
export const setSecret = jest.fn<typeof core.setSecret>();
export const warning = jest.fn<typeof core.warning>();
