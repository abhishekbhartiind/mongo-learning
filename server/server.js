require('./config/config');
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');  
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate')

const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());



app.post('/todos',(req,res) => {
    var todo = new Todo({
        text:req.body.text
    });
    todo.save().then((doc) =>{
        res.send(doc);
    },(err) =>{
        res.status(400).send(err);

    });
});

app.get('/todos', (req,res) => {
    Todo.find().then((todos) =>{
        res.status(200).send({todos});
    },(e) => {
        res.status(400).send(e);
    });
}); 

app.get('/todos/:id', (req,res) =>{
    var id = req.params.id;
    if(!ObjectID.isValid(id)){
        return res.status(404).send('NotFound');
    }

    Todo.findById(id).then((todo) =>{
        if(!todo){
            return res.status(404).send();
        }
        res.send({todo});
    }).catch((e) =>{
        res.status(400).send();
    });
    
});

app.delete('/todos/:id',(req,res) =>{
    //get the id
    var id = req.params.id;

    //validate the id -> not valid return 404
    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    Todo.findByIdAndRemove(id).then((todo) =>{
        if(!todo){
            return res.status(404).send();
        }
        res.send({todo});
    }).catch((e) => res.status(400).send());
});

app.patch('/todos/:id',(req,res) =>{
    var id = req.params.id;
    var body = _.pick(req.body, ['text','completed']);
    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }
    if(_.isBoolean(body.completed) && body.completed){
        // if its boolean and true
        body.completedAt = new Date().getTime();
    }else{
        // if not bolean and not true
        body.completed = false;
        body.completedAt = null;
    }
    Todo.findByIdAndUpdate(id,{$set: body}, {new:true}).then((todo) =>{
        if(!todo){
            res.status(404).send();
        }
        res.send({todo}); 

    }).catch((err) => {
        res.status(400).send();
    });
});

app.post('/users', (req,res) =>{
    var body = _.pick(req.body, ['email','password']);
    var user = new User(body);


    user.save().then(() =>{
        return user.generateAuthToken();
        // res.send(user);
    }).then((token) =>  {
        res.header('x-auth', token).send(user);
    }).catch((err) => {
        res.status(400).send();  
    })
});



app.get('/users/me', authenticate, (req,res) =>{
    res.send(req.user);
});

app.listen('3000', () => console.log('Started on port 3000'));

module.exports = {app};