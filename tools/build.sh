#!/bin/bash
echo "/*"
cat ../LICENSE.txt
echo "
*/"
echo " (function() {
  if (!JSON && JSON.parseJSON && JSON.stringify) {
    throw new Error(\"Can not init jStorage\");
  }"
cat ../src/Storage.js
cat ../src/Storage.Request.js
cat ../src/Storage.Prototype.js
cat ../src/Storage.LocalStorage.js
cat ../src/Storage.WebSQL.js
cat ../src/Storage.IndexedDB.js
echo "})();"