import { App } from '@capacitor/app';

let inflightWait: Promise<void> | null = null;

async function waitUntilActive(): Promise<void> {
  const state = await App.getState();
  if (state.isActive === true) {
    return;
  }

  if (inflightWait) {
    return inflightWait;
  }

  inflightWait = new Promise<void>((resolve) => {
    let resolved = false;
    let handle: {
      remove: () => void;
    } | null = null;

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive === true && resolved === false) {
        resolved = true;
        if (handle) {
          handle.remove();
        }
        resolve();
        inflightWait = null;
      }
    }).then((h) => {
      handle = h;
      if (resolved === true) {
        handle.remove();
      }
    });
  });

  return inflightWait;
}

async function runWhenActive<T>(fn: () => Promise<T>): Promise<T> {
  await waitUntilActive();
  return fn();
}

export { runWhenActive, waitUntilActive };
