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
   "_id":{
      "$oid":"5f1972d2b2e5a91a01d75159"
   },
   "username":"Mary",
   "created_at":{
      "$numberInt":"1595503314"
   }
}]
```
_example "chats":_
```
[{
   "_id":ObjectId(5f1973d9b2e5a91a01d7515a"),
   "name":"Mary-Andrew",
   "users":[
            ObjectId("5f197276b2e5a91a01d75157"),     
            ObjectId("5f1972d2b2e5a91a01d75159")
           ],
   "created_at": 1595503577,
   "messages":[{
                 "_id":ObjectId("5f197aa9b2e5a91a01d75163"),
                 "author":ObjectId("5f197276b2e5a91a01d75157"),
                 "text":"How is Boris doing, is he at home?",
                 "created_at":1595505321
               },
               {
                 "_id":ObjectId("5f197b2cb2e5a91a01d75164"),
                 "author":ObjectId("5f1972d2b2e5a91a01d75159"),
                 "text":"Shame on you 3 times, he has departed 2 hours ago",
                 "created_at":1595505452
               }],
   "last_message_time":1595505452
}]
```
