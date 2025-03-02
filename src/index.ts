/**
 * The entrypoint for the action. This file simply imports and runs the action's
 * main logic.
 */
import { run } from './main'

/* istanbul ignore next */
export { run }

// Auto-execute when running as an action
if (process.env.GITHUB_ACTIONS) {
  run()
}
