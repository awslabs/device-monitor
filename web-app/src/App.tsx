/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import './App.scss';
import './login-background.css';
import './custom-styles.css'; // Import the new custom styles
import {
  useState,
  useEffect,
  useCallback,
  type ReactElement,
  type FunctionComponent
} from 'react';
import {
  signOut,
  fetchUserAttributes,
  type FetchUserAttributesOutput
} from 'aws-amplify/auth';
// Import the prototyping logo
import prototypingLogo from './assets/prototyping-logo-color.png';
import {
  ThemeProvider,
  withAuthenticator,
  type Theme
} from '@aws-amplify/ui-react';
// Import the Amplify UI styles explicitly
import '@aws-amplify/ui-react/styles.css';
import { Routes, Route, useLocation, type Location } from 'react-router-dom';
import { applyTheme } from '@cloudscape-design/components/theming';
import { applyMode, Mode } from '@cloudscape-design/global-styles';
import { I18nProvider } from '@cloudscape-design/components/i18n';
import messages from '@cloudscape-design/components/i18n/messages/all.en';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import Home from './components/home/index';
import { DevicesPage } from './components/devices';
import type { GenericReactState } from '@bfw/shared/src/types';
import AppLayout from '@cloudscape-design/components/app-layout';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import { JobsPage } from './components/jobs';
import { JobDetailPage } from './components/job';
import { DeviceDetailWrapper } from './components/DeviceDetailWrapper';
import SuperGraphic from './assets/supergraphic.svg';
import { Breadcrumbs } from './components/Breadcrumbs';
import { type FollowFunction, useFollow } from './hooks/UseFollow';
import type { ButtonDropdownProps } from '@cloudscape-design/components/button-dropdown';
import Box from '@cloudscape-design/components/box';
import { cloudscapeDarkTheme, cloudscapeLightTheme } from './config/theme';
import { useAuthGroups, type UseAuthGroups } from './hooks/UseAuthGroups';
import { useAws } from './context/AwsContext';
import { DeviceGroupsList } from './components/DeviceGroupsList';

const LOCALE: string = 'en';

let COLOR_MODE: Mode = Mode.Light;
if (
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
) {
  COLOR_MODE = Mode.Dark;
}
applyTheme({
  theme: COLOR_MODE === Mode.Light ? cloudscapeLightTheme : cloudscapeDarkTheme
});
applyMode(COLOR_MODE);

function Layout(): ReactElement {
  const { groups }: UseAuthGroups = useAuthGroups();
  const [
    userAttributes,
    setUserAttributes
  ]: GenericReactState<FetchUserAttributesOutput | null> =
    useState<FetchUserAttributesOutput | null>(null);
  useEffect((): void => {
    async function loadUser(): Promise<void> {
      setUserAttributes(await fetchUserAttributes());
    }
    loadUser().catch(console.error);
  }, []);
  const handleFollow: FollowFunction = useFollow();
  const location: Location = useLocation();
  useAws();
  return (
    <I18nProvider locale={LOCALE} messages={[messages]}>
      <div id="header-wrapper">
        <img
          src={SuperGraphic}
          alt="FleetWatch Supergraphic"
          id="supergraphic"
        />
        <TopNavigation
          identity={{
            href: '/',
            title: 'FleetWatch',
            onFollow: (event: CustomEvent<object>): void =>
              handleFollow(event, '/')
          }}
          utilities={[
            {
              type: 'menu-dropdown',
              text: userAttributes ? userAttributes.email : 'Loading...',
              description: userAttributes ? userAttributes.email : 'Loading...',
              iconName: 'user-profile',
              onItemClick: ({
                detail
              }: CustomEvent<ButtonDropdownProps.ItemClickDetails>): void => {
                if (detail.id === 'signout') {
                  signOut({ global: true }).catch(console.error);
                }
              },
              items: [
                ...(groups.includes('developers')
                  ? [
                      {
                        id: 'external',
                        text: 'External Links',
                        items: []
                      }
                    ]
                  : []),
                {
                  id: 'signout',
                  text: 'Sign out'
                }
              ]
            }
          ]}
        />
      </div>
      <AppLayout
        breadcrumbs={<Breadcrumbs />}
        headerSelector="#header-wrapper"
        navigation={
          <div className="side-navigation-container">
            <SideNavigation
              activeHref={location.pathname.split('/').splice(0, 2).join('/')}
              onFollow={handleFollow}
              header={{
                text: 'Home',
                href: '/'
              }}
              items={[
                {
                  type: 'link',
                  text: 'Devices',
                  href: '/devices'
                },
                {
                  type: 'link',
                  text: 'Device Groups',
                  href: '/groups'
                },
                { type: 'link', text: 'Firmware Updates', href: '/jobs' }
              ]}
            />
            <div className="side-menu-logo-container">
              <img
                src={prototypingLogo}
                alt="FleetWatch Logo"
                className="side-menu-logo"
              />
            </div>
          </div>
        }
        content={
          <>
            <Routes>
              <Route index element={<Home />} />
              <Route path="devices">
                <Route index element={<DevicesPage />} />
                <Route path=":thingName" element={<DeviceDetailWrapper />} />
              </Route>
              <Route path="jobs">
                <Route index element={<JobsPage />} />
                <Route path=":jobId" element={<JobDetailPage />} />
              </Route>
              <Route path="/groups" element={<DeviceGroupsList />} />
            </Routes>
          </>
        }
        toolsHide
      />
    </I18nProvider>
  );
}

function App(): ReactElement {
  // Create a custom theme with transparent backgrounds
  const amplifyTheme: Theme = {
    name: 'fleetWatchTheme',
    overrides: [
      {
        colorMode: 'light',
        tokens: {
          components: {
            authenticator: {
              modal: {
                // Modal styling
              },
              container: {
                // Container styling
              }
            }
          }
        }
      }
    ]
  };

  const AuthWrapper: FunctionComponent = withAuthenticator(Layout, {
    hideSignUp: true,
    components: {
      Header: useCallback(
        (): ReactElement => (
          <Box textAlign="center">
            <img
              src={prototypingLogo}
              style={{ width: '300px', height: 'auto' }}
              alt="FleetWatch Logo"
            />
          </Box>
        ),
        []
      )
    },
    // Add configuration to support username login
    formFields: {
      signIn: {
        username: {
          label: 'Username or Email',
          placeholder: 'Enter your username or email',
          isRequired: true,
          autocomplete: 'username'
        }
      }
    },
    loginMechanisms: ['username', 'email'],
    // Add custom styling for the authenticator
    socialProviders: [],
    variation: 'modal'
  });
  return (
    <ThemeProvider theme={amplifyTheme} colorMode={COLOR_MODE}>
      <AuthWrapper />
    </ThemeProvider>
  );
}

export default App;
