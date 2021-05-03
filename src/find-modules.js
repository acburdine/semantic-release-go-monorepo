const glob = require('glob');
const path = require('path');
const execa = require('execa');
const { promisify } = require('util');

const globA = promisify(glob);

async function getModInformation(rootDir, modFilePath) {
  const fullPath = path.resolve(rootDir, modFilePath);
  const modDir = path.dirname(fullPath);

  try {
    const { stdout } = await execa.command('go mod edit -json', {
      cwd: modDir,
    });

    const info = JSON.parse(stdout);
    if (!info?.Module?.Path) return null;

    return {
      directory: modDir,
      file: fullPath,
      name: info.Module.Path,
      relativeName: path.relative(rootDir, modDir)
    }
  } catch (error) {
    return null;
  }
}

module.exports = async function findModules(dir, ignored = []) {
  const found = await globA('**/go.mod', {
    cwd: dir,
    // ignore "internal" and "vendor" directories by default
    ignore: ['**/internal/**', '**/vendor/**', ...ignored],
    silent: true,
  });

  const result = [];

  for (let modFile of found) {
    const info = await getModInformation(dir, modFile);

    if (info) {
      result.push(info);
    }
  }

  return result;
};
