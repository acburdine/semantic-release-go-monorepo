const { wrapStep } = require('semantic-release-plugin-decorators');
const { getCommitDiffs } = require('./git');

const withFilteredCommits = plugin => async (pluginConfig, context) => {
  const { cwd, commits, options } = context;
  const { module, allModules } = options;

  if (!pluginConfig.commitDiffs) {
    pluginConfig.commitDiffs = await getCommitDiffs(cwd, commits);
  }

  // We only want to get modules which are subdirectories of the current module,
  // so that we exclude any changes to those submodules from our list
  const otherModules = allModules.filter(
    m => m.startsWith(module) && m.length > module.length
  ).map(m => `${m}/`).join('|');

  const otherModuleRg = otherModules ? new RegExp(`^(${otherModules})`) : null;

  const filterFn = ({ hash }) => {
    const changed = pluginConfig.commitDiffs[hash];
    if (!changed) return false;

    return changed.some(
      (file) => (!module || file.startsWith(`${module}/`)) && !(otherModuleRg && otherModuleRg.test(file))
    );
  };

  return plugin(pluginConfig, {
    ...context,
    commits: commits.filter(filterFn)
  });
};

const opts = { wrapperName: 'go-monorepo' };

module.exports = {
  analyzeCommits: wrapStep('analyzeCommits', withFilteredCommits, opts),
  generateNotes: wrapStep('generateNotes', withFilteredCommits, opts),
  success: wrapStep('success', withFilteredCommits, opts),
  fail: wrapStep('fail', withFilteredCommits, opts)
};
