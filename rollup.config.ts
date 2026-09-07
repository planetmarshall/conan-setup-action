// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";

const main_config = {
    input: "src/main.ts",
    output: {
        esModule: true,
        file: "dist/main/index.js",
        format: "es",
        sourcemap: true,
    },
    plugins: [
        typescript(),
        nodeResolve({ preferBuiltins: true }),
        commonjs(),
        json(),
        terser(),
    ],
};

const save_config = {
    input: "src/save.ts",
    output: {
        esModule: true,
        file: "dist/save/index.js",
        format: "es",
        sourcemap: true,
    },
    plugins: [
        typescript(),
        nodeResolve({ preferBuiltins: true }),
        commonjs(),
        json(),
        terser(),
    ],
};

export default [main_config, save_config];
