import {cleanupRun, RUN_ID, sweepStale} from '../test/e2e/fixtures.js'

// With E2E_RUN_ID set, this process shares the run id with the mocha run that
// just finished, so cleanupRun can reclaim that run's boards directly — by
// run id, not by full board name, since the epoch in the name is per process
// (see isRunBoardName). That is what covers a mocha killed before its `after`
// hooks ran — the job timeout in the CI workflow, or a local Ctrl-C — whose
// fixtures are far too young for sweepStale's one-hour cutoff to touch.
if (process.env.E2E_RUN_ID) {
  const closed = await cleanupRun()
  console.log(`Cleaned up ${closed} board(s) for run "${RUN_ID}".`)
}

const closed = await sweepStale()
console.log(`Swept ${closed} stale e2e board(s).`)
