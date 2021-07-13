#!/usr/bin/env bash

REPO=$(dirname $0)/..

source $REPO/.env

if ! which envsubst &> /dev/null; then
  curl -L https://github.com/a8m/envsubst/releases/download/v1.2.0/envsubst-`uname -s`-`uname -m` -o envsubst
  chmod +x envsubst
  sudo mv envsubst /usr/local/bin
fi

# define k8s secrets and configs
export COMMIT_SHA=$(git rev-parse --verify HEAD)
export GMAIL_USER_BASE64="$(echo -n $GMAIL_USER | base64)"
export GMAIL_PASSWORD_BASE64="$(echo -n $GMAIL_PASSWORD | base64)"
export PAGE_URL="\"$PAGE_URL\""
export PAGE_SELECTOR="\"$PAGE_SELECTOR\""
export MAIL_SUBJECT="\"$MAIL_SUBJECT\""
export MAIL_SENDER_NAME="\"$MAIL_SENDER_NAME\""
export HEALTH_CHECK_URL="\"$HEALTH_CHECK_URL\""
export SCHEDULE_TIME="\"$SCHEDULE_TIME\""

envsubst < $REPO/k8s/app-secrets.yml.tmpl > $REPO/k8s/app-secrets.yml
envsubst < $REPO/k8s/app-configmaps.yml.tmpl > $REPO/k8s/app-configmaps.yml
envsubst < $REPO/k8s/app-cronjob.yml.tmpl > $REPO/k8s/app-cronjob.yml
envsubst < $REPO/k8s/app-depl.yml.tmpl > $REPO/k8s/app-depl.yml

if which docker &> /dev/null; then
  # build image and push
  docker build -t tonypai/web-scraper:$COMMIT_SHA .
  docker push tonypai/web-scraper:$COMMIT_SHA

  # create namespace
  kubectl get ns --kubeconfig ~/.kube/lke.yaml | grep web-scraper
  if [ $? == 1 ]; then
    kubectl create ns web-scraper --kubeconfig ~/.kube/lke.yaml
  fi

  # apply k8s deployment
  kubectl apply -f $REPO/k8s --kubeconfig ~/.kube/lke.yaml
else
  echo "Is the docker daemon running?"
fi
