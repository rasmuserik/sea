(sleep 3; touch electron/main.js) &
while inotifywait -e modify,close_write,move_self -q dist.js electron/*.js
do 
  killall electron
  sleep 0.5 
  npm run electron &
  sleep 2
done

