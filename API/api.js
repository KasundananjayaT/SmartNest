import axios from "axios";

const LINK =
  "https://api.thingspeak.com/channels/2226903/feeds.json?api_key=L2IYF2O5Y9VAVR5M&results=7";

export const getDatafromF1 = () => {
  return axios.get(LINK);
};
