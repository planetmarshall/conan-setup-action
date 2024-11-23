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
    npx local-action . src/main.ts .env.example
    ```
