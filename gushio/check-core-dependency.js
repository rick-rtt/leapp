const fs = require('fs');
module.exports = {
  cli: {
    name: 'setup',
    description: 'Setup Leapp project',
    version: '0.1',
  },
  run: async () => {
    const cliPackageJson = JSON.parse(fs.readFileSync("cli/package.json"));
    const cliCoreDependencyValue = cliPackageJson["dependencies"]["@noovolari/leapp-core"];
    if (cliCoreDependencyValue.indexOf("file:") !== -1) {
      throw new Error("CLI depends on a local @noovolari/leapp-core build. Set it to the latest version available in https://www.npmjs.com/package/@noovolari/leapp-core");
    }

    const desktopAppPackageJson = JSON.parse(fs.readFileSync("cli/package.json"));
    const desktopAppCoreDependencyValue = desktopAppPackageJson["dependencies"]["@noovolari/leapp-core"];
    if (desktopAppCoreDependencyValue.indexOf("file:") !== -1) {
      throw new Error("Desktop App depends on a local @noovolari/leapp-core build. Set it to the latest version available in https://www.npmjs.com/package/@noovolari/leapp-core");
    }
  }
}
