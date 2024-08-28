---
layout: post

emoji: 🔨
title: Deploying your sideprojects
date: 2024-08-02
colour: blue-400
tags: 
    - post
    - Draft
    - CI
    - Sideproject
    - Golang
modified: 2022-01-09 00:00:00
order: 1
summary: Get real, you probably don't need a super sophisticated deployment workflow for your ideas ;)
---

I've got a wildcard DNS rule setup for *.apps.mydomain.com - this makes it easy to generate a wildcard SSL cert to work for all my apps.
Next I'm using caddyserver to do the routing/reverse-proxy to each app server as well as make my life easier for all things SSL. nginx is pretty awesome, 
but I'm too old to still find the process of maintaing SSL certificates myself fun & interesting.

That's hosting done! Got my reverse-proxy & SSL certs resolved with a few easy tweaking - and it doesn't cost me any more than my normal VPS costs, with 0 extra effort to maintain nor any heavy demand on server resources.  
<br/>
Now for deployments - I could do this manually, SSH into the server everytime - `git pull origin main` for latest updates, rebuild & rerun and then I have an update. Although it's simple enough to follow, remember I'm an engineer. I'd rather spend 4h automating something that would've taken me 10min to do manually.
<br/>
For this I've setup another virtual host in my caddyfile looking something like this:

```
ci.apps.mydomain.com {

        @apirequests {
            header X-Auth-token super-duper-secret-token-you'll-never-guess
        }

        route {
            reverse_proxy @apirequests localhost:5000
            respond "You don't look like a teapot ?" 418
        }
}
```

This allows me to trigger a sequence of tasks & steps to update any app to a specific git commit. Because any traffic going to localhost:5000/deploy is handled by my nifty golang server (why golang ? Because it's lightweight and I wanted to work on yet another side-project idea). This golang server
merely waits for a call to `/deploy` with a post body something like this:
```json
{
    project: 'app-abc',
    commit: '1251251513513'
}
```

As soon as the golang service recieves that, it kicks of the deploy of the specific commit passed in the body. It first looks up the project in the `projects.toml` config file located alongside the server binary, to find the root server directory where the source code is located and the link to it's github repo to use for cloning. It then embarks on a journey which would've been equivalent of running the following steps manually through shell:

```bash
$ git clone github.com/ianloubser/<app_repo>.git
$ git checkout <commit>
$ sh ./build.sh
$ rm -rf ./.git
$ sh ./shutdown.sh
$ mv ./* <project_path>
$ sh ./run.sh
```

<br/>
The build, shutdown and run steps are customisable through the `projects.toml` file and are essentially any tasks which need to be run in order to setup and run the project to serve some traffic. 

<br/>
The whole deployment process above kicks off in async after the original POST request was received. This means wherever that is initiated from, has no idea what the current state of the deployment is. To resolve this I've added a simple endpoint on my golang server `/info/<project-name>` which gives output about the current live version being served. 

<br/>
Combining all of the above, it was simply a matter of configuring my CI (github actions in this case) to send a POST request on any master merge with the commit SHA, then polling the `/info/*` endpoint until I see the commit SHA matching the one which was sent in the original request and then I know deployment has been completed :) 

<br/>
Yes I could've saved some time by just using docker, yes there are other ways - but we don't always need to choose that tech stack and solution used by Uber, Google and Facebook just because its industry standard. Your sideproject website serving 10req total every month (if you're lucky) doesn't need Kubernetes, nor AWS nor any of the other fancy things out there. 
<br/>

Example toml file:
```
[super-duper]
repo = github.com/ianloubser/super-duper-app.git
path = /Users/bitnami/hosting/apps/super-duper-app
shutdown = pm2 stop super
build = npm install && npm build
run = pm2 start super
logs = pm2 logs super --nostream
```