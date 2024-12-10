import { execSync } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

function GetVersion() {
    /*
    Source from https://raw.githubusercontent.com/fullstackmb/fullstackmb.github.io/refs/heads/main/src/_data/build.js from Full Stack Manitoba
    */
    
    // Get shortened git hash
    const gitHash = execSync('git rev-parse --short HEAD').toString().trim();
    
    // Get package.json json object
    let pkg = { version: 'unknown' };
    try {
        pkg = require('../package.json');
    } catch (e) {
        console.warn('Could not load package.json, using fallback version');
    }

    return `${pkg.version}+${gitHash}`;
}

export default {
    title: "David Wesst",
    description: "My website",
    version: GetVersion(),
    language: "en"
}