#!/usr/bin/env node
const Pkg = require('../package.json');
const CP = require('child_process');
const camelcase = require('camelcase');
const chalk = require('chalk');
const FindUp = require('find-up');
const Path = require('path');
const FS = require('fs');

const clin = {
    reqs: [],
    requires(obj) {
        if (!obj) return [];

        return Object.keys(obj);
    },
    clicmd(name, lib) {
        return `try { global.${name} = require("${lib}") } catch (e) { console.log(e.message); console.log(); console.log("Failed to load '${lib}' as ${name}") }`;
    },
    name_for(lib) {
        return camelcase(lib.replace(/[@/]/g, '-'));
    },
    show() {
        const name_for = (lib) => camelcase(lib.replace(/[@/]/g, '-'));

        const longestString = clin.reqs
            .map((l) => l.lib)
            .reduce((p, c) =>
                name_for(p).length > name_for(c).length
                    ? name_for(p)
                    : name_for(c)
            ).length;

        const showOne = (lib, name) => {
            console.log(
                '',
                chalk.cyan(lib.padEnd(longestString + 4)),
                'as ',
                chalk.green(name)
            );
        };

        for (const req of clin.reqs) {
            showOne(req.lib, req.name);
        }
    },
};

clin.load = function () {
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

clin.getEval = function (reqs, load) {
    let final =
        reqs
            .map((lib) => {
                const name = clin.name_for(lib);
                clin.reqs.push({ lib, name });
                return clin.clicmd(name, lib);
            })
            .join(';\n') + clin.clicmd('main', load.mainPath);

    clin.reqs.push({ lib: load.main, name: 'main' });

    final =
        final +
        `global.clin = { reqs: ${JSON.stringify(
            clin.reqs
        )}, get ${clin.show.toString()}, version: '${Pkg.version}'};`;
    final =
        final +
        clin.clicmd('camelcase', __dirname + '/../node_modules/camelcase');
    final = final + clin.clicmd('chalk', __dirname + '/../node_modules/chalk');
    return final;
};

module.exports.start = function () {
    console.log(chalk.bold.underline.yellow(`CLIn v${Pkg.version}`));
    console.log(' loading libraries ...');

    const load = clin.load();

    const reqs = [];
    reqs.push(...clin.requires(load.dependencies));
    reqs.push(...clin.requires(load.devDependencies));
    const eval = clin.getEval(reqs, load);

    clin.show();
    console.log('');
    const res = CP.spawnSync('node', ['-i', '-e', eval], { stdio: 'inherit' });
};
