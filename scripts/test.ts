// eslint-disable-file no-use-before-define
import axios from 'axios';
import UserAgent from 'user-agents';
import { exec } from 'child_process';
const userAgent = new UserAgent();

const addresses = [];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {
  // const requests = addresses.map((address) =>
  //   axios({
  //     method: 'get',
  //     url: `http://localhost:8009/health/${address}`,
  //   }),
  // );
  // const responses = await Promise.all(requests);
  // responses.forEach((response) => console.log(response?.data));
  // for (const address in addresses) {
  //   try {
  //     const response = await axios({
  //       method: 'get',
  //       url: `http://localhost:8009/health/${addresses[address]}`,
  //     });
  //     console.log(response?.data);
  //   } catch (error) {}
  // }
  // const t = await fetch(
  //   'https://multichain-api.birdeye.so/solana/amm/txs/token',
  //   {
  //     headers: {
  //       accept: 'application/json, text/plain, */*',
  //       'accept-language': 'en-US,en;q=0.9',
  //       'agent-id': '8462615c-029d-4561-843b-75f590324957',
  //       'cf-be':
  //         'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3Mjg2Mzk5NzIsImV4cCI6MTcyODY0MDI3Mn0.6nk3Oxlrb4BuJ_YBUBdTlX2j3SCyyTNXAOqK0kSZbZc',
  //       'content-type': 'application/json',
  //       page: 'undefined',
  //       priority: 'u=1, i',
  //       token: 'undefined',
  //       Referer: 'https://birdeye.so/',
  //       'user-agent': `'${userAgent.toString()}'`,
  //       'Referrer-Policy': 'strict-origin-when-cross-origin',
  //     },
  //     body: JSON.stringify({
  //       offset: 15,
  //       limit: 15,
  //       export: false,
  //       query: [
  //         {
  //           keyword: 'owner',
  //           operator: 'in',
  //           value: ['BNnN2MqfWLvgThYBsv6v8JQaYZXYKYahC5YCy27Ct1cX'],
  //         },
  //         {
  //           keyword: 'blockUnixTime',
  //           operator: 'gte',
  //           value: 1728086400,
  //         },
  //         {
  //           keyword: 'blockUnixTime',
  //           operator: 'lte',
  //           value: 1728639972,
  //         },
  //       ],
  //     }),
  //     method: 'POST',
  //   },
  // );
  // const data = await t.json();
  // console.log(data);
  // exec(
  //   `curl --no-keepalive -v -X POST "https://multichain-api.birdeye.so/solana/amm/txs/token" \
  //   -H "accept: application/json, text/plain, */*" \
  //   -H "accept-language: en-US,en;q=0.9" \
  //   -H "agent-id: 8462615c-029d-4561-843b-75f590324957" \
  //   -H "content-type: application/json" \
  //   -H "page: undefined" \
  //   -H "cf-be: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3Mjg4NzgxMDcsImV4cCI6MTcyODg3ODQwN30.wsLYgXb8MZGNghAMOjpat3axVEYIsj0zGvtt6fipbg0" \
  //   -H "priority: u=1, i" \
  //   -H "token: undefined" \
  //   -H "Referer: https://birdeye.so/" \
  //   -H "user-agent: '${userAgent.toString()}'" \
  //   -H "Referrer-Policy: strict-origin-when-cross-origin" \
  //   -d '{"offset":15,"limit":15,"export":false,"query":[{"keyword":"owner","operator":"in","value":["BNnN2MqfWLvgThYBsv6v8JQaYZXYKYahC5YCy27Ct1cX"]},{"keyword":"blockUnixTime","operator":"gte","value":1728086400},{"keyword":"blockUnixTime","operator":"lte","value":1728639972}]}'`,
  //   (error, stdout, stderr) => {
  //     if (error) {
  //       console.error(`Error executing curl: ${error.message}`);
  //       return;
  //     }
  //     if (stderr) {
  //       console.error(`Curl stderr: ${stderr}`);
  //       return;
  //     }
  //     console.log(`Curl response: ${stdout}`);
  //   },
  // );

  const addresses = [
    // '4RdA9pordAbYrY3ZYT8zJdJTfHptbFxxsvQm7sJiXqgZ',
    'E1humH4sxuBZ6whLPbaxi3k3eu8EECG6PVQjdc9jYMkL',
    '64xmSHVyDvDhQ92AgLmrbjA2wuuh4na26MDmgSNofGrW',
    'FPgB5bTYYwSueFKnrd8L3hUsmYNbkWNiNL4frmGKzhyc',
    '7i8o2uWAmh7uUsPzXBBzGoWn4XxvBu1JYsxLRog7A3Gi',
    '8G8DK64Zhdk3ybUMaLAkjo1aqNMk8Y2KB9CeMLmtaqfG',
    'B8yKwyzp5LvcXyYMz3hHdwBt2uNhDJeg8rNH11jdYdvg',
    '8Q3p7w5x1PXyy99kPxEsgrdkp1ExtCyUAzGeXGqMXL8E',
    '8Zf3PKXNw2pFPX3SyDuugxoH62LeGUW8tw1zr2FFvoeU',
    'BtVCfj2gPJNk3WbH2exsP9BVg8Lmt5bpexT8VW39Qete',
    '2iwsLRampx5krdYdyoAuXAaZtx5EjsgMizBHVDSbDkwe',
    'AaQtXpw8wsFyMs2pkb2uFqR7cZQWGXZ1GbmfewbwAQy1',
    'EdB6eCpWrvjMKfDmkQgewMmDfeFL44svrBsjWjbVMnTC',
    '337sxUwQToEkviieAjPS2oNS1RJsWuPewP76x7oWdsVe',
    'E82uKSzbi1YHuEPDkVV93xz5zE7phNeMmENQieyyX3kH',
    '8aHVf4T3t4Z2kjnNojLh87zswhH21EU2iFnVoadN3MXx',
    'B4vdr9dP3v3ufEH58Josom1CGuvAc6Brtbw5jXBpzPbS',
    'FaQQATa15TpZRqbVSCs7VYtFq5rUp9e6zw5zSzdpfPYJ',
    '3QnBeoPMPB3H78WgJssep7rs3A8477LR2FhtwrnZoRie',
    '4U7RCa8R7UZcNz3KUSexmrcMdFMd9WgQqqxb8rX7ffRB',
    '7EUVcvZTgHMhaYxFBD5mQaZPNHgN1ZrZZUMKp91SrsG3',
    'CMDarQhUrahd9f3UNEaC5yfBi5ha8gsLEwP9aHZQeDLG',
    '4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t',
    'DVFpA1mKBWSEuyuiWXQEdrhkyZ8mSPM2Fe7y1KhbbqxT',
    '7i5uAJcfJFr3PhbZ693warsaM4KkU63i31E1ybaPaxmh',
    '6uxX41AkuekEgizRr4LdyNcVHc2P4ZcKHVyZ7W7o4whh',
    '3RNJNvu77Fkw1viJZP3xG29JZT8po3jYRBfDRkYXUkyy',
    'gEphsBBWN3No9991PDcQ1LfmADJZeyhsidEhZDdABMn',
    '2EkhJvG7eunHrecNsAijNx8aGcv2Kjd3schd12Gb5tmp',
    '7uJQYtje74BNztAf6ar7Muq7Sn9UqVY7T3NSu63EDPwo',
    '31TM3M8S8fSp3po9bDMGKpdaFTtywUqejCL8kQEPXsia',
    'BtdKFiJQHXKBHkqZgM3k7zzjjztMEpmAfKtwN8oLAWdh',
    '8deJ9xeUvXSJwicYptA9mHsU2rN2pDx37KWzkDkEXhU6',
    '9oTsfYWULoX9V9X1xJosKquiv2RUxia6XTLZHn6aa5BN',
    '8zFZHuSRuDpuAR7J6FzwyF3vKNx4CVW3DFHJerQhc7Zd',
    'DecXrBS8ADaac7yqLcC6WxNNAfMhVsF1SHmvSNv66yDe',
  ];
  for (const address of addresses) {
    const response = await axios({
      method: 'get',
      url: `http://localhost:8009/wallets/${address}/gained`,
    });
    console.log(response?.data?.status_code, address);
    await sleep(5000);
  }
})();
