import type * as execT from "@actions/exec";
import { jest } from "@jest/globals";

export const getExecOutput = jest.fn<typeof execT.getExecOutput>();
export const exec = jest.fn<typeof execT.exec>();
