import 'emoji-log';
import { wrapStore } from 'webext-redux';
import { browser, Runtime } from 'webextension-polyfill-ts';

import { STATE_PORT } from '~global/constant';
import store from '~state/store';
import MainController from './controllers/MainController';
import { messagesHandler } from './controllers/MessageHandler';
import type { IMainController } from './types/IMainController';

browser.runtime.onInstalled.addListener((): void => {
  console.log('status:', 'commune wallet extension installed');
});

declare global {
  interface Window {
    controller: Readonly<IMainController>;
  }
}

if (!window.controller) {
  window.controller = Object.freeze(new MainController());
}

browser.runtime.onConnect.addListener((port: Runtime.Port) => {
  console.log('status', 'commune wallet extension onConnect');

  if (port.name === 'commune') {
    messagesHandler(port, window.controller);
  }
});

wrapStore(store, { portName: STATE_PORT });
