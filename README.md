<!--
# Copyright (C) 2017 FBK.
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which accompanies this distribution, and is available at
# http://www.eclipse.org/legal/epl-v10.html
# 
# Contributors:
#     FBK - initial API and implementation
-->

This is a node, to push data into the Xively cloud. The node can be configured in the following ways.

(a) Adding an API-Key and a Feed ID along with the desired variable name in the config node.
(b) Creating a product on Xively and adding the following to the Node-Red settings file:
xivelymaster: Xively Master Key (SETTINGS -> Master Keys)
xivelyserial: Serial Number (MANAGE -> Product Batch)
xivelyproduct: Product ID (MANAGE -> Product Batch)
xivelysecret: Product Secret (MANAGE -> Product Batch)
