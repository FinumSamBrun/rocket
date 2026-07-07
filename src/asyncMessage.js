/** @typedef {import('node:worker_threads').MessagePort} MessagePort */
/** @typedef {MessagePort & {sendAndWait: (message: any) => any; _wait: PromiseWithResolvers<any>}} AsyncPort */

/**
 * Turns a MessagePort into an AsyncPort, which can wait for responses.
 *
 * Do not use sendAndWait from inside module customization hooks: the main
 * thread may be blocked in Atomics.wait (e.g. during a nested
 * module.register() call) and unable to reply, which deadlocks the hook.
 *
 * @param {MessagePort} port
 * @returns {AsyncPort}
 */
export function makeAsyncPort(port) {
  const p = /** @type {AsyncPort} */ (port);
  p._wait = Promise.withResolvers();
  p.on('message', message => {
    p._wait.resolve(message);
    p._wait = Promise.withResolvers();
  });
  p.sendAndWait = message => {
    const wait = p._wait;
    p.postMessage(message);
    return wait.promise;
  };
  return p;
}
