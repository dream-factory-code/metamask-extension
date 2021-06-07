import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import Button from "../../../components/ui/button";

export default class InfoTab extends PureComponent {
  state = {
    version: global.platform.getVersion(),
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  renderInfoLinks() {
    const { t } = this.context;

    return (
      <div className="settings-page__content-item settings-page__content-item--without-height">
        <div className="info-tab__link-header">{t("links")}</div>
        {/* <div className="info-tab__link-item">
          <Button
            type="link"
            href="https://taquin.io/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="info-tab__link-text"
          >
            {t("privacyMsg")}
          </Button>
        </div>
        <div className="info-tab__link-item">
          <Button
            type="link"
            href="https://taquin.io/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="info-tab__link-text"
          >
            {t("terms")}
          </Button>
        </div>
        <div className="info-tab__link-item">
          <Button
            type="link"
            href="https://taquin.io/attributions.html"
            target="_blank"
            rel="noopener noreferrer"
            className="info-tab__link-text"
          >
            {t("attributions")}
          </Button>
        </div>
        <hr className="info-tab__separator" />
        <div className="info-tab__link-item">
          <Button
            type="link"
            href="https://support.taquin.io"
            target="_blank"
            rel="noopener noreferrer"
            className="info-tab__link-text"
          >
            {t("supportCenter")}
          </Button>
        </div> */}
        <a href="https://tolar.io/" target="_blank" rel="noopener noreferrer">
          <div className="info-tab__link-item">
            <Button type="link" className="info-tab__link-text">
              {t("visitWebSite")}
            </Button>
          </div>
        </a>
        <div className="info-tab__link-item">
          <a
            href="mailto:info@tolar.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button type="link" className="info-tab__link-text">
              {t("contactUs")}
            </Button>
          </a>
        </div>
      </div>
    );
  }

  render() {
    const { t } = this.context;

    return (
      <div className="settings-page__body">
        <div className="settings-page__content-row">
          <div className="settings-page__content-item settings-page__content-item--without-height">
            <div className="info-tab__logo-wrapper">
              <img src="images/icon-128.png" className="info-tab__logo" />
            </div>
            <div className="info-tab__item">
              <div className="info-tab__version-header">Version</div>
              <div className="info-tab__version-number">
                {this.state.version}
              </div>
            </div>
            <div className="info-tab__item">
              {/* <div className="info-tab__about">{t("builtInCalifornia")}</div> */}
            </div>
          </div>
          {this.renderInfoLinks()}
        </div>
      </div>
    );
  }
}
