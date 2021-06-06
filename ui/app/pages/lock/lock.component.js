import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import Loading from "../../components/ui/loading-screen";
import { DEFAULT_ROUTE } from "../../helpers/constants/routes";

export default class Lock extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    isUnlocked: PropTypes.bool,
    lockTaquin: PropTypes.func,
  };

  componentDidMount() {
    const { lockTaquin, isUnlocked, history } = this.props;

    if (isUnlocked) {
      lockTaquin().then(() => history.push(DEFAULT_ROUTE));
    } else {
      history.replace(DEFAULT_ROUTE);
    }
  }

  render() {
    return <Loading />;
  }
}
