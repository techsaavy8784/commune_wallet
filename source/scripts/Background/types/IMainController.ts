import { Windows } from 'webextension-polyfill-ts';
import { NetworkSymbol } from '~global/types';
import { CommuneProvider } from '~scripts/Provider/CommuneProvider';
import { IAccountsController } from './IAccountsController';
import { IAssetsController } from './IAssetsController';
import { IDAppController } from './IDAppController';
import { ITokensController } from './ITokensController';

export interface keyable {
  [key: string]: any;
}

export interface IMainController {
  accounts: Readonly<IAccountsController>;
  assets: Readonly<IAssetsController>;
  dapp: Readonly<IDAppController>;
  tokens: Readonly<ITokensController>;
  provider: Readonly<CommuneProvider>;
  preloadState: () => Promise<string | null>;
  isHydrated: () => boolean;
  migrateLocalStorage: () => Promise<keyable>;
  createPopup: (
    windowId: string,
    route?: string,
    asset?: NetworkSymbol
  ) => Promise<Windows.Window | null>;
  updateOverrideEthereum: (state: boolean) => void;
  updateLanguage: (lang: string) => void;
}
