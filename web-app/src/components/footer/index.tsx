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
