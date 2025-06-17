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
