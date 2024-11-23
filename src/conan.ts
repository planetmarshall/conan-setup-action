import { getExecOutput } from "@actions/exec";

class Version {
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

export async function conan_version(): Promise<Version | null> {
    const semverRegex = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/;
    const output = await getExecOutput("conan", ["--version"], {
        silent: true,
    });
    if (output.exitCode != 0) {
        return null;
    }
    const matchResult = output.stdout.match(semverRegex);
    if (matchResult == null) {
        return null;
    }
    return new Version(
        Number.parseInt(matchResult[1]),
        Number.parseInt(matchResult[2]),
        Number.parseInt(matchResult[3]),
    );
}
