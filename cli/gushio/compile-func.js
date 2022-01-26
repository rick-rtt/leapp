module.exports = async function compileFunction(shellJs) {
  const result = shellJs.exec('npx tsc')
  if (result.code !== 0)
  {
    throw new Error(result.stderr)
  }
}
