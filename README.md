Conan Setup Action
==================

A Github action for setting up the [conan](https://conan.io/) C and C++ Package Manager

Usage
-----

Currently requires conan to be installed as a prerequisite. For example, use the following
in your workflow

```yaml
  - uses: actions/setup-python@v5
    with:
      python-version: '3.12'

  - name: Install conan
    run: pip install conan

  - name: Setup conan
    uses: conan-setup-action@main
```

## Cache Key Generation

By default, the full cache key is of the form

```
conan-v{ conan version }-{ cache-key }-{ timestamp }
```

Where `cache-key` is the MD5 hash of the deterministic JSON representation of `conan profile show`

Appending a timestamp is inspired by the behaviour of the
[ccache action](https://github.com/hendrikmuhs/ccache-action) by [@hendrikmuhs](https://github.com/hendrikmuhs), 
which causes a cache to always be uploaded even if there was a cache hit. A partial key without the timestamp is 
used to always retrieve the latest cache.

This behaviour can be customized using the configuration options

## Examples

### Installing a configuration

Use the `config` option to 
[install a configuration](https://docs.conan.io/2/reference/commands/config.html#conan-config-install) using 
`conan config install`

```yaml
  - name: Setup conan
    uses: conan-setup-action@main
    with:
      config: https://github.com/planetmarshall/conan_config
```

### Using an explicit cache key

```yaml
  - name: Setup conan
    uses: conan-setup-action@main
    with:
      cache-key: my_key
      append-timestamp: false
```

Configuration
-------------

| option             | description                                          | default                      |
|--------------------|------------------------------------------------------|------------------------------|
| `cache-key`        | specify an explicit cache key to use                 | hash of `conan profile show` |
| `append-timestamp` | append a timestamp to the cache key to force a save  | `true`                       |               
| `config`           | install a configuration using `conan config install` | `none`                       |               

Development
-----------

1. Check out the source
2. Install the dependencies
   ```
   npm install
   ``` 
3. Run 
   ```
   npm run all
   ```
4. Test using Github's [Local Action](https://github.com/github/local-action) utility
    ```
    npx local-action . src/save.ts .env.example
    ```
