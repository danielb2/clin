#!/usr/bin/env node
const Pkg = require('../package.json');
const CP = require('child_process');
const CamelCase = require('camelcase');
const Chalk = require('chalk');
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
    return CamelCase(lib.replace(/[@/]/g, '-'));
};

const display = function (lib, name, longestString) {
    console.log(
        '',
        Chalk.cyan(lib.padEnd(longestString + 4)),
        'as ',
        Chalk.green(name)
    );
};

const load = function () {
    const packageJson = FindUp.sync('package.json');
    if (!packageJson) {
        console.log(Chalk.red(' Could not find package.json'));
        process.exit();
    }

    const path = Path.dirname(packageJson);
    if (!FS.existsSync(Path.join(path, 'node_modules'))) {
        console.log(Chalk.red(` Could not find ${path}/node_modules`));
        process.exit();
    }
    return require(packageJson);
};

module.exports.start = function () {
    console.log(Chalk.bold.underline.yellow(`CLIn v${Pkg.version}`));
    console.log(' loading libraries ...');

    const Load = load();

    const reqs = [];
    reqs.push(...requires(Load.dependencies));
    reqs.push(...requires(Load.devDependencies));

    let longestString = [...reqs, Load.main].reduce((p, c) =>
        name_for(p).length > name_for(c).length ? name_for(p) : name_for(c)
    ).length;

    const final =
        reqs
            .map((lib) => {
                const name = name_for(lib);
                display(lib, name, longestString);
                return clicmd(name, lib);
            })
            .join(';\n') + clicmd('main', './' + Load.main);

    display(Load.main, 'main', longestString);
    console.log('');
    const res = CP.spawnSync('node', ['-i', '-e', final], { stdio: 'inherit' });
};
