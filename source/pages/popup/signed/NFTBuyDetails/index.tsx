import React from 'react';
import styles from './index.scss';
import { useHistory } from 'react-router-dom';
import { RouteComponentProps, withRouter } from 'react-router';
import Header from '~components/Header';
import { keyable } from '~scripts/Background/types/IMainController';
import { getCommuneArtCollectionIcon, getTokenImageURL } from '~global/nfts';
import clsx from 'clsx';
import useQuery from '~hooks/useQuery';
import { decodeTokenId } from '@earthwallet/assets';
import useToast from '~hooks/useToast';
import { useSelector } from 'react-redux';
import { selectAccountById, selectBalanceById } from '~state/wallet';
import { selectCollectionInfo } from '~state/assets';
import ICON_PLACEHOLDER from '~assets/images/icon_placeholder.png';
import { i18nT } from '~i18n/index';

interface Props extends RouteComponentProps<{ nftId: string }> {
  className?: string;
}

const NFTBuyDetails = ({
  match: {
    params: { nftId },
  },
}: Props) => {
  const queryParams = useQuery();
  const price: number = parseInt(queryParams.get('price') || '');
  const accountId: string = queryParams.get('accountId') || '';
  const type: string = queryParams.get('type') || '';
  const selectedAccount = useSelector(selectAccountById(accountId));
  const { address } = selectedAccount;

  const history = useHistory();
  const currentBalance: keyable = useSelector(selectBalanceById(address));

  const canisterId = decodeTokenId(nftId).canister;
  const tokenIndex = decodeTokenId(nftId).index;

  const asset: keyable = {
    canisterId,
    id: nftId,
    type,
    tokenIndex,
    tokenIdentifier: nftId,
  };
  const { show } = useToast();

  const assetCollectionInfo: keyable = useSelector(
    selectCollectionInfo(canisterId)
  );

  const buy = () => {
    if (1 != 1 && currentBalance?.value < price) {
      show('Not Enough Balance');
    } else {
      history.push(
        `/nft/settle/${nftId}?price=${price}&accountId=${accountId}&type=${type}`
      );
    }
  };
  return (
    <div className={styles.page}>
      <div className={styles.stickyheader}>
        <Header showBackArrow text={''} type={'wallet'}></Header>
      </div>
      <div
        className={styles.fullImage}
        style={{ backgroundImage: `url(${getTokenImageURL(asset)})` }}
      >
        <div className={styles.actions}>
          <div
            onClick={() => buy()}
            className={clsx(styles.action, styles.secAction)}
          >
            {i18nT('nftBuyDetails.buy')}
          </div>
        </div>
      </div>
      <div className={styles.mainCont}>
        <div className={styles.transCont}>
          <div className={styles.title}>{tokenIndex}</div>
          <div className={styles.subtitleCont}>
            <div className={styles.subtitle}>
              {i18nT('nftBuyDetails.forSale')}
            </div>
            {
              <div className={styles.price}>
                {(price / 100000000).toFixed(3)} ICP
              </div>
            }
          </div>
          <div className={styles.sep}></div>
          <div className={styles.creatorCont}>
            <img
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = ICON_PLACEHOLDER;
              }}
              src={
                asset?.type == 'CommuneArt'
                  ? getCommuneArtCollectionIcon(canisterId)
                  : assetCollectionInfo?.icon
              }
              className={styles.creatorIcon}
            ></img>
            <div className={styles.creatorInfo}>
              <div className={styles.creatorTitle}>
                {assetCollectionInfo?.name}
              </div>
              <div className={styles.creatorSubtitle}>
                {assetCollectionInfo?.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withRouter(NFTBuyDetails);
