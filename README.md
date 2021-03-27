# node-website-watcher

Framework for watching websites for certain conditions and sending alerts on Discord

## getting started

- Copy the example config and edit it: `cp config.example.json config.json`

```bash
npm install
```

## developing

```bash
npm install
npm run start
```

To build, run:

```bash
npm run build
```

## making the program a system service that runs on startup

```bash
SERVICE_NAME=node-website-watcher
WHOAMI=$(whoami)
GROUP=$WHOAMI

echo "
[Unit]
Description=$SERVICE_NAME

[Service]
User=$WHOAMI
Group=$GROUP
Restart=always
ExecStart=/usr/local/bin/npm --prefix $PWD run start:prod

[Install]
WantedBy=default.target
" | sudo tee /etc/systemd/system/$SERVICE_NAME.service  > /dev/null

sudo systemctl stop $SERVICE_NAME
sudo systemctl disable $SERVICE_NAME
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME
sudo systemctl status $SERVICE_NAME
```
