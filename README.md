# chat-api-exercise
### How To Run

A .env file with following content is needed to run the server:  
```
PORT=9000  
MONGOHQ_URL="<URL>"   
DB_NAME="<DB>"
  ```
Where \<URL\> is a string, containing a MongoDb URL,  
and \<DB\> - a string, containing the name of your database

Once .env is created, open terminal and run the following, to start the server:
```
$ npm install  
$ node index.js
```
Once the server is up, the following line will appear:
```
Running on port 9000
```
### Database Structure

The database consists of two collections, namely "users" and "chats".  
_example "users":_
```
[{
   "_id":ObjectId("5f1972acb2e5a91a01d75158"),
   "username":"Andrew",
   "created_at":1595503276
},
{ 
   "_id":ObjectId("5f1972d2b2e5a91a01d75159"),
   "username":"Mary",
   "created_at":1595503314
}]
```
_example "chats":_
```
[{
   "_id":ObjectId(5f1973d9b2e5a91a01d7515a"),
   "name":"Mary-Andrew",
   "users":[
            ObjectId("5f1972acb2e5a91a01d75158"),     
            ObjectId("5f1972d2b2e5a91a01d75159")
           ],
   "created_at": 1595503577,
   "messages":[{
                 "_id":ObjectId("5f197aa9b2e5a91a01d75163"),
                 "author":ObjectId("5f1972acb2e5a91a01d75158"),
                 "text":"His english is superb, dont you think?",
                 "created_at":1595505321
               },
               {
                 "_id":ObjectId("5f197b2cb2e5a91a01d75164"),
                 "author":ObjectId("5f1972d2b2e5a91a01d75159"),
                 "text":"Indeed!",
                 "created_at":1595505452
               }],
   "last_message_time":1595505452
}]
```
### Api Overview

* "/users/add"  
   Registers a new user and returns his id.  
   Examples:  
   ```
   $ curl --header "Content-Type: application/json" \
          --request POST \
          --data '{"username": "Andrew"}' \
          http://localhost:9000/users/add
          
   {"user_id":"5f19bf498db07629cc66cee6"}
   ```
   ```
   $ curl --header "Content-Type: application/json" \
          --request POST \
          --data '{"username": ""}' \
          http://localhost:9000/users/add
          
   {"error":{"status":400,"message":"missing argument"}}  
   ```
* "/chats/add"  
   Registers a new chat and return it's id.  
   One or more users must be defined in "users" argument    
   as an array of ids.  
   Chat's name must be defined in "name" argument.  
   Examples:  
   ```
   $ curl --header "Content-Type: application/json" \
          --request POST \
          --data '{"name": "Lonely", "users": ["5f19bf498db07629cc66cee6"]}' \
          http://localhost:9000/chats/add
          
   {"chat_id":"5f19c2228db07629cc66cee7"}
   ```
   ```
   $ curl --header "Content-Type: application/json" \
          --request POST \
          --data '{"name": "Looooooooooonely", "users": ["5f19bf498db07629cc66cee6"]}' \
          http://localhost:9000/chats/add
          
   {"error":{"status":400,"message":"name length exceeded"}}
   ```
* "/messages/add"    
   Adds a new message to a specified chat.  
   An author id must be defined in "author" argument,  
   chat id in "chat", and message text in "text".  
   There is a 1000 character limit for text length.  
   Examples:  
   ```
   $ curl --header "Content-Type: application/json" \
          --request POST \
          --data '{"chat": "5f19c2228db07629cc66cee7",
                   "author": "5f19bf498db07629cc66cee6",
                   "text": "Once upon a time..."}'\
          http://localhost:9000/messages/add
          
   {"message_id":"5f19c5348db07629cc66cee8"}
   ```
   ```
   $ curl --header "Content-Type: application/json" \
          --request POST \
          --data '{"chat": "5f19c2228db07629cc66cee7",
                   "author": "5f157323591e7f1e4eacf1bc",
                   "text": "No way to send this!"}' \
          http://localhost:9000/messages/add
          
   {"error":{"status":400,"message":"author is not a member of this chat"}}
   ```
* "/chats/get"
   Returns all chats of a specified user.
   ```
   $ curl --header "Content-Type: application/json" \
          --request POST \
          --data '{"user": "5f19bf498db07629cc66cee6"}' \
          http://localhost:9000/chats/get
         
   [{
      "name":"Lonely",
      "users":["5f19bf498db07629cc66cee6"],
      "created_at":1595523618,
      "id":"5f19c2228db07629cc66cee7"
   }]
   ```
   ```
   $ curl --header "Content-Type: application/json" \
          --request POST \
          --data '{"user":123}' \
          http://localhost:9000/chats/get
         
   {"error":{"status":400,"message":"bad argument type"}}
   ```
   
* "/messages/get"  
   Returns all messages in a specified chat.  
   ```
   $ curl --header "Content-Type: application/json" \
          --request POST \
          --data '{"chat": "5f19c2228db07629cc66cee7"}' \
          http://localhost:9000/messages/get
          
   [{
      "author":"5f19bf498db07629cc66cee6",
      "text":"Once upon a time...",
      "created_at":1595524404,
      "chat":"5f19c2228db07629cc66cee7",
      "id":"5f19c5348db07629cc66cee8"
   }]
   ```
 
