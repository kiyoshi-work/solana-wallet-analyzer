# Solana Wallet Analyzer

## Description
The **Solana Wallet Analyzer** is a powerful tool designed to help users analyze the buy and sell behavior of a specific address on the Solana blockchain. By leveraging parsed transaction data from Solana RPC nodes, this project provides insights into swap activities, allowing users to understand trading patterns and make informed decisions.

## Features
- **Transaction Analysis**: Analyze buy/sell behavior of addresses through detailed transaction data, utilizing parsed transaction information from Solana RPC nodes. The analysis is based on `preTokenBalances` and `postTokenBalances`, employing a rule-based system to interpret transaction data effectively.
- **Caching Mechanism**: Incorporates a robust caching mechanism to minimize the number of price requests to external paid data sources, such as Birdeye, enhancing performance and reducing costs.
- **Batch Processing**: Efficiently processes large lists of addresses in batches to optimize performance.

## Installation & Usage
To get started with the Solana Transaction Analyzer, follow these steps:

### Prerequisites
- Node.js (version 18 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/kiyoshi-work/solana-wallet-analyzer
   ```
2. Navigate to the project directory:
   ```bash
   cd solana-wallet-analyzer
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

### Usage
1. Configure your environment variables (see .env.sample), including Solana RPC URLs and any necessary API keys for external data sources.
2. Run the application:
   ```bash
   npm run start:dev
   ```
3. Use the following API endpoints:
   - **Analyze a Wallet**: 
     - `GET /wallets/:user_address/analyze`
     - This endpoint analyzes the specified wallet address and returns insights on its buy/sell behavior.
   - **Aggregate Information**: 
     - `GET /wallets/aggregate`
     - This endpoint aggregates information from all addresses in the dataset.

4. Implement the following SQL query to analyze user token data:
  - **PNL statistic and trading strategy**
  ``` sql
  WITH ordered_gain AS (
    SELECT user_address, token_address, pnl, pnl_percent, total_sell_solana, total_buy_solana, hold_time, latest_sell, earliest_buy, num_buy, stdev_buy, mean_buy, num_sell, stdev_sell, mean_sell
    FROM gain
    WHERE pnl != 'NAN' AND pnl != 0 and pnl_percent != 'Infinity'::float and hold_time >= 0
  --  for normal case not wrong detect
    and pnl_percent < 1000000 
  --  and token_address = 'xxxx'
    ORDER BY pnl DESC
  )
  SELECT * 
  FROM (
      SELECT 
          user_address,
          array_remove(array_agg(case when pnl > 0 then token_address end ORDER BY pnl_percent DESC), NULL) as list_token_positive,
          ARRAY_REMOVE(ARRAY_AGG(CASE WHEN pnl > 0 THEN (pnl_percent / 100 + 1) end order by pnl_percent desc), NULL) AS list_pnl_percent_positive,
          SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) AS num_pnl_positive,
          SUM(CASE WHEN pnl > 0 THEN pnl END) AS total_pnl_positive,
          MAX(CASE WHEN pnl > 0 THEN (pnl_percent / 100 + 1) END) AS max_pnl_percent_positive,
          AVG(CASE WHEN pnl > 0 THEN (pnl_percent / 100 + 1) END) AS avg_pnl_percent_positive,
          STDDEV(CASE WHEN pnl > 0 THEN (pnl_percent / 100 + 1) END) AS stdev_pnl_percent_positive,
          ARRAY_REMOVE(ARRAY_AGG(CASE WHEN pnl > 0 THEN pnl end order by pnl_percent desc), NULL) AS list_pnl_positive,
  --        MIN(CASE WHEN pnl > 0 THEN earliest_buy END) AS min_earliest_buy,
          array_remove(array_agg(case when pnl > 0 then hold_time end ORDER BY pnl_percent DESC), NULL) as list_holdtime_positive

  --        SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) AS num_pnl_negative,
      FROM 
          ordered_gain 
      GROUP BY 
          user_address
  ) AS subquery
  WHERE 
      num_pnl_positive > 0
  ORDER BY 
      max_pnl_percent_positive DESC;
  ``` 
  - **Fast trade**
  ``` sql
  SELECT 
      user_address, 
      array_agg(token_address ORDER BY pnl DESC) AS list_token, 
      array_agg(pnl ORDER BY pnl DESC) AS list_pnl, 
      AVG(pnl) AS avg_pnl, 
      MAX(pnl) AS max_pnl, 
      array_agg(hold_time ORDER BY pnl DESC) AS list_hold_time, 
      array_agg(num_buy ORDER BY pnl DESC) AS list_num_buy, 
      COUNT(token_address) AS num_token,
      ARRAY_AGG(pnl_percent / 100 + 1 ORDER BY pnl_percent DESC) AS list_pnl_percent
  FROM gain g 
  WHERE 
      pnl != 'NAN' 
      AND pnl != 0 
      AND pnl_percent != 'Infinity'::float 
      AND pnl_percent < 1000000 
      and hold_time >= 0 and pnl > 100000 and hold_time < 10
  GROUP BY user_address 
  ORDER BY num_token DESC;
  ```

  - **Transactions:**
  ``` sql
  select * from transactions t 
  where signer = 'xxxx' 
  and (from_address = 'yyyy' or to_address = 'yyyy')
  order by block_time desc;
  ```
## TODOs
- Correct the parsing function to ensure accurate transaction data interpretation.

## Acknowledgements
- **@solana/web3.js**
- **@metaplex-foundation/js**
- **Birdeye**

