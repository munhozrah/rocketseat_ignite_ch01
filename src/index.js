const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { urlencoded } = require('express');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers
  const user = users.find((u) => u.username === username)
  if (!user)
    return response.status(404).json({ error: "User not found"})
  
  request.user = user
  next()
}

function checksExistsTask(request, response, next) {
  const { id } = request.params
  const user = request.user
  const task = user.todos.find(task => task.id == id)

  if (!task)
    return response.status(404).json({error: "Task not found"})

  request.task = task
  next()
}

function newUser(name, username) {
  return {
    id: uuidv4(),
    username,
    name,
    todos: []
  }
}

function newTask(title, deadline) {
  return { 
    id: uuidv4(),
    title,
    done: false, 
    deadline: new Date(deadline),
    created_at: new Date()
  }
}

app.post('/users', (request, response) => {
  const { name, username } = request.body
  if (users.some(user => user.username == username))
    return response.status(400).json({error: "User already exists"})

  const user = newUser(name, username)
  users.push(user)
  return response.status(201).json(user)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  return response.json(request.user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  user = request.user
  task = newTask(title, deadline)
  user.todos.push(task)
  return response.status(201).json(task)
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTask, (request, response) => {
  const { title, deadline } = request.body
  const task = request.task
  task.title = title
  task.deadline = new Date(deadline)
  return response.status(201).json(task)
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTask, (request, response) => {
  const task = request.task
  task.done = true
  return response.status(201).json(task)
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTask, (request, response) => {
  const task = request.task
  const user = request.user
  user.todos = user.todos.filter(element => element.id !== task.id)
  return response.status(204).send()
});

module.exports = app;