IMAGE_NAME    := jira-api
REGISTRY      := polygontechxyz
TAG           := v1.2.2

.PHONY: build tag push all

all: build tag push

build:
	docker build -t $(IMAGE_NAME) -f ./Dockerfile.api .

tag:
	docker tag $(IMAGE_NAME):latest $(REGISTRY)/$(IMAGE_NAME):$(TAG)

push:
	docker push $(REGISTRY)/$(IMAGE_NAME):$(TAG)
