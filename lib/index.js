#!/usr/bin/env node
const Pkg = require('../package.json');
const CP = require('child_process');
const camelcase = require('camelcase');
const chalk = require('chalk');
const FindUp = require('find-up');
const Path = require('path');
const FS = require('fs');

const requires = function (obj) {
    if (!obj) return [];

    return Object.keys(obj);
};

const clicmd = function (name, lib) {
    return `try { global.${name} = require("${lib}") } catch (e) { console.log(e.message); console.log(); console.log("Failed to load '${lib}' as ${name}") }`;
};

const name_for = function (lib) {
    return camelcase(lib.replace(/[@/]/g, '-'));
};

const load = function () {
    const packageJson = FindUp.sync('package.json');
    if (!packageJson) {
        console.log(chalk.red(' Could not find package.json'));
        process.exit();
    }

    const path = Path.dirname(packageJson);
    if (!FS.existsSync(Path.join(path, 'node_modules'))) {
        console.log(chalk.red(` Could not find ${path}/node_modules`));
        process.exit();
    }
    const Pkg = require(packageJson);
    Pkg.mainPath = Path.normalize(Path.join(path, Pkg.main));
    return Pkg;
};

const clin = {
    libs: [],
};

clin.display = function (name_for) {
    const longestString = clin.libs
        .map((l) => l.lib)
        .reduce((p, c) =>
            name_for(p).length > name_for(c).length ? name_for(p) : name_for(c)
        ).length;

    const showOne = function (lib, name) {
        console.log(
            '',
            chalk.cyan(lib.padEnd(longestString + 4)),
            'as ',
            chalk.green(name)
        );
    };

    for (const req of clin.libs) {
        showOne(req.lib, req.name);
    }
};

module.exports.start = function () {
    console.log(chalk.bold.underline.yellow(`CLIn v${Pkg.version}`));
    console.log(' loading libraries ...');

    const Load = load();

    const reqs = [];
    reqs.push(...requires(Load.dependencies));
    reqs.push(...requires(Load.devDependencies));

    let final =
        reqs
            .map((lib) => {
                const name = name_for(lib);
                clin.libs.push({ lib, name });
                return clicmd(name, lib);
            })
            .join(';\n') + clicmd('main', Load.mainPath);

    clin.libs.push({ lib: Load.main, name: 'main' });

    clin.display(name_for);
    final =
        final +
        `global.clin = { libs: ${JSON.stringify(
            clin.libs
        )}, display: ${clin.display.toString()}, version: '${
            Load.version
        }', name_for: ${name_for.toString()}, show() { clin.display(clin.name_for) }};`;
    final =
        final + clicmd('camelcase', __dirname + '/../node_modules/camelcase');
    final = final + clicmd('chalk', __dirname + '/../node_modules/chalk');

    console.log('');
    const res = CP.spawnSync('node', ['-i', '-e', final], { stdio: 'inherit' });
};
