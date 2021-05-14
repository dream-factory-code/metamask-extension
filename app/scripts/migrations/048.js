import { cloneDeep } from "lodash";

const version = 47;

/**
 * Stringify the `metamaskNetworkId` property of all transactions
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

function transformState(state) {
  return state;
}
