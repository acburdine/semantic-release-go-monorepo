const execa = require('execa');

async function getChangedFiles(cwd, hash) {
  const { stdout } = await execa.command(`git diff-tree --no-commit-id --name-only -r ${hash}`, {cwd});
  return stdout.split('\n');
}

async function getRoot() {
  const { stdout } = await execa.command('git rev-parse --show-toplevel');
  return stdout;
}

async function getCommitDiffs(cwd, commits = []) {
  const result = {};

  for (let { hash } of commits) {
    result[hash] = await getChangedFiles(cwd, hash);
  }

  return result;
}

module.exports = {
  getChangedFiles,
  getRoot,
  getCommitDiffs
};
