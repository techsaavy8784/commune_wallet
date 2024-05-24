import React from 'react';
import MarketplaceCard from '~components/MarketplaceCard';
import styles from './index.scss';
import Header from '~components/Header';
import { LIVE_ICP_NFT_LIST } from '~global/nfts';
import { keyable } from '~scripts/Background/types/IMainController';
import { RouteComponentProps, useHistory, withRouter } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectAllCollectionInfo,
  selectAssetBySymbol,
  selectStatsOfCollections,
} from '~state/assets';
import { getSymbol } from '~utils/common';
import millify from 'millify';
import { i18nT } from '~i18n/index';

interface Props extends RouteComponentProps<{ accountId: string }> {
  className?: string;
}

const NFTMarketplace = ({
  match: {
    params: { accountId },
  },
}: Props) => {
  const history = useHistory();
  const LIVE_NFTS_WITH_STATS = useSelector(
    selectStatsOfCollections(LIVE_ICP_NFT_LIST)
  );
  const currentUSDValue: keyable = useSelector(
    selectAssetBySymbol(getSymbol('ICP')?.coinGeckoId || '')
  );
  return (
    <div className={styles.page}>
      <Header
        className={styles.header}
        showMenu
        type={'wallet'}
        text={i18nT('nftMarketplace.header')}
      >
        <div className={styles.empty} />
      </Header>
      <div className={styles.mainContainer}>
        {LIVE_NFTS_WITH_STATS.sort(
          (a: keyable, b: keyable) => a.order - b.order
        )
          .sort((a: keyable, b: keyable) => b.total - a.total)
          .map((nftObj: keyable) =>
            nftObj.id == 'vsjkh-vyaaa-aaaak-qajgq-cai' ? (
              <CommuneCollections accountId={accountId} />
            ) : (
              <div
                key={nftObj.id}
                className={styles.nft}
                onClick={() =>
                  history.push(
                    `/nft/collection/${nftObj.id}?accountId=${accountId}`
                  )
                }
              >
                <MarketplaceCard
                  price={
                    nftObj?.floor
                      ? millify(nftObj?.floor * currentUSDValue?.usd, {
                          precision: 2,
                          lowercase: true,
                        })
                      : '-'
                  }
                  volPrice={
                    nftObj.total
                      ? millify(nftObj?.total * currentUSDValue?.usd, {
                          precision: 2,
                          lowercase: true,
                        })
                      : '-'
                  }
                  id={nftObj.id}
                  img={nftObj.icon}
                  text={nftObj.name}
                />
              </div>
            )
          )}
      </div>
    </div>
  );
};

const CommuneCollections = ({ accountId }: { accountId: string }) => {
  const currentUSDValue: keyable = useSelector(
    selectAssetBySymbol(getSymbol('ICP')?.coinGeckoId || '')
  );
  const history = useHistory();
  const collections = useSelector(selectAllCollectionInfo());
  return (
    <>
      {collections.map((nftObj: keyable, index: number) => (
        <div
          key={index}
          className={styles.nft}
          onClick={() =>
            history.push(`/nft/collection/${nftObj.id}?accountId=${accountId}`)
          }
        >
          <MarketplaceCard
            price={
              nftObj?.floor
                ? millify(nftObj?.floor * currentUSDValue?.usd, {
                    precision: 2,
                    lowercase: true,
                  })
                : '0'
            }
            volPrice={
              nftObj.total
                ? millify(nftObj?.total * currentUSDValue?.usd, {
                    precision: 2,
                    lowercase: true,
                  })
                : '0'
            }
            id={nftObj.id}
            img={`https://${nftObj.id}.raw.ic0.app/collection`}
            text={nftObj.name}
          />
        </div>
      ))}
    </>
  );
};

export default withRouter(NFTMarketplace);
