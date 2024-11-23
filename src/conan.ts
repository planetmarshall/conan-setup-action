import { getExecOutput } from "@actions/exec";

class Version {
    major: number;
    minor: number;
    patch: number;

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
    return {
        major: Number.parseInt(matchResult[1]),
        minor: Number.parseInt(matchResult[2]),
        patch: Number.parseInt(matchResult[3]),
    };
}
