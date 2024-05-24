import React, { useState, useEffect, useCallback } from 'react';
import styles from './index.scss';
import ICON_CHECKED from '~assets/images/icon_checkbox_checked.svg';
import ICON_UNCHECKED from '~assets/images/icon_checkbox_unchecked.svg';

import NextStepButton from '~components/NextStepButton';
import Header from '~components/Header';
import clsx from 'clsx';
import { useController } from '~hooks/useController';
import { useHistory } from 'react-router-dom';
import { RouteComponentProps, withRouter } from 'react-router';
import { useSelector } from 'react-redux';
import { selectActiveTokensByAddress, selectTokensInfo } from '~state/tokens';
import { keyable } from '~scripts/Background/types/IAssetsController';
import { selectAccountById } from '~state/wallet';
import { i18nT } from '~i18n/index';
interface Props extends RouteComponentProps<{ accountId: string }> {}

const SelectTokens = ({
  match: {
    params: { accountId },
  },
}: Props) => {
  const controller = useController();
  const history = useHistory();
  const selectedAccount = useSelector(selectAccountById(accountId));
  const { address } = selectedAccount;

  const tokenInfos = useSelector(selectTokensInfo(address));
  const tokens = useSelector(selectActiveTokensByAddress(address));
  const [checkedArr, setCheckedArr] = useState<string[]>([]);
  const [existingActive, setExistingActive] = useState<string[]>([]);

  useEffect(() => {
    let existingActiveAccountTokens = tokens.map(
      (token: { id: string }) => token.id
    );
    tokens.length !== 0 && setCheckedArr(existingActiveAccountTokens);
    setExistingActive(existingActiveAccountTokens);
  }, []);

  const toggleToken = (tokenPair: string) => {
    setCheckedArr((checkedArr) => {
      if (checkedArr.includes(tokenPair)) {
        return checkedArr.filter((_tokenPair) => _tokenPair !== tokenPair);
      } else {
        return [...checkedArr, tokenPair];
      }
    });
  };

  const updateTokens = useCallback(() => {
    if (existingActive.length > checkedArr.length) {
      //remove tokens
      const removeArr = existingActive.filter((x) => !checkedArr.includes(x));
      const callback = () => history.replace(`/account/details/${address}`);
      controller.tokens.updateTokensOfNetwork(
        address,
        removeArr,
        false,
        callback
      );
    } else {
      //add tokens

      const callback = (address: string | undefined) =>
        history.replace(`/account/details/${address}`);
      controller.tokens.updateTokensOfNetwork(
        address,
        checkedArr,
        true,
        callback
      );
    }
  }, [history, checkedArr, checkedArr.length, existingActive.length]);
  return (
    <div className={styles.page}>
      <Header type={'wallet'} text={i18nT('tokensListed.header')}>
        <div className={styles.empty} />
      </Header>
      <div className={styles.container}>
        <div className={styles.communeinputCont}>
          <div className={styles.labelText}>{i18nT('tokensListed.cta')}</div>
        </div>
        <div
          className={clsx(styles.communeinputCont, styles.mnemonicInputCont)}
        >
          {tokenInfos.map((tokenObj: keyable) => (
            <div
              onClick={() => toggleToken(address + '_WITH_' + tokenObj.id)}
              key={tokenObj.symbol}
              className={clsx(
                styles.checkboxCont,
                tokenObj.symbol === 'ICP' && styles.checkboxCont_disabled
              )}
            >
              <div className={styles.checkboxContent}>
                {tokenObj?.icon != undefined ? (
                  <img src={tokenObj?.icon} className={styles.networkIcon} />
                ) : (
                  <div className={styles.networkIcon}>
                    {tokenObj?.name?.charAt(0)}
                  </div>
                )}
                <div className={styles.checkboxTitle}>
                  <div>{tokenObj.name}</div>
                  <div>{tokenObj.symbol}</div>
                </div>
              </div>
              {checkedArr.includes(address + '_WITH_' + tokenObj?.id) ? (
                <img className={clsx(styles.checkboxIcon)} src={ICON_CHECKED} />
              ) : (
                <img className={styles.checkboxIcon} src={ICON_UNCHECKED} />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.nextCont}>
        <NextStepButton
          disabled={existingActive.length === checkedArr.length}
          onClick={() => updateTokens()}
        >
          {i18nT('addNetwork.cta')}
        </NextStepButton>
      </div>
    </div>
  );
};

export default withRouter(SelectTokens);
