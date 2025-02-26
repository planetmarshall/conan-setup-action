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

## Examples

### Installing a configuration

```yaml
  - name: Setup conan
    uses: conan-setup-action@main
    with:
      config: https://github 
```

### Using an explicit cache key

The default behaviour is to use a hash of the output of
`conan profile show default` as a cache key.

Cache keys are always of the form: `conan-v{version}-{cache-key}` or
`conan-v{version}-{cache-key}-{timestamp}` so for 
example the following configuration using Conan version 2.12.2 would
upload a cache called `conan-v2.12.0-my_key`

```yaml
  - name: Setup conan
    uses: conan-setup-action@main
    with:
      cache-key: my_key
      append-timestamp: false
```

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
