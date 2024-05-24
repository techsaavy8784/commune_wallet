import { CGECKO_PRICE_API } from '~global/constant';
import store from '~state/store';
import type { IAssetsController, keyable } from '../types/IAssetsController';
import { createEntity, storeEntities, updateEntities } from '~state/entities';
import {
  canisterAgent,
  decodeTokenId,
  getNFTsFromCanisterExt,
} from '@earthwallet/assets';
import { parseBigIntToString } from '~utils/common';
import LIVE_ICP_NFT_LIST_CANISTER_IDS, {
  getAirDropNFTInfo,
  getTokenCollectionInfo,
} from '~global/nfts';
import { canisterAgentApi, getTokenIdentifier } from '@earthwallet/assets';
import { isArray } from 'lodash';
import Secp256k1KeyIdentity from '@earthwallet/keyring/build/main/util/icp/secpk256k1/identity';
import { send } from '@earthwallet/keyring';
import { parseObjWithOutBigInt } from '~global/helpers';
import getBrowserFingerprint from 'get-browser-fingerprint';
import {
  getERC721,
  getETHAssetInfo,
  getETHAssetInfo_MATIC,
  registerExtensionAndAccounts,
  statusExtension,
} from '~utils/services';
import { updateExtensionId } from '~state/wallet';
import { Principal } from '@dfinity/principal';

