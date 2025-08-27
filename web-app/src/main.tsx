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
/* eslint-disable */
import './fonts.css';
import './index.css'; // Import the index.css file with background styles
import '@aws-amplify/ui-react/styles.css';
import '@cloudscape-design/global-styles/index.css';
import '@cloudscape-design/global-styles/dark-mode-utils.css';
import { StrictMode, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AwsProvider, useAws } from '../src/context/AwsContext';
import { initializeAmplify } from './AmplifyConfig';

async function renderApp(): Promise<void> {
  const rootElement: HTMLElement | null = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  try {
    // Initialize Amplify once before rendering the app
    const config = await initializeAmplify();

    createRoot(rootElement).render(
      <StrictMode>
        <BrowserRouter>
          <AwsProvider initialAccountId={config.account}>
            <App />
          </AwsProvider>
        </BrowserRouter>
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize application:', error);
    rootElement.innerHTML =
      '<div style="color: red; padding: 20px;">Failed to initialize application. Please try again later.</div>';
  }
}

renderApp();
