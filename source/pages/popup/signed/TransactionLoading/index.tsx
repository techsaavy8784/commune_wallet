import React from 'react';
import styles from './index.scss';
import logo from '~assets/images/ew.svg';
import downArrow from '~assets/images/downArrow.svg';

const TransactionLoading = () => {
  return (
    <div className={styles.page}>
      <span className={styles.updateTime}>Last updated 10 seconds ago</span>
      <div className={styles.ethWrapContainer}>
        <span className={styles.ethWrapText}>500</span>
        <img src={logo} className={styles.logo} />
        <span className={styles.ethWrapText}>COMAI</span>
      </div>
      <div className={styles.downArrowContainer}>
        <img src={downArrow} />
      </div>
      <div className={styles.internetCompWrapContainer}>
        <div className={styles.ethIconContainer}></div>
        <div className={styles.ethTextContainer}>
          <span className={styles.ethereumText}>Ethereum</span>
          <span className={styles.ethVal}>1.0869565 ETH</span>
          <span className={styles.usdText}>$10,092.22</span>
          <span className={styles.conversionText}>
            1 COMAI = 0.002173913043 ETH
          </span>
        </div>
        <div className={styles.gasFeeContainer}>
          <div className={styles.leftSideContainer}>
            <span className={styles.gasFeeText}>Estimated Gas Fee</span>
            <button className={styles.editButton}>Edit</button>
          </div>
          <div className={styles.rightSideContainer}>
            <span className={styles.communeText}>0.002625 COMAI</span>
            <span className={styles.convertedVal}>$10.52</span>
          </div>
        </div>
        <div className={styles.communeFeeContainer}>
          <span className={styles.communeFeeText}>COMAI Fee</span>
          <div className={styles.communeFeeRightSideContainer}>
            <span className={styles.communeVal}>0.0005 COMAI</span>
            <span className={styles.convertedVal}>$10.52</span>
          </div>
        </div>
        <div className={styles.totalContainer}>
          <span className={styles.totalText}>Total</span>
          <div className={styles.rightSideTotalContainer}>
            <span className={styles.totalcommuneVal}>500 COMAI</span>
            <span className={styles.totalUSDVal}>$4,018.41</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionLoading;
