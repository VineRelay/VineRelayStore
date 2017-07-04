import React from 'react';
import { createFragmentContainer, QueryRenderer, graphql } from 'react-relay';
import { withRouter } from 'react-router';
import styled from 'styled-components';
import relayEnvironment from 'app/config/relay';
import Paper from 'material-ui/Paper';
import Snackbar from 'material-ui/Snackbar';
import PageError from 'app/components/Common/PageError';
import PageLoader from 'app/components/Common/PageLoader';
import Login from 'app/components/Admin/Auth/Login';
import { setToken } from 'app/utils/token';
import {
  isValidationError,
  getErrorValidationMessage,
  getErrorMessage,
} from 'app/utils/error';
import loginUserToAdminMutation from './loginUserToAdminMutation';

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EEE;
`;

const LoginWrapper = styled(Paper)`
  padding: 16px;
`;

class LoginRoute extends React.Component {

  componentWillMount() {
    if(this.props.viewer.isAdmin) {
      this.props.history.replace(`/admin`);
    }

    this.setState({
      errorMessage: '',
      emailError: '',
      passwordError: '',
      isLoading: false,
    });
  }

  onLoginError = (error) => {
    // Handle validation error
    if(isValidationError(error)) {
      this.setState({
        emailError: getErrorValidationMessage(error, 'email'),
        passwordError: getErrorValidationMessage(error, 'password'),
        isLoading: false,
      });
    // Unexpected errors
    } else {
      this.setState({
        errorMessage: getErrorMessage(error),
        isLoading: false,
      });
    }
  }

  onLoginSuccess = (token) => {
    this.setState({
      isLoading: false,
    });
    // Set token and change location to admin
    setToken(token);
    this.props.history.replace(`/admin`);
  }

  onComplete = ({ loginUser }, errors) => {
    if(errors) {
      this.onLoginError(errors[0]);
    } else {
      this.onLoginSuccess(loginUser.token);
    }
  }

  onSubmit = ({ email, password }) => {
    this.setState({
      emailError: '',
      passwordError: '',
      errorMessage: '',
      isLoading: true,
    })

    loginUserToAdminMutation({ email, password }, this.onComplete);
  }

  render() {
    const {
      emailError,
      passwordError,
      errorMessage,
      isLoading,
    } = this.state;

    return (
      <Wrapper>
        <LoginWrapper>
          <Login
            onSubmit={this.onSubmit}
            emailError={emailError}
            passwordError={passwordError}
            errorMessage={errorMessage}
            submitDisabled={isLoading}
          />
        </LoginWrapper>
        <Snackbar
          open={!!errorMessage}
          message={errorMessage || ''}
          autoHideDuration={4000}
          onRequestClose={() => this.setState({ errorMessage: '' })}
        />
      </Wrapper>
    );
  }
}

const LoginRouteContainer = createFragmentContainer(
  withRouter(LoginRoute),
  graphql`
    fragment LoginRoute_viewer on User {
      isAdmin
    }
  `
);

export default ({ render }) => (
  <QueryRenderer
    environment={relayEnvironment}
    query={graphql`
      query LoginRouteQuery {
        viewer {
          ...LoginRoute_viewer
        }
      }
    `}
    render={({ error, props }) => {
      if (error) {
        return <PageError error={error} />;
      }

      if (props) {
        return <LoginRouteContainer {...props} />;
      }

      return <PageLoader />;
    }}
  />
);
