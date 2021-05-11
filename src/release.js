const fs = require('fs');
const ora = require('ora');
const path = require('path');
const release = require('semantic-release');
const { WritableStreamBuffer } = require('stream-buffers');

const defaultPlugins = [
  '@semantic-release/commit-analyzer',
  '@semantic-release/github',
  '@semantic-release/release-notes-generator'
];

async function runRelease(module, allModules = [], opts = {}, context = {}) {
  const stdout = new WritableStreamBuffer();
  const stderr = new WritableStreamBuffer();

  const name = module.relativeName;

  opts = {
    plugins: defaultPlugins,
    ...opts,
    tagFormat: name ? `${name}/v\${version}` : 'v${version}',
    extends: path.join(__dirname, './extends.js'),
    module: name,
    allModules: allModules.map(({ relativeName }) => relativeName),
  };

  context = {
    cwd: process.cwd(),
    env: process.env,
    stdout,
    stderr,
    ...context,
  };

  const spinner = ora(`Releasing ${module.name}`).start();

  try {
    const releaseInfo = await release(opts, context);
    if (!releaseInfo) {
      spinner.info(`No release necessary for ${module.name}`);
      return;
    }

    const { nextRelease } = releaseInfo;
    spinner.succeed(`Released ${module.name} v${nextRelease.version}`);
  } catch (error) {
    spinner.fail(`Failed to release ${module.name}`);

    const logFilePath = path.join(process.cwd(), `semantic-release-go-monorepo-${Date.now()}.txt`)
    const logOutput = `module: ${module.name}

-------- ERROR --------
${error.toString()}

-------- STDOUT --------
${stdout.getContentsAsString('utf8')}

-------- STDERR --------
${stderr.getContentsAsString('utf8')}
    `;
    fs.writeFileSync(logFilePath, logOutput);

    console.log(`Wrote error log to: ${logFilePath}`);
    throw error;
  }
}

module.exports = runRelease;
