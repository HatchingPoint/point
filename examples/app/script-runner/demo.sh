#!/usr/bin/env sh
set -e
echo "stdout: starting demo script"
sleep 0.05
echo "stdout: counting"
i=1
while [ "$i" -le 5 ]; do
  echo "stdout: tick $i"
  i=$((i + 1))
  sleep 0.08
done
echo "stderr: incidental message" >&2
echo "stdout: done"
exit 0
