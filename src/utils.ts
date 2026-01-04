import { Md5 } from "ts-md5";
import { parse_version, Version } from "./version";
import stringify from "fast-json-stable-stringify";

export function json_hash(profile_json: string): string {
    return Md5.hashStr(stringify(JSON.parse(profile_json)));
}

export function parse_latest_version(pip_index_output: string): Version {
    const latest = pip_index_output
        .split("\n")
        .find((row) => row.trim().startsWith("LATEST"));
    if (latest == null) {
        throw Error(
            `Could not parse latest version string from ${pip_index_output}`,
        );
    }
    const semver = latest.trim().split(/\s+/);
    return parse_version(semver[1]);
}

export function check_auth_success(result_json: string) {
    const result_obj = JSON.parse(result_json);
    for (const key in result_obj) {
        const err = result_obj[key].error;
        if (err != null) {
            throw Error(err);
        }
    }
}

export function check_cache_validity(result_json: string) {
    const result_obj = JSON.parse(result_json);
    return Object.keys(result_obj["Local Cache"]).length > 0;
}
