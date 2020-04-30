#!/usr/bin/env node
const Pkg = require(`${process.cwd()}/package.json`);
const CP = require('child_process');
const CamelCase = require('camelcase');

const requires = function (obj) {
	if (!obj) return [];

	return Object.keys(obj);
};

const main = function () {

	const reqs = [];
	reqs.push(...requires(Pkg.dependencies));
	reqs.push(...requires(Pkg.devDependencies));
	const final = reqs.map((i) => {
		
		const name = CamelCase(i.replace(/[@/]/g, '-'));
		return `${name} = require("${i}")`;
	}).join(';');

	const res = CP.spawnSync('node', ['-i', '-e', final], { stdio: 'inherit' });
};

main();
