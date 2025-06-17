/**
 * Copyright 2025 Amazon.com, Inc. and its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *   http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 *
 */

import { type ReactElement } from 'react';
import './index.css';

export default function Footer(): ReactElement {
  const year: string = new Date().toISOString().split('-')[0];

  return (
    <div className="container">
      <img
        src="/prototyping-logo-white.png"
        height="40x"
        alt="AWS PACE Prototyping logo"
      />
      <a
        target="_blank"
        href="https://aws.amazon.com/"
        className="flex flex-column"
        rel="noreferrer"
      >
        <div>AWS | PACE</div>
        <div className="font-size-10">
          Industries Prototyping and Customer Engineering
        </div>
      </a>
      <span className="flex" />
      <div className="font-size-10 copyright">
        Copyright © {year} Amazon Web Services, Inc. or its affiliates. All
        rights reserved.
      </div>
    </div>
  );
}
