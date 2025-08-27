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

import {
  createContext,
  useContext,
  type ReactNode,
  useState,
  type Context,
  type SetStateAction,
  type Dispatch
} from 'react';

export interface AwsContextType {
  accountId: string | undefined;
  setAccountId: (id: string) => void;
}

const AwsContext: Context<AwsContextType | undefined> = createContext<
  AwsContextType | undefined
>(undefined);

interface AwsProviderProps {
  children: ReactNode;
  initialAccountId?: string;
}

export function AwsProvider({
  children,
  initialAccountId
}: AwsProviderProps): React.JSX.Element {
  const [accountId, setAccountId]: [
    string | undefined,
    Dispatch<SetStateAction<string | undefined>>
  ] = useState<string | undefined>(initialAccountId);

  const value: AwsContextType = {
    accountId,
    setAccountId
  };

  return <AwsContext.Provider value={value}>{children}</AwsContext.Provider>;
}

export function useAws(): AwsContextType {
  const context: AwsContextType | undefined = useContext(AwsContext);
  if (context === undefined) {
    throw new Error('useAws must be used within an AwsProvider');
  }
  return context;
}
