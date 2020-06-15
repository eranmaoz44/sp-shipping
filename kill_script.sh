#!/bin/bash

kill `cat nohup.out | grep 'Listening at:' | tail -1 | awk 'END {print $NF}' | tr -d '()'`

