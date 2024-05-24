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
import { selectActiveAccountsByGroupId } from '~state/wallet';
import { LIVE_SYMBOLS_OBJS } from '~global/constant';
import { i18nT } from '~i18n/index';

interface Props extends RouteComponentProps<{ groupId: string }> {}

const AddNetwork = ({
  match: {
    params: { groupId },
  },
}: Props) => {
  const controller = useController();
  const history = useHistory();
  const [checkedArr, setCheckedArr] = useState<string[]>([]);
  const accounts = useSelector(selectActiveAccountsByGroupId(groupId));
  const [existingActive, setExistingActive] = useState<string[]>([]);

  const _UpdateNetworks = useCallback(() => {
    if (existingActive.length > checkedArr.length) {
      //remove accounts
      const removeArr = existingActive.filter((x) => !checkedArr.includes(x));
      const callback = () =>
        history.replace(`/account/details/${accounts[0].address}`);
      controller.accounts.updateActiveAccountsOfGroup(
        groupId,
        removeArr,
        false,
        callback
      );
    } else {
      //add accounts
      const callback = (address: string | undefined) => {
        return history.replace(`/account/details/${address}`);
      };
      controller.accounts.updateActiveAccountsOfGroup(
        groupId,
        checkedArr,
        true,
        callback
      );
    }
  }, [history, checkedArr, checkedArr.length]);

  useEffect(() => {
    let existingActiveAccountSymbols = accounts.map(
      (account) => account.symbol
    );
    accounts.length !== 0 && setCheckedArr(existingActiveAccountSymbols);
    setExistingActive(existingActiveAccountSymbols);
  }, []);

  const toggleSymbol = (symbol: string) => {
    setCheckedArr((checkedArr) => {
      if (checkedArr.includes(symbol)) {
        return checkedArr.filter((_symbol) => _symbol !== symbol);
      } else {
        return [...checkedArr, symbol];
      }
    });
  };

  return (
    <div className={styles.page}>
      <Header type={'wallet'} text={i18nT('addNetwork.header')}>
        <div className={styles.empty} />
      </Header>
      <div className={styles.container}>
        <div className={styles.communeinputCont}>
          <div className={styles.labelText}>
            {i18nT('addNetwork.selectNet')}
          </div>
        </div>
        <div
          className={clsx(styles.communeinputCont, styles.mnemonicInputCont)}
        >
          {LIVE_SYMBOLS_OBJS.map((symbolObj) => (
            <div
              onClick={() => toggleSymbol(symbolObj.symbol)}
              key={symbolObj.symbol}
              className={clsx(
                styles.checkboxCont,
                symbolObj.symbol === 'ICP' && styles.checkboxCont_disabled
              )}
            >
              <div className={styles.checkboxContent}>
                <img src={symbolObj.icon} className={styles.networkIcon} />
                <div className={styles.checkboxTitle}>
                  {symbolObj.name} {'-'} {symbolObj.symbol}
                </div>
              </div>
              {checkedArr.includes(symbolObj.symbol) ? (
                <img
                  className={clsx(
                    styles.checkboxIcon,
                    symbolObj.symbol === 'ICP' && styles.checkboxIcon_disabled
                  )}
                  src={ICON_CHECKED}
                />
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
          onClick={_UpdateNetworks}
        >
          {i18nT('addNetwork.cta')}
        </NextStepButton>
      </div>
    </div>
  );
};

export default withRouter(AddNetwork);
