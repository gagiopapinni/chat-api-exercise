
const express = require('express'),
      mongodb = require('mongodb'),
      assert = require('assert'),

      MongoClient = mongodb.MongoClient,
      ObjectID = mongodb.ObjectID,

      app = express(),

      isStr = (s)=>typeof s === 'string';

require('dotenv').config();

let db = null;
class ClientError extends Error{}
class ServerError extends Error{}

app.use(express.json(),
        function (err,req,res,next){
           next( new ClientError("bad JSON format") );
        },
        function (req,res,next){
           req.db = db; 
           next();                
        }
);

app.post("/users/add",async function (req,res,next){

     const username = req.body.username;
     try{

       assert.ok(username, "missing argument");
       assert.ok(isStr(username), "bad argument type");
       assert.ok(username.length <= 15,"username length exceeded");

     }catch(e){
       return next(new ClientError(e.message)); 
     }


     let user_id;
     try{
       const user = {
         username: username,
         created_at: Math.floor(Date.now()/1000)
       }
     
       const ack = await req.db.collection("users").insertOne(user);
       assert.ok(ack.insertedCount === 1);
       user_id = ack.insertedId;
     }catch(e){
       return next(new ServerError("server error"));  
     }

     res.status(200).send({user_id:user_id});

});

app.post("/chats/add",async function (req,res,next){
     const name = req.body.name, 
           users = [];
     try{
       assert.ok(name && req.body.users, "missing argument");
       assert.ok(isStr(name) && Array.isArray(req.body.users), "bad argument type");
       assert.ok(name.length <= 15, "name length exceeded");

       const tmp_users = [];
       for(let u of req.body.users)
         if(!tmp_users.includes(u)){
            assert.ok(isStr(u), "bad argument type");   
            assert.ok(ObjectID.isValid(u), "invalid user id");           
            tmp_users.push(u);
            users.push(ObjectID(u));
         }
    
       assert.ok(users.length, "users not defined");
     }catch(e){
       return next(new ClientError(e.message));  
     }


     let available_users_count;
     try{
       available_users_count = await req.db.collection("users")
                                        .find({_id:{$in:users} },{projection:{_id:1}})
                                        .count();
     }catch(e){
       return next(new ServerError("server error"));
     }

     try{
       assert.ok(available_users_count === users.length, "specified user does not exist");
     }catch(e){
       return next(new ClientError(e.message));  
     }

     let chat_id;
     try{
       const chat = {
         name: name,
         users: users,
         created_at: Math.floor(Date.now()/1000),
         messages:[],
         last_message_time: 0
       }

       const ack = await req.db.collection("chats").insertOne(chat);
       assert.ok(ack.insertedCount === 1); 
       chat_id = ack.insertedId; 
     }catch(e){
       return next(new ServerError("server error"));
     }

     res.status(200).send({chat_id:chat_id});

});

app.post("/messages/add",async function (req,res,next){

     const chat = req.body.chat,
           author = req.body.author,
           text = req.body.text;
     try{
       assert.ok(chat && author && text,"missing argument"); 
       assert.ok(isStr(chat) && isStr(author) && isStr(text),"bad argument type");
       assert.ok(text.length<=1000,"text length exceeded");
       assert.ok(ObjectID.isValid(chat) && ObjectID.isValid(author), "invalid id");
     }catch(e){
       return next(new ClientError(e.message)); 
     }

     const chat_id = ObjectID(chat),
           author_id = ObjectID(author);
     
     let chat_exists, author_exists;
     try{
       const ops = {projection:{_id:1}};
       chat_exists = await req.db.collection("chats").findOne({_id:chat_id},ops);
       author_exists = await req.db.collection("chats").findOne({_id:chat_id, users:author_id},ops);
     }catch(e){
       return next(new ServerError("server error")); 
     }

     try{
       assert.ok(chat_exists,"chat does not exist");
       assert.ok(author_exists,"author is not a member of this chat");
     }catch(e){
       return next(new ClientError(e.message)); 
     }


     const message_id = ObjectID();
     try{
       const message = {
         _id: message_id,
         author: author_id,
         text: text,
         created_at: Math.floor(Date.now()/1000)
       }

       const ack = await req.db.collection("chats")
                               .updateOne({ 
                                             _id:chat_id
                                          },
                                          {   
                                             $push:{messages: message},
                                             $set:{last_message_time: message.created_at}
                                          });

       assert.ok(ack.matchedCount && ack.modifiedCount);
     }catch(e){
       return next(new ServerError("server error")); 
     }

     res.status(200).send({message_id: message_id});

});

app.post("/chats/get",async function (req,res,next){
     const user = req.body.user;
     try{
       assert.ok(user,"missing argument"); 
       assert.ok(isStr(user),"bad argument type");
       assert.ok(ObjectID.isValid(user), "invalid id");
     }catch(e){
       return next(new ClientError(e.message)); 
     }
  
     const user_id = ObjectID(user);

     let user_exists;
     try{
       user_exists = await req.db.collection("users").findOne({_id:user_id },{projection:{_id:1}});
     }catch(e){
       return next(new ServerError("server error"));
     }

     try{      
       assert.ok(user_exists, "specified user does not exist");
     }catch(e){
       return next(new ClientError(e.message)); 
     }

     let chats;
     try{
       await req.db.collection("chats").createIndex({ last_message_time : 1 });
       chats = await req.db.collection("chats")
                           .find({users:user_id },{ projection:{messages:0, last_message_time:0}}) 
                           .sort({last_message_time:-1})
                           .toArray();
     }catch(e){
       return next(new ServerError("server error"));
     }

     for(let chat of chats){
       chat.id = chat._id;
       delete chat._id;
     }

     res.status(200).send(chats);
});

app.post("/messages/get",async function (req,res,next){
     const chat = req.body.chat;
     try{
       assert.ok(chat,"missing argument"); 
       assert.ok(isStr(chat),"bad argument type");
       assert.ok(ObjectID.isValid(chat), "invalid id");
     }catch(e){
       return next(new ClientError(e.message)); 
     }

     const chat_id = ObjectID(chat);

     let chat_doc;
     try{
       chat_doc = await req.db.collection("chats").findOne({_id:chat_id},{projection:{_id:1, messages:1}});
     }catch(e){
       return next(new ServerError("server error")); 
     }

     try{
       assert.ok(chat_doc,"chat does not exist");
     }catch(e){
       return next(new ClientError(e.message)); 
     }

     const messages = chat_doc.messages;

     for(let msg of messages){
       msg.chat = chat;
       msg.id = msg._id;
       delete msg._id;
     }

     res.status(200).send(messages);
     
});

app.use(function (err,req,res,next){
    let code = 500;
    if(err instanceof ClientError) code = 400;

    res.status(code).send({error:{ status:code, message:err.message }});
});

app.use(function (req,res,next){
    res.status(404).send({error:{ text:"not found"}});
});

;(async function(){
  const client = new MongoClient(process.env.MONGOHQ_URL,{useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    app.listen(process.env.PORT);
    console.log("Running on port "+ process.env.PORT);
  } catch (err) {
    console.log(err.stack);
  }
 
}())










