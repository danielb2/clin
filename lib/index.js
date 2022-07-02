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

module.exports.start = function () {
    console.log(chalk.bold.underline.yellow(`CLIn v${Pkg.version}`));
    console.log(' loading libraries ...');

    const Load = load();

    const reqs = [];
    reqs.push(...requires(Load.dependencies));
    reqs.push(...requires(Load.devDependencies));

    const displayInfo = [];

    let final =
        reqs
            .map((lib) => {
                const name = name_for(lib);
                displayInfo.push({ lib, name });
                return clicmd(name, lib);
            })
            .join(';\n') + clicmd('main', Load.mainPath);

    displayInfo.push({ lib: Load.main, name: 'main' });

    const display = function (reqs, name_for) {
        const longestString = reqs
            .map((l) => l.lib)
            .reduce((p, c) =>
                name_for(p).length > name_for(c).length
                    ? name_for(p)
                    : name_for(c)
            ).length;

        const showOne = function (lib, name) {
            console.log(
                '',
                chalk.cyan(lib.padEnd(longestString + 4)),
                'as ',
                chalk.green(name)
            );
        };

        for (const req of reqs) {
            showOne(req.lib, req.name);
        }
    };
    display(displayInfo, name_for);
    final =
        final +
        `global.clin = { displayInfo: ${JSON.stringify(
            displayInfo
        )}, display: ${display.toString()}, name_for: ${name_for.toString()}, ok() { clin.display(clin.displayInfo, clin.name_for) }};`;
    final =
        final + clicmd('camelcase', __dirname + '/../node_modules/camelcase');
    final = final + clicmd('chalk', __dirname + '/../node_modules/chalk');

    console.log('');
    const res = CP.spawnSync('node', ['-i', '-e', final], { stdio: 'inherit' });
};
