import { getExecOutput } from "@actions/exec";
import { parse_latest_version } from "./utils";

export class Version {
    major: number;
    minor: number;
    patch: number;

    constructor(major: number, minor: number, patch: number) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    toString(): string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }
}

export function parse_version(semver: string): Version {
    const semverRegex = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/;
    const matchResult = semver.match(semverRegex);
    if (matchResult == null) {
        throw new Error(`could not parse version: "${semver}"`);
    }

    return new Version(
        Number.parseInt(matchResult[1]),
        Number.parseInt(matchResult[2]),
        Number.parseInt(matchResult[3]),
    );
}

export async function get_latest_version(): Promise<Version> {
    const output = await getExecOutput("pip", ["index", "versions", "conan"], {
        silent: true,
        ignoreReturnCode: false,
    });
    return parse_latest_version(output.stdout);
}
