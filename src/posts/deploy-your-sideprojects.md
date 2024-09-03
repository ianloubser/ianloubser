---
layout: post

emoji: 🔨
title: Deploying your sideprojects
date: 2024-08-02
colour: blue-400
tags: 
    - post
    - CI
    - Prototype
    - Golang
modified: 2022-01-09 00:00:00
order: 1
summary: Get real, you probably don't need a super sophisticated deployment workflow for your ideas ;)
---

When you're hacking something together on the side of your dayjob, rarely do you want to take an elaborate and expensive route for hosting it and getting it out there. 
Especially since it will be primarly you accessing it and maybe the odd recruiter checking your portfolio once a year ;) 

In this case I've always been pro just using some cheap VPS hosting at a fixed price and sending your code up there via `scp` (yes, I indeed just suggested being a tech caveman and doing it yourself instead of relying on single command deploy & release tools).

This approach does require some customising and tweaking of your own environment to get multiple side hustles running, let me run through my setup.

I've got a wildcard DNS rule setup for `*.apps.mydomain.com` - this makes it easy to generate a wildcard SSL cert to work for all my apps. For this I'm using [caddyserver](https://caddyserver.com/) to do the reverse-proxy, and automating renewal and generation of LetsEncrypt SSL certs. `nginx` is pretty awesome, but I'm too old to still find the process of maintaing SSL certificates fun & interesting. Here is an example caddyfile:
```nginx
app1.apps.mydomain.com {
    route {
        reverse_proxy localhost:3000
    }
}

app2.apps.mydomain.com {
    route {
        reverse_proxy localhost:5000
    }
}
```

Each app I still need to startup the instance for it in shell using some process manager, my goto is [pm2](https://www.npmjs.com/package/pm2) or [supervisord](http://supervisord.org/)

That's hosting done! I've got my reverse-proxy & SSL certs resolved with a few easy tweaking - and it doesn't cost me any more than my normal VPS, with 0 extra effort to maintain nor any heavy demand on server resources. 
<br/><br/>
Now for deployments - I could do this manually, SSH into the server everytime - `git pull origin main` for latest updates or scp a zip file to extract, rebuild & rerun and then I have an update. Although those are simple enough steps to follow, I'm an engineer, so I'd rather spend 1 week automating something that would've taken me 5min to do manually.
<br/><br/>
For deployments I've setup another virtual host in my caddyfile looking something like this:

```nginx
ci.apps.mydomain.com {

        @apirequests {
            header X-Auth-token super-duper-secret-token-you'll-never-guess
        }

        route {
            reverse_proxy @apirequests localhost:4001
            respond "You don't look like a teapot ?" 418
        }
}
```

Any traffic going to localhost:4001 is handled by my nifty golang server (why golang ? Because it's lightweight and I wanted to work on yet another side-project idea). This golang server gives me the ability to trigger a sequence of tasks & steps to update any app to a specific git commit or monitor it's status. The main route for kicking off a new deployment is the `/deploy` endpoint expecting a post body like:
```json
{
    "project": "app-abc",
    "commit": "033dccaa9799b866e25d3a7423849e70a1e0b5ee"
}
```

As soon as the golang service recieves a request there, it kicks of the deploy process of the specific commit passed in the body. It first looks up the project configuration in the `projects.toml` config file located alongside the golang server binary. There it finds the root project directory where the source code is located and the link to it's github repo to be use for cloning. It then embarks on a journey of steps which would've been equivalent of running the following manually through terminal:

```bash
$ TMP_DIR=$(mktemp -d)
$ pushd $TMP_DIR
$ git clone github.com/{your_git}/{project_config_repo}.git
$ git checkout {commit}
$ sh ./build.sh
$ rm -r ./.git
$ sh ./shutdown.sh
$ mv ./* {project_config_root_path}
$ popd
$ rm -r $TMP_DIR
$ cd {project_config_root_path}
$ sh ./run.sh
$ echo {commit} > {project_config_root_path}/commit_sha
```

<br/>
In my real case the build, shutdown and run steps are customisable through the `projects.toml` file and are essentially any tasks which need to be run in order to setup and run the project for serving some traffic. 

<br/>
The whole deployment process above kicks off in async after the original POST request was received. This means wherever that is initiated from, has no idea what the current state of the deployment is. To resolve this I've added a simple endpoint on my golang server `/info/{project-name}` which gives output about the current live version being served, which it gets from reading the `commit_sha` file in the project root. 
<br/><br/>
Combining all of the above, it was simply a matter of configuring my CI (github actions in this case) to send a POST request on any master merge with the commit SHA, then polling the `/info/*` endpoint until I see the commit SHA matching the one which was sent in the original request and then I know the deployment has been completed :) 
<br/><br/>
Yes I could've saved some time by just using docker, yes there are other ways - but we don't always need to choose that tech stack and solution used by Uber, Google and Facebook just because its industry standard. Your sideproject website serving 10req total every month (if you're lucky) doesn't need Kubernetes, nor AWS nor any of the other fancy things out there. 
<br/>

Here is an example toml file to configure each project:
```toml
[super-duper]
repo = github.com/ianloubser/super-duper-app.git
path = /Users/bitnami/hosting/apps/super-duper-app
shutdown = pm2 stop super
build = npm install && npm build
run = pm2 start super
logs = pm2 logs super --nostream
```