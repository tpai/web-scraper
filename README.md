Web Scraper
===

You can use this service to schedule a time to scrap part of website, and send email to yourself.

## Prerequisite

In ordre to use gmail smtp service, you have to enable less secure apps [here](https://myaccount.google.com/lesssecureapps), or you can not send email properly.

## Usage

Define env variables

```
cp .env.example .env
```

Launch service in local

```
docker-compose up
```

## Development

Execute app in dev mode

```
yarn && yarn dev
```

## Deployment

You can run deploy via Kubernetes, but make sure `.env` is well-defined.

```
yarn deploy
```
