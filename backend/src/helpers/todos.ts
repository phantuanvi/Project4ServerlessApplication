import { TodosAccess } from './todosAcess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'

// TODO: Implement businessLogic
const logger = createLogger('TodosAccess')
const todosAccess = new TodosAccess()

export async function createTodo(
  userId: string,
  todo: CreateTodoRequest
): Promise<TodoItem> {
  logger.info('Call function createTodo')
  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()
  const done = false

  return await todosAccess.createTodo({
    userId,
    todoId,
    createdAt,
    done,
    ...todo
  })
}

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  logger.info('Call function getTodosForUser')
  return await todosAccess.getTodosForUSer(userId)
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updatedTodo: UpdateTodoRequest
): Promise<TodoItem> {
  logger.info('Call function updateTodo')
  return await todosAccess.updateTodo(userId, todoId, updatedTodo)
}

export async function deleteTodo(
  userId: string,
  todoId: string
): Promise<TodoItem> {
  logger.info('Call function deleteTodo')
  return await todosAccess.deleteTodo(userId, todoId)
}

export async function createAttachmentPresignedUrl(
  userId: string,
  todoId: string
): Promise<String> {
  logger.info('Call function createAttachmentPresignedUrl')
  const uploadUrl = todosAccess.getUploadUrl(todoId, userId)
  return uploadUrl
}
