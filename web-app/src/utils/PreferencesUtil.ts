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

import type { ContentDisplay } from '@bfw/shared/src/appsync';

export const findWidthInContentDisplay: (
  targetColumnName: string,
  config: Array<ContentDisplay> | null
) => number = (
  targetColumnName: string,
  contentDisplay: Array<ContentDisplay> | null
): number => {
  const defaultWidth: number = 200;
  if (!contentDisplay) {
    return defaultWidth;
  } else {
    const width: number | null | undefined = contentDisplay.find(
      (content: ContentDisplay): boolean =>
        !content ? false : content.id === targetColumnName
    )?.width;
    return width ? width : defaultWidth;
  }
};
