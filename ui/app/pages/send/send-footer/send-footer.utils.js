import ethAbi from "ethereumjs-abi";
import ethUtil from "ethereumjs-util";
import { TOKEN_TRANSFER_FUNCTION_SIGNATURE } from "../send.constants";

export function addHexPrefixToObjectValues(obj) {
  return Object.keys(obj).reduce((newObj, key) => {
    return { ...newObj, [key]: ethUtil.addHexPrefix(obj[key]) };
  }, {});
}
export function constructTolarTxParams(opts) {
  let { from, to, gas, gasPrice, data = "", amount } = opts;
  // TODO toni fix gas Price;
  const tx = {
    sender_address: from,
    receiver_address: to,
    amount: amount,
    password: "",
    gas: gas,
    gas_price: gasPrice,
    data,
  };
  console.log("TONI debug  constructTxParams tolar", opts);
  return tx;
}
export function constructTxParams({
  sendToken,
  data,
  to,
  amount,
  from,
  gas,
  gasPrice,
}) {
  const txParams = {
    data,
    from,
    value: "0",
    gas,
    gasPrice,
  };

  if (!sendToken) {
    txParams.value = amount;
    txParams.to = to;
  }
  console.log("TONI debug  constructTxParams", {
    sendToken,
    data,
    to,
    amount,
    from,
    gas,
    gasPrice,
  });

  return addHexPrefixToObjectValues(txParams);
}

export function constructUpdatedTx({
  amount,
  data,
  editingTransactionId,
  from,
  gas,
  gasPrice,
  sendToken,
  to,
  unapprovedTxs,
}) {
  const unapprovedTx = unapprovedTxs[editingTransactionId];
  const txParamsData = unapprovedTx.txParams.data
    ? unapprovedTx.txParams.data
    : data;

  const editingTx = {
    ...unapprovedTx,
    txParams: Object.assign(
      unapprovedTx.txParams,
      addHexPrefixToObjectValues({
        data: txParamsData,
        to,
        from,
        gas,
        gasPrice,
        value: amount,
      })
    ),
  };

  if (sendToken) {
    Object.assign(
      editingTx.txParams,
      addHexPrefixToObjectValues({
        value: "0",
        to: sendToken.address,
        data:
          TOKEN_TRANSFER_FUNCTION_SIGNATURE +
          Array.prototype.map
            .call(
              ethAbi.rawEncode(
                ["address", "uint256"],
                [to, ethUtil.addHexPrefix(amount)]
              ),
              (x) => `00${x.toString(16)}`.slice(-2)
            )
            .join(""),
      })
    );
  }

  if (typeof editingTx.txParams.data === "undefined") {
    delete editingTx.txParams.data;
  }
  console.log("TONI debug amount tx update tx", editingTx);
  return editingTx;
}

export function addressIsNew(toAccounts, newAddress) {
  const newAddressNormalized = newAddress.toLowerCase();
  const foundMatching = toAccounts.some(
    ({ address }) => address.toLowerCase() === newAddressNormalized
  );
  return !foundMatching;
}
