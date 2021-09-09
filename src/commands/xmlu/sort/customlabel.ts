/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError, SfdxProject } from '@salesforce/core';

import * as fs from 'fs-extra';
import * as xml2js from 'xml2js';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-xmlu-plugin', 'messages');

export default class Org extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx xmlu:sort:custommetadata -f force-app/main/default/labels/CustomLabel.labels-meta.xml
Custom Label metadata is successfully sorted.
  `,
  ];

  protected static flagsConfig = {
    file: flags.string({
      char: 'f',
      description: messages.getMessage('fileFlagDescription'),
      required: true
    }),
  };

  protected static requiresProject = false;

  public async run(): Promise<void> {
    // Retrieve package path
    const project = await SfdxProject.resolve();

    const targetFilePath = `${project.getPath()}/${this.flags.file}`;
    const exists = await fs.pathExists(targetFilePath);
    if (!exists) {
      throw new SfdxError(messages.getMessage('fileNotFoundErrorMessage'));
    }    

    const labelFile = await fs.readFile(targetFilePath, 'UTF-8');
    const xmlParser = new xml2js.Parser();
    const labelObject = await xmlParser.parseStringPromise(labelFile);
    
    labelObject.CustomLabels.labels.sort((label1, label2) => {
      return label1.fullName[0] < label2.fullName[0] ? -1 : 1;
    });

    const xmlBuilder = new xml2js.Builder({ renderOpts: { 'pretty': true, 'indent': '    ', 'newline': '\n' } });
    const xmlFile = xmlBuilder.buildObject(labelObject);
    
    await fs.writeFile(targetFilePath, xmlFile);

    this.ux.log('Custom Label metadata is successfully sorted.');
  }
}
