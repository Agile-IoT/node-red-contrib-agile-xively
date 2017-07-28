/*******************************************************************************
 *Copyright (C) 2017 FBK.
 *All rights reserved. This program and the accompanying materials
 *are made available under the terms of the Eclipse Public License v1.0
 *which accompanies this distribution, and is available at
 *http://www.eclipse.org/legal/epl-v10.html
 *
 *Contributors:
 *    FBK - initial API and implementation
 ******************************************************************************/
module.exports = function(RED) {
    function XivelyConfigNode(config) {
        RED.nodes.createNode(this,config);
        this.apikey = config.apikey;
        this.feedid = config.feedid;
    }
    RED.nodes.registerType("xively-config",XivelyConfigNode);
}
