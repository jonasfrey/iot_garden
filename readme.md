# CRUD template

Deno · SQLite · Vue 3 · WebSocket

## Quick start

```
mkdir project_name && cd project_name
deno eval "import { f_init_project } from 'jsr:@apn/websersocketgui@{version}/init'; await f_init_project();"
deno task run
```

Open `http://localhost:8000`

## Tasks

- `deno task run` — start the server
- `deno task uninit` — delete database and reset project data


## project structure 
root 
    serverside
        basically all server side code goes here
    localhost
        all data that is accessable on the website client
    
## APN
This project is coded entirely with APN Abstract Prefix Notation. To get a better understanding you can read the paper https://www.techrxiv.org/users/1031649/articles/1391488-abstract-prefix-notation-apn-a-type-encoding-naming-methodology-for-programming?commit=571d0b8647fbee85c242544375a07d5cf4238bef

## for programmers
### native javascript main language
Native Javscript is the main language!!! where ever possible use it!

### shared state
'o_state' is a runtime object that is synchronized between: server-client-db
strictly only use f_v_sync to update data!!!

### performance
it is more important to have a nice and convenient way to write and understand the software than it to be fast 
This application might not be to most performant but it is without question one of the most handy convenient. 


### shared functions
since javascript is used on the client side and on the server side there are many redundancies that can be removed by simply creating a function on the client side and use the same function on the server side.

since client side and server side is mainly programmed in native javascript , all functions that can be shared should be shared. this application already has a perfect example for this by having the data structure models on client side which then are loaded by the server. so all functions that are non sensitive have to be shared.

### communication 
main communication is done by a websocket. http requests should be avoided , instead websocket messages are used. there is also a websocket message function that expects a response. it should be used to replace the 'classical' http fetch. 

### cli 
if a part of the programm can only be executed by calling a binary this can be done but the master scripts should all be in javascript. is required

### cli scripts
each cli script should have a human readable 'normal' text output , but also should output a json.



## Security through obscurity is bad
On first glance this project could be considered insecure. but this is only because it is clearly programmed. A system is not more secure just because it is a mess and the programmer themself do not know what they are doing. so keep in mind to program as clear and simple as possible. You can and must use simple and pragmatic code, it does not make the program insecure!

This project exposes many functionalities of the 'server' which is essentaly the computer . The webapplication GUI 'only' serves as a front end for the application. However this can be extended in a way to make it a sturdy and secure webapplication. The fundamentals however are here to give full access to the computer. This is not unsecure, it is just a solid base. 
Remember: 
Just because a system is unclear and obfuscated, it does not mean it is secure. security through obscurity is not good. 


## Project example templates

the current workspace holds a complete template / boilerplate / preset  for a full front and backend application including a GUI. it mostly written in native javascript. it seems like a  webapplication but is not a 'website' or 'webapp' in the classical sense. it simply makes use of the browser to make use of the convenient javascript/html/css GUI possibilities. it can be extended to any kind of application, for example: 
- Utility — small focused tool (calculator, file renamer, converter)
- Monitoring tool — GPU stats, system health, network traffic
- Dashboard — visual overview of data/metrics
- Admin panel — manage a service or system
- Developer tool / devtool — debugger, profiler, code generator
- Productivity app — notes, task manager, editor
- Automation tool — scripting, scheduling, batch processing
- Creative tool — 3D modeling, image editing, music production
- Communication tool — chat, video, collaboration
- Data viewer / explorer — database browser, log viewer, file inspector. 


## 

[Jonas Immanuel Frey] - 2026

Have Fun !
