import { decodeTokenId } from '@earthwallet/assets';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { RouteComponentProps, useHistory, withRouter } from 'react-router-dom';
import Header from '~components/Header';
import { getTokenImageURL } from '~global/nfts';
import useQuery from '~hooks/useQuery';
import { keyable } from '~scripts/Background/types/IMainController';
import { getPopupTxn, selectAssetBySymbol } from '~state/assets';
import { getSymbol, isJsonString, PASSWORD_MIN_LENGTH } from '~utils/common';
import styles from './index.scss';
import NextStepButton from '~components/NextStepButton';
import InputWithLabel from '~components/InputWithLabel';
import { decryptString } from '~utils/vault';
import { selectAccountById } from '~state/wallet';
import { validateMnemonic } from '@earthwallet/keyring';
import Warning from '~components/Warning';
import { useController } from '~hooks/useController';
import { v4 as uuid } from 'uuid';
import swapCircle from '~assets/images/swapLoadingCircle.svg';
import { i18nT } from '~i18n/index';

const txnId = uuid();

interface Props extends RouteComponentProps<{ nftId: string }> {}
const NFTSettle = ({
  match: {
    params: { nftId },
  },
}: Props) => {
  const queryParams = useQuery();
  const price: number = parseInt(queryParams.get('price') || '');
  const accountId: string = queryParams.get('accountId') || '';
  const type: string = queryParams.get('type') || '';

  const canisterId = decodeTokenId(nftId).canister;
  const tokenIndex = decodeTokenId(nftId).index;
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [pass, setPass] = useState('');
  const selectedAccount = useSelector(selectAccountById(accountId));
  const { address } = selectedAccount;

  const asset: keyable = {
    canisterId,
    id: nftId,
    tokenIndex,
    type,
    tokenIdentifier: nftId,
  };
  const currentUSDValue: keyable = useSelector(
    selectAssetBySymbol(getSymbol('ICP')?.coinGeckoId || '')
  );
  const usdValue = currentUSDValue?.usd;
  const controller = useController();
  const history = useHistory();

  const txnStatusObj: keyable = useSelector(getPopupTxn(txnId));

  const onPassChange = useCallback(
    (password: string) => {
      setPass(password);
      setError('');

      let secret = '';
      try {
        secret =
          selectedAccount?.symbol !== 'ICP'
            ? decryptString(selectedAccount?.vault.encryptedMnemonic, password)
            : decryptString(selectedAccount?.vault.encryptedJson, password);
      } catch (error) {
        setError(i18nT('common.wrongPass'));
      }
      if (
        selectedAccount?.symbol === 'ICP'
          ? !isJsonString(secret)
          : !validateMnemonic(secret)
      ) {
        setError(i18nT('common.wrongPass'));
      } else {
        setError('NO_ERROR');
      }
    },
    [selectedAccount]
  );

  const handleSign = async () => {
    setIsBusy(true);
    let secret = '';

    try {
      secret = decryptString(selectedAccount?.vault.encryptedJson, pass);
    } catch (error) {
      setError(i18nT('common.wrongPass'));
      setIsBusy(false);
    }

    if (isJsonString(secret)) {
      const callback = (path: string) => history.replace(path);

      controller.assets
        .buyNft(txnId, secret, asset, price, address, callback)
        .then(() => {
          setIsBusy(false);
        });
    }
  };

  return (
    <div className={styles.page}>
      <Header
        className={styles.header}
        showMenu
        type={'wallet'}
        text={
          txnStatusObj?.loading
            ? i18nT('nftSettle.headerLoading')
            : i18nT('nftSettle.header')
        }
      >
        <div className={styles.empty} />
      </Header>
      {txnStatusObj?.loading ? (
        <Settling asset={asset} {...txnStatusObj} />
      ) : (
        <div className={styles.scrollCont}>
          {txnStatusObj?.error && (
            <div className={styles.errorResponse}>{txnStatusObj?.error}</div>
          )}
          <div className={styles.internetCompWrapContainer}>
            <div className={styles.imgCont}>
              <img
                src={getTokenImageURL(asset)}
                className={styles.ethIconContainer}
              ></img>
            </div>
            <div className={styles.ethTextContainer}>
              <span className={styles.ethereumText}>{tokenIndex}</span>
              <span className={styles.ethVal}>
                {price / Math.pow(10, 8)} ICP
              </span>
              <span className={styles.usdText}>
                ${((price * usdValue) / Math.pow(10, 8)).toFixed(3)}
              </span>
            </div>
            <div className={styles.communeFeeContainer}>
              <span className={styles.communeFeeText}>
                {i18nT('nftSettle.netFee')}
              </span>
              <div className={styles.communeFeeRightSideContainer}>
                <span className={styles.communeVal}>0.0001 ICP</span>
                <span className={styles.convertedVal}>
                  ${(0.0001 * usdValue).toFixed(3)}
                </span>
              </div>
            </div>
            <div className={styles.gasFeeContainer}>
              <div className={styles.leftSideContainer}>
                <span className={styles.gasFeeText}>
                  {i18nT('nftSettle.marketFee')}
                </span>
              </div>
              <div className={styles.rightSideContainer}>
                <span className={styles.communeText}>
                  {i18nT('nftSettle.free')}
                </span>
                <span className={styles.convertedVal}>$0.00</span>
              </div>
            </div>

            <div className={styles.totalContainer}>
              <span className={styles.totalText}>
                {i18nT('nftSettle.total')}
              </span>
              <div className={styles.rightSideTotalContainer}>
                <span className={styles.totalcommuneVal}>
                  {price / Math.pow(10, 8)} ICP
                </span>
                <span className={styles.totalUSDVal}>
                  ${((price * usdValue) / Math.pow(10, 8)).toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {txnStatusObj?.loading ? (
        <div />
      ) : (
        <section className={styles.footer}>
          <InputWithLabel
            data-export-password
            disabled={isBusy}
            isError={pass.length < PASSWORD_MIN_LENGTH || !!error}
            label={i18nT('common.passwordForAc')}
            onChange={onPassChange}
            placeholder={i18nT('common.requiredPlaceholder')}
            type="password"
          />
          {false && error && error != 'NO_ERROR' && (
            <Warning isBelowInput isDanger>
              {error}
            </Warning>
          )}
          <div className={styles.actions}>
            <NextStepButton
              loading={isBusy}
              disabled={error != 'NO_ERROR'}
              onClick={handleSign}
            >
              {i18nT('nftSettle.cta')}
            </NextStepButton>
          </div>
        </section>
      )}
    </div>
  );
};

const Settling = (props: keyable) => {
  return (
    <div className={styles.settleContainer}>
      <img src={swapCircle} className={styles.swapCircleImg} />
      <img src={props.logo} className={styles.nftLoadingImg}></img>
      <span className={styles.quoteText}>
        Step {props.current} of {props.total}
      </span>
      <span className={styles.submittingText}>{props.status}</span>
      <div className={styles.progressBar}>
        <div
          className={styles.leftSide}
          style={{ width: (270 / props.total) * props.current }}
        ></div>
        <div
          className={styles.rightSide}
          style={{ width: (270 / props.total) * (props.total - props.current) }}
        ></div>
      </div>
    </div>
  );
};

export default withRouter(NFTSettle);
