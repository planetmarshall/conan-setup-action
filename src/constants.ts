export enum Input {
    CacheKey = "cache-key",
    CacheEnabled = "cache",
    AppendTimestamp = "append-timestamp",
    ConfigPath = "config",
    HostProfiles = "host-profiles",
    RemotePatterns = "remotes",
    SaveCache = "save",
    Lockfile = "lockfile",
    Version = "version",
}

export enum InstallOptions {
    Auto = "auto",
    Latest = "latest",
}

export enum State {
    PrimaryCacheHit = "primary_cache_hit",
    CacheKey = "cache_key",
    ConanPath = "conan",
}
