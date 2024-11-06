// eslint-disable-file no-use-before-define
import axios from 'axios';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {
  const addresses = ['4RdA9pordAbYrY3ZYT8zJdJTfHptbFxxsvQm7sJiXqgZ'];
  for (const address of addresses) {
    const response = await axios({
      method: 'get',
      url: `http://localhost:8009/wallets/${address}/gained`,
    });
    console.log(response?.data?.status_code, address);
    await sleep(5000);
  }
})();
