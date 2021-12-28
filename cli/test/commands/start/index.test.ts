import {expect, test} from '@oclif/test'

describe('start', () => {
  test
  .stdout()
  .command(['start', '-i', ''])
  .it('runs start cmd', ctx => {
    expect(ctx.stdout).to.contain('')
  })
})
