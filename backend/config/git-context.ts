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

import path from 'path';
import gitBranch from 'git-branch';
import fs from 'fs';

export interface GitContext {
  currentGitBranch: string;
  appStackName: string;
}

/**
 * gets branch name and repository name from Git configuration
 * returns branch name, repo name, and app stack name
 */
export function getGitContext(): GitContext {
  const defaultNameIfGitIsMissing: string = 'dev';

  function findDirUp(directoryName: string): string {
    let cwd: string = process.cwd();
    // while not the file system root (linux & windows)
    while (!(cwd === '/' || cwd === 'C:\\')) {
      const directories: Array<string> = fs.readdirSync(cwd);
      if (
        directories.filter((dir: string): boolean => dir === directoryName)
          .length > 0
      ) {
        return cwd;
      } else {
        cwd = path.join(cwd, '../');
      }
    }
    console.log('GetContext: No .git parent directory found.');
    return '';
  }

  const gitDirectory: string = findDirUp('.git');
  let appStackName: string = '';
  let currentGitBranch: string = '';
  if (process.env.GITHUB_PULL_REQUEST_SOURCE_BRANCH) {
    currentGitBranch = process.env.GITHUB_PULL_REQUEST_SOURCE_BRANCH;
    appStackName = currentGitBranch.replace(/[^\w\s]/gi, '-');
  } else if (gitDirectory) {
    currentGitBranch = gitBranch.sync(gitDirectory);
    appStackName = currentGitBranch.replace(/[^\w\s]/gi, '-');
  } else {
    appStackName = defaultNameIfGitIsMissing;
    currentGitBranch = appStackName;
  }
  return {
    currentGitBranch,
    appStackName
  };
}
