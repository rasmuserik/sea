if [ ! -e node_modules/.bin/live-server ]; then npm install --save-dev live-server eslint uglify-js-harmony; fi

./node_modules/.bin/live-server --no-browser --ignore=node_modules &
echo $! > .pid-live-server

(sleep 3; touch sea.js) &
while inotifywait -e modify,close_write,move_self -q *.js
do 
  kill `cat .pid`
  sleep 0.1
# DIREAPE_DEV=true node sea.js test server $@ &
  ./node_modules/.bin/electron .

  echo $! > .pid
  sleep 3
done

