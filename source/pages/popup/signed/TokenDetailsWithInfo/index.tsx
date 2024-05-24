import React, { useEffect } from 'react';
import styles from './index.scss';

import Header from '~components/Header';

import { RouteComponentProps, withRouter } from 'react-router';
import ICON_MINT from '~assets/images/icon_mint.svg';
import ICON_STAKE from '~assets/images/th/stake.svg';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import {
  selectInfoBySymbolOrToken,
  selectTokenInfoByContract,
} from '~state/tokens';
import { useSelector } from 'react-redux';
import icon_rec from '~assets/images/icon_rec.svg';
import icon_send from '~assets/images/icon_send.svg';
import millify from 'millify';
import { swapToReth } from '~utils/uniswap';
import { ROCKETPOOL_CONTRACT_ADDR } from '~global/tokens';
import { useController } from '~hooks/useController';
import { selectAccountById } from '~state/wallet';
import { i18nT } from '~i18n/index';

interface Props
  extends RouteComponentProps<{ accountId: string; symbolOrTokenId: string }> {}

const TokenDetailsWithInfo = ({
  match: {
    params: { accountId, symbolOrTokenId },
  },
}: Props) => {
  const history = useHistory();
  const symbolOrTokenInfo = useSelector(
    selectInfoBySymbolOrToken(symbolOrTokenId, accountId)
  );
  const rETHInfo = useSelector(
    selectInfoBySymbolOrToken(ROCKETPOOL_CONTRACT_ADDR, accountId)
  );
  const rETHTokenInfo = useSelector(
    selectTokenInfoByContract(ROCKETPOOL_CONTRACT_ADDR)
  );
  const controller = useController();
  const selectedAccount = useSelector(selectAccountById(accountId));

  const getSwapRatios = async () => {
    await swapToReth(accountId, '0.001', 'RETH');
  };
  useEffect(() => {
    getSwapRatios();
    controller.tokens.updateERC20PriceAndMeta(ROCKETPOOL_CONTRACT_ADDR, 'ETH');
  }, []);

  return (
    <div className={styles.page}>
      <Header type={'wallet'} text={symbolOrTokenInfo?.name}>
        <div className={styles.empty} />
      </Header>
      <div className={styles.body}>
        <div className={styles.section}>
          {symbolOrTokenInfo?.icon ? (
            <img
              className={styles.icon_commune}
              src={symbolOrTokenInfo?.icon}
            />
          ) : (
            <div className={styles.icon_commune}>
              {symbolOrTokenInfo?.name?.charAt(0)}
            </div>
          )}
          <div className={styles.sectitle}>
            {millify(symbolOrTokenInfo?.balanceTxt || 0, {
              precision: 5,
              lowercase: true,
            })}{' '}
            {symbolOrTokenInfo?.symbol}
          </div>
          {isNaN(symbolOrTokenInfo?.price) ? (
            <></>
          ) : (
            <div className={styles.secsubtitle}>
              ${symbolOrTokenInfo?.price || 0}
            </div>
          )}
        </div>
        <div className={styles.cta}>
          {symbolOrTokenInfo.symbol == 'SDR' && (
            <div
              onClick={() =>
                history.push(
                  '/swap/' + accountId + '/' + symbolOrTokenId + '?type=mint'
                )
              }
              className={styles.btnprimary}
            >
              <img src={ICON_MINT} className={styles.btnicon} />
              <div className={styles.btntxt}>
                {i18nT('tokenDetailsWithInfo.mint')}
              </div>
            </div>
          )}

          <div
            onClick={() =>
              history.push(
                '/account/receive/' + accountId + '/' + symbolOrTokenId
              )
            }
            className={styles.btnprimary}
          >
            <img className={styles.btnicon} src={icon_rec} />
            <div className={styles.btntxt}>
              {i18nT('tokenDetailsWithInfo.recv')}
            </div>
          </div>
          <div
            onClick={() =>
              history.push(
                symbolOrTokenInfo?.type == 'symbol'
                  ? '/account/send/' + accountId
                  : '/account/send/' + accountId + '?tokenId=' + symbolOrTokenId
              )
            }
            className={styles.btnprimary}
          >
            <img className={styles.btnicon} src={icon_send} />
            <div className={styles.btntxt}>
              {i18nT('tokenDetailsWithInfo.send')}
            </div>
          </div>
        </div>
        {selectedAccount.symbol == 'ETH' && (
          <div className={styles.cta}>
            <div
              onClick={() => history.push('/stake_eth/' + accountId + '/')}
              className={clsx(styles.btnprimary, styles.btnsecondary)}
            >
              <img src={ICON_STAKE} className={styles.btnicon} />
              <div className={styles.btntxt}>
                {i18nT('tokenDetailsWithInfo.stake')}
              </div>
            </div>
          </div>
        )}
        <div className={styles.stats}>
          {symbolOrTokenInfo.usd_market_cap && (
            <div className={styles.row}>
              <div className={styles.col}>
                <div className={styles.key}>
                  {i18nT('tokenDetailsWithInfo.marketCap')}
                </div>
                <div className={styles.val}>
                  $
                  {millify(symbolOrTokenInfo?.usd_market_cap || 0, {
                    precision: 2,
                    lowercase: true,
                  })}
                </div>
              </div>
              {symbolOrTokenInfo.usd_24h_vol && (
                <div className={styles.col}>
                  <div className={styles.key}>
                    {i18nT('tokenDetailsWithInfo.vol')}
                  </div>
                  <div className={styles.val}>
                    $
                    {millify(Math.abs(symbolOrTokenInfo?.usd_24h_vol || 0), {
                      precision: 2,
                      lowercase: true,
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {symbolOrTokenInfo?.totalSupply && (
            <div className={styles.row}>
              <div className={styles.col}>
                <div className={styles.key}>
                  {i18nT('tokenDetailsWithInfo.maxSupply')}
                </div>
                <div className={styles.val}>
                  {symbolOrTokenInfo?.totalSupply == 'Infinite'
                    ? '∞ Unlimited'
                    : millify(Math.abs(symbolOrTokenInfo?.totalSupply || 0), {
                        precision: 2,
                        lowercase: true,
                      })}
                </div>
              </div>
            </div>
          )}
          {symbolOrTokenId == 'ETH' && (
            <div className={styles.row}>
              <div className={styles.col}>
                <div className={styles.key}>
                  {i18nT('tokenDetailsWithInfo.yourStake')}
                </div>
                <div className={styles.val}>
                  {rETHInfo?.balanceTxt || '0.0'} {rETHInfo?.symbol}
                </div>
              </div>
              {symbolOrTokenInfo.usd_24h_vol && (
                <div className={styles.col}>
                  <div className={styles.key}>
                    {i18nT('tokenDetailsWithInfo.stakeRewards')}
                  </div>
                  <div className={styles.val}>
                    {parseFloat(rETHTokenInfo?.yearlyAPR || 3.6).toFixed(2)}%
                    APR
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withRouter(TokenDetailsWithInfo);
