import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { debounce } from "lodash";
import Identicon from "../../../../components/ui/identicon";
import TextField from "../../../../components/ui/text-field";
import { CONTACT_LIST_ROUTE } from "../../../../helpers/constants/routes";
import {
  isValidAddress,
  isValidDomainName,
} from "../../../../helpers/utils/util";
import EnsInput from "../../../send/send-content/add-recipient/ens-input";
import PageContainerFooter from "../../../../components/ui/page-container/page-container-footer";
import { validateTolarAddress } from "../../../../store/actions";
export default class AddContact extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    addToAddressBook: PropTypes.func,
    history: PropTypes.object,
    scanQrCode: PropTypes.func,
    qrCodeData:
      PropTypes.object /* eslint-disable-line react/no-unused-prop-types */,
    qrCodeDetected: PropTypes.func,
  };

  state = {
    newName: "",
    ethAddress: "",
    ensAddress: "",
    error: "",
    ensError: "",
  };

  constructor(props) {
    super(props);
    this.dValidate = debounce((a) => {
      this.validate(a).then();
    }, 1000);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.qrCodeData) {
      if (nextProps.qrCodeData.type === "address") {
        const scannedAddress = nextProps.qrCodeData.values.address.toLowerCase();
        const currentAddress = this.state.ensAddress || this.state.ethAddress;
        if (currentAddress.toLowerCase() !== scannedAddress) {
          this.setState({ ethAddress: scannedAddress, ensAddress: "" });
          // Clean up QR code data after handling
          this.props.qrCodeDetected(null);
        }
      }
    }
  }
  isValidTolarAddressFormat = (address) => {
    if (!/^54|^0x54/.test(address)) return false;
    const cleanAddress = address.replace(/^0x54/, "");
    return cleanAddress.length === 50;
  };

  validate = async (address) => {
    try {
      const valid = this.isValidTolarAddressFormat(address);
      await validateTolarAddress(address);

      if (valid || address === "") {
        this.setState({ error: "", ethAddress: address, tolAddress: address });
      } else {
        this.setState({ error: "Invalid Address" });
      }
    } catch (e) {
      this.setState({ error: "Invalid Address" });
    }
  };

  renderInput() {
    return (
      <EnsInput
        className="send__to-row"
        scanQrCode={(_) => {
          this.props.scanQrCode();
        }}
        onChange={this.dValidate}
        onPaste={(text) => this.setState({ ethAddress: text })}
        onReset={() => this.setState({ ethAddress: "", ensAddress: "" })}
        updateEnsResolution={(address) => {
          return this.setState({
            ensAddress: address,
            error: "",
            ensError: "",
          });
        }}
        updateEnsResolutionError={(message) => {
          return this.setState({ ensError: message });
        }}
      />
    );
  }

  render() {
    const { t } = this.context;
    const { history, addToAddressBook } = this.props;

    const errorToRender = this.state.ensError || this.state.error;

    return (
      <div className="settings-page__content-row address-book__add-contact">
        {this.state.ensAddress && (
          <div className="address-book__view-contact__group">
            <Identicon address={this.state.ensAddress} diameter={60} />
            <div className="address-book__view-contact__group__value">
              {this.state.ensAddress}
            </div>
          </div>
        )}
        <div className="address-book__add-contact__content">
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              {t("userName")}
            </div>
            <TextField
              type="text"
              id="nickname"
              value={this.state.newName}
              onChange={(e) => this.setState({ newName: e.target.value })}
              fullWidth
              margin="dense"
            />
          </div>

          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              {t("ethereumPublicAddress")}
            </div>
            {this.renderInput()}
            {errorToRender && (
              <div className="address-book__add-contact__error">
                {errorToRender}
              </div>
            )}
          </div>
        </div>
        <PageContainerFooter
          cancelText={this.context.t("cancel")}
          disabled={Boolean(this.state.error)}
          onSubmit={async () => {
            await addToAddressBook(
              this.state.ensAddress || this.state.ethAddress,
              this.state.newName
            );
            history.push(CONTACT_LIST_ROUTE);
          }}
          onCancel={() => {
            history.push(CONTACT_LIST_ROUTE);
          }}
          submitText={this.context.t("save")}
          submitButtonType="confirm"
        />
      </div>
    );
  }
}
