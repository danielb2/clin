#!/usr/bin/env node
const Pkg = require('./package.json');
const CP = require('child_process');
const CamelCase = require('camelcase');
const Chalk = require('chalk');

const requires = function (obj) {
    if (!obj) return [];

    return Object.keys(obj);
};

const clicmd = function (name, lib) {
    return `try { global.${name} = require("${lib}") } catch (e) { console.log("Failed to load '${lib}' as ${name}") };\n`;
};

const name_for = function (lib) {
    return CamelCase(lib.replace(/[@/]/g, '-'));
};

const display = function (lib, name, longestString) {
    console.log(
        '',
        Chalk.blue(lib.padEnd(longestString + 4)),
        'as ',
        Chalk.green(name)
    );
};

const main = function () {
    console.log(Chalk.bold.underline.yellow(`CLIn v${Pkg.version}`));
    let Load = '';

    try {
        Load = require(`${process.cwd()}/package.json`);
    } catch (e) {
        console.log(
            'A package.json must be in the same folder to load dependencies'
        );
    }

    const reqs = [];
    reqs.push(...requires(Load.dependencies));
    reqs.push(...requires(Load.devDependencies));

    let longestString = reqs.reduce((p, c) =>
        name_for(p).length > name_for(c).length ? name_for(p) : name_for(c)
    ).length;

    const final =
        reqs
            .map((lib) => {
                const name = name_for(lib);
                display(lib, name, longestString);
                return clicmd(name, lib);
            })
            .join(';') + clicmd('main', './' + Load.main);

    console.log('');
    const res = CP.spawnSync('node', ['-i', '-e', final], { stdio: 'inherit' });
};

main();
