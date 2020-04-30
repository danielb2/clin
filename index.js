#!/usr/bin/env node
const Pkg = require('./package.json');
const CP = require('child_process');
const CamelCase = require('camelcase');

const requires = function (obj) {
	if (!obj) return [];

	return Object.keys(obj);
};

const main = function () {

	console.log(`CLIn v${Pkg.version}`);
	let Load = '';
	try {
		Load = require(`${process.cwd()}/package.json`);
	} catch (e) {
		console.log("A package.json must be in the same folder to load dependencies");
	}
	const reqs = [];
	reqs.push(...requires(Load.dependencies));
	reqs.push(...requires(Load.devDependencies));
	const final = reqs.map((i) => {
		
		const name = CamelCase(i.replace(/[@/]/g, '-'));
		if (i !== name) {
			console.log(`  '${i}' as ${name}`);
		}
		return `try { global.${name} = require("${i}") } catch (e) { console.log("Failed to load '${i}'") }`;
	}).join(';');

	console.log("");
	const res = CP.spawnSync('node', ['-i', '-e', final], { stdio: 'inherit' });
};

main();