export default class AssetsController implements IAssetsController {
  fetchFiatPrices = async (symbols: keyable, currency = 'USD') => {
    try {
      const activeAssetIds = symbols.toString();

      store.dispatch(
        storeEntities({
          entity: 'prices',
          data: symbols.map((symbol: string) => {
            return { id: symbol, loading: true, error: false };
          }),
        })
      );
      const data = await (
        await fetch(
          `${CGECKO_PRICE_API}?ids=${activeAssetIds}&vs_currencies=${currency}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
        )
      ).json();
      store.dispatch(
        storeEntities({
          entity: 'prices',
          data: Object.keys(data).map((coinGeckoId) => {
            return {
              id: coinGeckoId,
              ...data[coinGeckoId],
              loading: false,
              error: false,
            };
          }),
        })
      );
      return;
    } catch (error) {
      console.log('fecthing CGECKO_PRICE_API error => ', error);
    }
    return;
  };

  fetchICPAssets = async (account: keyable, canisterId: string) => {
    const tokens: keyable = await getNFTsFromCanisterExt(
      canisterId,
      account.address
    );
    if (tokens == undefined) {
      console.log('error getNFTsFromCanisterExt', canisterId, account.address);
      return {};
    }
    const parsedTokens = tokens?.map((token: keyable) => ({
      id: token.tokenIdentifier,
      address: account.address,
      canisterId,
      symbol: account.symbol,
      ...parseBigIntToString(token),
    }));

    return parsedTokens;
  };

  fetchCommuneArtCollection = async (collectionId: string) => {
    let response;
    let responseListing;

    response = await canisterAgentApi(collectionId, 'getRegistry');
    response.map((item: keyable) =>
      store.dispatch(
        storeEntities({
          entity: 'assets',
          data: [
            {
              symbol: 'ICP',
              id: getTokenIdentifier(collectionId, item[0]),
              index: item[0],
              tokenIndex: item[0],
              tokenIdentifier: getTokenIdentifier(collectionId, item[0]),
              canisterId: collectionId,
              address: item[1],
              image: `https://${collectionId}.raw.ic0.app/?cc=0&type=thumbnail&tokenid=${getTokenIdentifier(
                collectionId,
                item[0]
              )}`,
            },
          ],
        })
      )
    );

    responseListing = await canisterAgentApi(collectionId, 'listings');

    responseListing.map((item: keyable) =>
      store.dispatch(
        updateEntities({
          entity: 'assets',
          key: getTokenIdentifier(collectionId, item[0]),
          data: {
            forSale: item[1] && item[1].price.toString() ? true : false,
            price: item[1] && item[1].price.toString(),
          },
        })
      )
    );
  };

  fetchListingsByUser = async (
    address: string,
    collectionId = 'vsjkh-vyaaa-aaaak-qajgq-cai'
  ) => {
    const response = await canisterAgent({
      canisterId: getTokenCollectionInfo(collectionId).marketplaceId || '',
      method: 'getNFTsListingsByUser',
      args: { address: address },
    });

    if (response != null) {
      response.map((token: keyable) => {
        return (
          token[0] &&
          store.dispatch(
            updateEntities({
              entity: 'assets',
              key: getTokenIdentifier(
                token[0].nft?.nftCanister.toText(),
                token[0].nft.nftIdentifier.nat32.toString()
              ),
              data: {
                loading: false,
                forSale: true,
                info: {
                  price: token[0].price.toString(),
                  symbol: Object.keys(token[0].symbol)[0].toUpperCase(),
                },
              },
            })
          )
        );
      });
    }
  };
  fetchCollectionInfo = async (collectionId: string) => {
    const response = await canisterAgentApi(
      collectionId,
      'getCollectionWithNFTS'
    );
    const state = store.getState();

    if (state.entities.collectionInfo == null) {
      store.dispatch(createEntity({ entity: 'collectionInfo' }));
    }
    response &&
      store.dispatch(
        updateEntities({
          entity: 'collectionInfo',
          key: collectionId,
          data: {
            type: 'CommuneArt',
            name: response.name,
            description: response.description,
            fee: response.fee?.toString(),
            nftCount: response.nftCount?.toString(),
          },
        })
      );
  };
  fetchCommuneNFT = async (collectionId: string, tokenId: number) => {
    store.dispatch(
      updateEntities({
        entity: 'assets',
        key: getTokenIdentifier(collectionId, tokenId),
        data: {
          loading: true,
        },
      })
    );
    const response = await canisterAgentApi(
      collectionId,
      'getListingByTokenID',
      tokenId
    );
    const forSale = response[0] == null ? false : true;

    store.dispatch(
      updateEntities({
        entity: 'assets',
        key: getTokenIdentifier(collectionId, tokenId),
        data: {
          loading: false,
          forSale,
          info: {
            price:
              response[0] == null
                ? 0
                : typeof response[0][1].price == 'bigint'
                ? response[0][1].price.toString()
                : response[0][1].price,
          },
        },
      })
    );
  };

  getCommuneArtCollectionInfo = async () => {
    const response = await canisterAgent({
      canisterId: 'vsjkh-vyaaa-aaaak-qajgq-cai',
      method: 'getCollections',
    });
    response.map((canister: Principal) =>
      this.fetchCollectionInfo(canister.toText())
    );
  };
  getCollectionStats = async () => {
    this.getCommuneArtCollectionInfo();
    let allStats: keyable = [];
    const state = store.getState();

    if (state.entities.collectionStats == null) {
      store.dispatch(createEntity({ entity: 'collectionStats' }));
    }
    for (const [
      index,
      canisterId,
    ] of LIVE_ICP_NFT_LIST_CANISTER_IDS.entries()) {
      let response: keyable = [];
      try {
        store.dispatch(
          storeEntities({
            entity: 'collectionStats',
            data: [
              {
                id: canisterId,
                loading: true,
              },
            ],
          })
        );
        const response: keyable = await canisterAgentApi(canisterId, 'stats');
        allStats[index] = response;
      } catch (error) {
        store.dispatch(
          storeEntities({
            entity: 'collectionStats',
            data: [
              {
                id: canisterId,
                error: 'Error with method stats',
                loading: false,
              },
            ],
          })
        );
        console.log(error);
      }

      if (isArray(response) && response?.length > 0) {
        const stats = {
          total: (Number(response[0] / 1000000n) / 100).toFixed(2),
          high: (Number(response[1] / 1000000n) / 100).toFixed(2),
          low: (Number(response[2] / 1000000n) / 100).toFixed(2),
          floor: (Number(response[3] / 1000000n) / 100).toFixed(2),
          listings: Number(response[4]),
          tokens: Number(response[5]),
          sales: Number(response[6]),
          average: Number(response[6])
            ? (Number(response[0] / (response[6] * 1000000n)) / 100).toFixed(2)
            : '-',
        };
        const _stats = parseObjWithOutBigInt(stats);
        store.dispatch(
          storeEntities({
            entity: 'collectionStats',
            data: [
              {
                id: canisterId,
                ..._stats,
                loading: false,
              },
            ],
          })
        );
      }
    }
  };

  getICPAssetsOfAccount = async (account: keyable) => {
    const state = store.getState();

    let allTokens: keyable = [];
    store.dispatch(
      storeEntities({
        entity: 'assetsCount',
        data: [
          {
            id: account.address,
            symbol: account.symbol,
            loading: true,
            error: false,
          },
        ],
      })
    );

    try {
      for (const [
        index,
        canisterId,
      ] of LIVE_ICP_NFT_LIST_CANISTER_IDS.entries()) {
        if (canisterId === 'vsjkh-vyaaa-aaaak-qajgq-cai') {
          const response = await canisterAgent({
            canisterId,
            method: 'getNFTsByUser',
            args: [{ address: account.address }, []],
          });

          allTokens[index] = response.map((_token: any[]) => {
            const canisterId = _token[1]?.toText();
            const id = getTokenIdentifier(_token[1]?.toText(), _token[0]);
            const collectionInfo =
              state.entities?.collectionInfo?.byId[canisterId];
            if (collectionInfo == null) {
              this.fetchCollectionInfo(canisterId);
            }
            return {
              id,
              type: 'CommuneArt',
              tokenIdentifier: id,
              address: account.address,
              symbol: account.symbol,
              tokenIndex: _token[0],
              canisterId: canisterId,
            };
          });

          this.fetchListingsByUser(account.address, canisterId);
        } else {
          allTokens[index] = await this.fetchICPAssets(account, canisterId);
        }
      }
      let tokens = allTokens.flat();
      if (tokens.length === 0) {
        store.dispatch(
          storeEntities({
            entity: 'assetsCount',
            data: [
              {
                id: account.address,
                symbol: account.symbol,
                count: 0,
                loading: false,
              },
            ],
          })
        );
      } else {
        store.dispatch(
          storeEntities({
            entity: 'assetsCount',
            data: [
              {
                id: account.address,
                symbol: account.symbol,
                count: tokens.length,
                loading: false,
              },
            ],
          })
        );

        const state = store.getState();
        const existingAssets =
          state.entities.assets?.byId &&
          Object.keys(state.entities.assets?.byId)
            ?.map((id) => state.entities.assets.byId[id])
            .filter((assets) => assets.address === account.address);
        const existingCount = existingAssets?.length;

        if (existingCount != tokens?.length) {
          existingAssets?.map((token: keyable) =>
            store.dispatch(
              storeEntities({
                entity: 'assets',
                data: [{ ...token, ...{ address: '' } }],
              })
            )
          );
        }
        //cache the assets
        tokens.map((token: keyable) =>
          store.dispatch(
            storeEntities({
              entity: 'assets',
              data: [token],
            })
          )
        );
      }
    } catch (error) {
      console.log('Unable to load assets', error);
      store.dispatch(
        storeEntities({
          entity: 'assetsCount',
          data: [
            {
              id: account.address,
              symbol: account.symbol,
              count: 0,
              loading: false,
              errorMessage: 'Unable to load assets',
              error: true,
            },
          ],
        })
      );
    }
  };

  getETHAssetsOfAccount = async (account: keyable) => {
    const state = store.getState();
    let allTokens: keyable = [];
    store.dispatch(
      storeEntities({
        entity: 'assetsCount',
        data: [
          {
            id: account.id,
            symbol: account.symbol,
            loading: true,
            error: false,
          },
        ],
      })
    );

    try {
      allTokens[0] = await getERC721(account.address, account.symbol);

      let tokens = allTokens.flat();
      const tokensWithId = tokens.map((asset: keyable) => ({
        ...asset,
        ...{
          id: asset.contractAddress + '_WITH_' + asset.tokenID,
          symbol: account.symbol,
        },
      }));
      const tokensRepeatCount = tokensWithId.reduce(
        (acc: { [x: string]: number }, curr: { id: any }) => {
          const { id } = curr;
          if (acc[id]) ++acc[id];
          else acc[id] = 1;
          return acc;
        },
        {}
      );
      const tokensAfterRemovingOutTokens = tokensWithId.filter(
        (obj: { id: string | number }) => tokensRepeatCount[obj.id] == 1
      );
      if (tokensAfterRemovingOutTokens.length === 0) {
        store.dispatch(
          storeEntities({
            entity: 'assetsCount',
            data: [
              {
                id: account.id,
                symbol: account.symbol,
                count: 0,
                loading: false,
              },
            ],
          })
        );
      } else {
        store.dispatch(
          storeEntities({
            entity: 'assetsCount',
            data: [
              {
                id: account.id,
                symbol: account.symbol,
                count: tokensAfterRemovingOutTokens.length,
                loading: false,
              },
            ],
          })
        );

        const existingAssets =
          state.entities.assets?.byId &&
          Object.keys(state.entities.assets?.byId)
            ?.map((id) => state.entities.assets.byId[id])
            .filter(
              (assets) =>
                assets.address == account.address &&
                assets.symbol == account.symbol
            );
        const existingCount = existingAssets?.length;

        if (existingCount != tokensAfterRemovingOutTokens?.length) {
          existingAssets?.map((token: keyable) =>
            store.dispatch(
              storeEntities({
                entity: 'assets',
                data: [{ ...token, ...{ address: '' } }],
              })
            )
          );
        }
        //cache the assets
        tokensAfterRemovingOutTokens.map((token: keyable) => {
          const id = token.contractAddress + '_WITH_' + token.tokenID;
          let asset = {
            ...token,
            id,
            tokenIndex: token.tokenID,
            symbol: account.symbol,
            address: account.address,
          };
          if (
            state.entities.assets.byId[id] == undefined ||
            state.entities.assets.byId[id].tokenImage == undefined
          ) {
            this.updateETHAssetInfo(asset);
          }

          return store.dispatch(
            storeEntities({
              entity: 'assets',
              data: [asset],
            })
          );
        });
      }
    } catch (error) {
      console.log('Unable to load assets', error);
      store.dispatch(
        storeEntities({
          entity: 'assetsCount',
          data: [
            {
              id: account.id,
              symbol: account.symbol,
              count: 0,
              loading: false,
              errorMessage: 'Unable to load assets',
              error: true,
            },
          ],
        })
      );
    }
  };

  getAssetsOfAccountsGroup = async (accountsGroup: keyable[][]) => {
    for (const accounts of accountsGroup) {
      for (const account of accounts) {
        if (account.symbol === 'ICP') {
          this.getICPAssetsOfAccount(account);
        } else if (account.symbol == 'ETH' || account.symbol == 'MATIC') {
          this.getETHAssetsOfAccount(account);
        }
      }
    }
  };

  updateTokenCollectionDetails = async (asset: keyable) => {
    if (asset?.canisterId === 'ntwio-byaaa-aaaak-qaama-cai') {
      this.fetchCommuneNFT(asset?.canisterId, asset?.tokenIndex);
      return;
    }

    const allTokens: keyable = await this.fetchICPAssets(
      asset.address,
      asset.canisterId
    );

    let tokens = allTokens.flat();
    tokens.map((token: keyable) =>
      store.dispatch(
        storeEntities({
          entity: 'assets',
          data: [token],
        })
      )
    );
  };

  transferCommuneArt = async (
    identityJSON: string,
    nftId: string,
    recipient: string,
    amount: number,
    address: string,
    callback?: (path: string) => void
  ) => {
    const state = store.getState();

    if (state.entities.recents == null) {
      store.dispatch(createEntity({ entity: 'recents' }));
    }

    store.dispatch(
      updateEntities({
        entity: 'recents',
        key: recipient,
        data: {
          symbol: 'ICP',
          addressType: 'accountId',
          lastSentAt: new Date().getTime(),
          sentBy: address,
        },
      })
    );

    const currentIdentity = Secp256k1KeyIdentity.fromJSON(identityJSON);

    const response: keyable = await canisterAgent({
      canisterId: decodeTokenId(nftId).canister,
      method: 'safeTransferFrom',
      args: {
        to: {
          address: recipient,
        },
        notify: false,
        tokenIndex: decodeTokenId(nftId).index,
        from: {
          address: address,
        },
        memo: [],
      },

      fromIdentity: currentIdentity,
    });
    console.log(response, amount, 'res');
    callback && callback('s');
    this.getICPAssetsOfAccount({ address, symbol: 'ICP' });
    if (state.entities.accounts.byId[recipient] != undefined) {
      this.getICPAssetsOfAccount({ recipient, symbol: 'ICP' });
    }
    return;
  };

  updateTokenDetails = async ({
    id,
    address,
    price,
  }: {
    id: string;
    address: string;
    price?: number;
  }) => {
    if (price === undefined || price === null) {
      store.dispatch(
        updateEntities({
          entity: 'assets',
          key: id,
          data: { address },
        })
      );
    } else if (price === 0) {
      store.dispatch(
        updateEntities({
          entity: 'assets',
          key: id,
          data: {
            address,
            forSale: false,
          },
        })
      );
    } else {
      store.dispatch(
        updateEntities({
          entity: 'assets',
          key: id,
          data: {
            address,
            forSale: true,
            info: { price: price * 100000000 },
          },
        })
      );
    }
  };

  buyNft = async (
    txnId: string,
    identityJSON: string,
    asset: keyable,
    price: number,
    accountId: string,
    callback?: (path: string) => void
  ) => {
    const nftId = asset.id;
    const state = store.getState();
    const { address } = state.entities.accounts.byId[accountId];

    if (state.entities.txnRequests == null) {
      store.dispatch(createEntity({ entity: 'txnRequests' }));
    }

    if (asset.type == 'CommuneArt') {
      alert('CommuneArt buy');
    }

    store.dispatch(
      storeEntities({
        entity: 'txnRequests',
        data: [
          {
            id: txnId,
            loading: true,
            address: address,
            createdAt: new Date().getTime(),
            status: 'Making Offer',
            current: 1,
            total: 3,
            type: 'buyNft',
            nftId,
          },
        ],
      })
    );
    const currentIdentity = Secp256k1KeyIdentity.fromJSON(identityJSON);
    const canisterId = decodeTokenId(nftId).canister;
    let lockAddressRes: any;
    const _getRandomBytes = () => {
      var bs = [];
      for (var i = 0; i < 32; i++) {
        bs.push(Math.floor(Math.random() * 256));
      }
      return bs;
    };
    try {
      lockAddressRes = await canisterAgentApi(
        canisterId,
        'lock',
        [nftId, price, address, _getRandomBytes()],
        currentIdentity
      );
    } catch (error: any) {
      console.log(error);
      store.dispatch(
        storeEntities({
          entity: 'txnRequests',
          data: [
            {
              id: txnId,
              loading: false,
              status: '',
              error: error?.message,
              current: 1,
              total: 3,
              type: 'buyNft',
              nftId,
            },
          ],
        })
      );
      return;
    }

    const lockAddress = lockAddressRes?.ok;

    if (lockAddress == undefined) {
      store.dispatch(
        storeEntities({
          entity: 'txnRequests',
          data: [
            {
              id: txnId,
              loading: false,
              status: '',
              error: lockAddressRes?.err.Other,
              current: 1,
              total: 3,
              type: 'buyNft',
              nftId,
            },
          ],
        })
      );
      return;
    }
    store.dispatch(
      storeEntities({
        entity: 'txnRequests',
        data: [
          {
            id: txnId,
            loading: true,
            status: 'Transferring ICP',
            current: 2,
            total: 3,
            type: 'buyNft',
            nftId,
          },
        ],
      })
    );
    const selectedAmount = parseFloat((price / Math.pow(10, 8)).toFixed(8));
    let index: BigInt = 0n;
    try {
      index = await send(
        currentIdentity,
        lockAddress,
        address,
        selectedAmount,
        'ICP'
      );
      console.log(index);
    } catch (error: any) {
      store.dispatch(
        storeEntities({
          entity: 'txnRequests',
          data: [
            {
              id: txnId,
              loading: false,
              status: '',
              error: error?.message,
              current: 2,
              total: 3,
              type: 'buyNft',
              nftId,
              sendIndex: index?.toString(),
            },
          ],
        })
      );
      return;
    }

    store.dispatch(
      storeEntities({
        entity: 'txnRequests',
        data: [
          {
            id: txnId,
            loading: true,
            status: 'Settling Transaction',
            current: 3,
            total: 3,
            type: 'buyNft',
            nftId,
          },
        ],
      })
    );
    const settle = await canisterAgentApi(
      canisterId,
      'settle',
      nftId,
      currentIdentity
    );

    this.getICPAssetsOfAccount({ address, symbol: 'ICP' });
    if (settle?.err?.Other == 'Insufficient funds sent') {
      store.dispatch(
        storeEntities({
          entity: 'txnRequests',
          data: [
            {
              id: txnId,
              loading: false,
              status: '',
              error: 'Insufficient funds sent',
              current: 3,
              total: 3,
              type: 'buyNft',
              nftId,
            },
          ],
        })
      );
    } else {
      store.dispatch(
        storeEntities({
          entity: 'txnRequests',
          data: [
            {
              id: txnId,
              loading: false,
              status: '',
              current: 3,
              total: 3,
              type: 'buyNft',
              nftId,
            },
          ],
        })
      );
      callback && callback(`/nft/bought/${nftId}?accountId=${accountId}`);
    }
  };

  updateETHAssetInfo = async (asset: keyable) => {
    let response;
    try {
      if (asset?.symbol == 'ETH') {
        response = await getETHAssetInfo(asset);
      } else if (asset?.symbol == 'MATIC') {
        response = await getETHAssetInfo_MATIC(asset);
      }
    } catch (error) {}
    store.dispatch(
      updateEntities({
        entity: 'assets',
        key: asset.id,
        data: {
          video: response?.metadata?.animation_url,
          tokenImage:
            response?.image_url ||
            (response?.media[0] && response?.media[0]?.gateway) ||
            response?.image,
          description:
            response?.asset_contract?.description || response?.description,
          collectionImage: response?.asset_contract?.image_url,
        },
      })
    );
    return;
  };

  registerExtensionForAirdrop = async () => {
    const fingerprint = getBrowserFingerprint();

    const state = store.getState();
    let extensionId;
    if (state.wallet?.extensionId == '') {
      extensionId = fingerprint.toString();
      store.dispatch(updateExtensionId(extensionId));
    } else {
      extensionId = state.wallet.extensionId;
    }
    const ETHAccounts =
      state.entities.accounts?.byId &&
      Object.keys(state.entities.accounts?.byId)
        ?.map((id) => state.entities.accounts.byId[id])
        .filter((account) => account.symbol == 'ETH' && account.active)
        .map((account) => account.address);

    if (ETHAccounts.length == 0) {
      return;
    }
    const communeAirdrop = getAirDropNFTInfo();

    if (state.entities.airdrops == null) {
      store.dispatch(createEntity({ entity: 'airdrops' }));
    }

    store.dispatch(
      updateEntities({
        entity: 'airdrops',
        key: communeAirdrop?.id,
        data: {
          loading: true,
        },
      })
    );
    if (!communeAirdrop.isLive) {
      store.dispatch(
        updateEntities({
          entity: 'airdrops',
          key: communeAirdrop.id,
          data: {
            airdropEnabled: false,
            loading: false,
          },
        })
      );
      return;
    }
    const status = await statusExtension(extensionId);
    if (!status?.airdropEnabled) {
      store.dispatch(
        updateEntities({
          entity: 'airdrops',
          key: communeAirdrop.id,
          data: {
            airdropEnabled: false,
            loading: false,
          },
        })
      );
      return;
    } else {
      store.dispatch(
        updateEntities({
          entity: 'airdrops',
          key: communeAirdrop?.id,
          data: {
            ctaObj: status?.ctaObj,
            totalVerifications: status?.totalVerifications,
            airdropEnabled: true,
            accountIdVerified: status?.accountIdVerified,
            loading: false,
          },
        })
      );
    }
    if (status?.accountIds?.length != ETHAccounts.length) {
      const response = await registerExtensionAndAccounts(
        extensionId,
        ETHAccounts
      );
      if (response.status == 'success') {
        store.dispatch(
          updateEntities({
            entity: 'airdrops',
            key: communeAirdrop?.id,
            data: {
              registered: true,
            },
          })
        );
      }
    }
  };
}
