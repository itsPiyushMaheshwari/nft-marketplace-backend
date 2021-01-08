const fetch = require("node-fetch");
const redis = require("redis");
const client = redis.createClient(6379);

async function getTokenData(
  tokenId,
  contractAddress,
  isOpenseaCompatible,
  tokenURI,
  description
) {
  const redisKey = "metadata:" + contractAddress + ":" + tokenId;

  return new Promise((resolve, reject) => {
    client.get(redisKey, async (err, details) => {
      if (err) {
        reject(err);
      }

      if (details) {
        resolve(JSON.parse(details));
      } else {
        let url;
        if (isOpenseaCompatible) {
          url =
            "https://api.opensea.io/api/v1/assets?&token_ids=" +
            tokenId +
            "&asset_contract_address=" +
            contractAddress;
        } else {
          url = tokenURI + tokenId;
        }

        fetch(url)
          .then((response) => {
            return response.json();
          })
          .then((details) => {
            let metadata = {};

            if (isOpenseaCompatible) {
              if (details.assets.length > 0) {
                metadata = {
                  name: details["assets"][0].name,
                  description: details["assets"][0].description,
                  image: details["assets"][0].image_url,
                  attributes: details["assets"][0].traits,
                  external_link: details["assets"][0].external_link,
                };
              }
            }else{

              metadata = {
                name: details.name,
                description: description,
                image: details.image,
              };
            }

            client.setex(redisKey, 86400, JSON.stringify(metadata));
            resolve(metadata);
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  });
}

module.exports = {
  getTokenData,
};