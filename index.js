const chalk = require('chalk');
const util = require('util');
const hideSensitive = require('semantic-release/lib/hide-sensitive');

const findModules = require('./src/find-modules');
const runRelease = require('./src/release');
const { getRoot } = require('./src/git');

const stringList = {
  type: 'string',
  array: true,
  coerce: (values) =>
    values.length === 1 && values[0].trim() === 'false'
      ? []
      : values.reduce((values, value) => values.concat(value.split(',').map((value) => value.trim())), []),
};

module.exports = async () => {
  const cli = require('yargs')
    .command('$0', 'Automate publishing of Golang monorepos')
    .option('d', { alias: 'dry-run', describe: 'Skip publishing & related steps', type: 'boolean' })
    .option('i', { alias: 'ignore', describe: 'File(s)/Folder(s) to ignore', ...stringList })
    .option('b', { alias: 'branches', describe: 'Git branches to release from', ...stringList })
    .strict(false);

  try {
    const { ignore, ...opts } = cli.parse(process.argv.slice(2));
    const repoRoot = await getRoot();

    if (repoRoot !== process.cwd()) {
      console.log(chalk.yellow([
        'Warning: this command is designed to run at the root of the repo.',
        `Automatically using the repo root of ${repoRoot} for further operations.`
      ].join('\n')));
    }

    const modules = await findModules(repoRoot, ignore);
    for (let mod of modules) {
      await runRelease(mod, modules, opts, { cwd: repoRoot });
    }

    return 0;
  } catch (error) {
    if (error.name !== 'YError') {
      process.stderr.write(hideSensitive(process.env)(util.inspect(error, {colors: true})));
    }

    return 1;
  }
}
