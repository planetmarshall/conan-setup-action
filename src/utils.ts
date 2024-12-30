import { Md5 } from "ts-md5";
import stringify from "fast-json-stable-stringify";

export function profile_hash_from_json(profile_json: string): string {
    return Md5.hashStr(stringify(JSON.parse(profile_json)));
}
