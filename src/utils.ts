import { Md5 } from "ts-md5";
import stringify from "fast-json-stable-stringify";

export function json_hash(profile_json: string): string {
    return Md5.hashStr(stringify(JSON.parse(profile_json)));
}
