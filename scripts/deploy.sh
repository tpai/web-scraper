#!/usr/bin/env bash

REPO=$(dirname $0)/..

source $REPO/.env

if ! which envsubst &> /dev/null; then
  curl -L https://github.com/a8m/envsubst/releases/download/v1.2.0/envsubst-`uname -s`-`uname -m` -o envsubst
  chmod +x envsubst
  sudo mv envsubst /usr/local/bin
fi

# define k8s secrets and configs
GMAIL_USER_BASE64="$(echo -n $GMAIL_USER | base64)" \
GMAIL_PASSWORD_BASE64="$(echo -n $GMAIL_PASSWORD | base64)" \
  envsubst < $REPO/k8s/app-secrets.yml.tmpl > $REPO/k8s/app-secrets.yml

PAGE_URL="\"$PAGE_URL\"" \
PAGE_SELECTOR="\"$PAGE_SELECTOR\"" \
MAIL_SUBJECT="\"$MAIL_SUBJECT\"" \
MAIL_SENDER_NAME="\"$MAIL_SENDER_NAME\"" \
HEALTH_CHECK_URL="\"$HEALTH_CHECK_URL\"" \
  envsubst < $REPO/k8s/app-configmaps.yml.tmpl > $REPO/k8s/app-configmaps.yml

# create namespace
kubectl get ns | grep web-scraper
if [ $? == 1 ]; then
  kubectl create ns web-scraper
fi

# apply k8s deployment
kubectl apply -f $REPO/k8s
