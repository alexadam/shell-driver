#!/bin/sh

cd client
yarn build

rm -rf ../server/client-dist
mkdir ../server/client-dist

cp dist/* ../server/client-dist