import * as AWS from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk')
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodosAccess')

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE
  ) {}

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    logger.info(`create todoId: ${todo.todoId}`)
    let params = {
      TableName: this.todosTable,
      Item: todo
    }
    await this.docClient.put(params).promise()
    return todo as TodoItem
  }

  async getTodosForUSer(userId: string): Promise<TodoItem[]> {
    logger.info(`get todos for userId: ${userId}`)
    let params = {
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }
    const result = await this.docClient.query(params).promise()
    return result.Items as TodoItem[]
  }

  async updateTodo(
    userId: string,
    todoId: string,
    todoUpdate: TodoUpdate
  ): Promise<TodoItem> {
    logger.info(`update TodoId: ${todoId}, userId: ${userId}`)
    let params = {
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: 'set #name = :name, #dueDate = :dueDate, #done = :done',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#dueDate': 'dueDate',
        '#done': 'done'
      },
      ExpressionAttributeValues: {
        ':name': todoUpdate.name,
        ':dueDate': todoUpdate.dueDate,
        ':done': todoUpdate.done
      },
      ReturnValues: 'ALL_NEW'
    }
    const result = await this.docClient.update(params).promise()
    return result.Attributes as TodoItem
  }

  async deleteTodo(userId: string, todoId: string): Promise<TodoItem> {
    logger.info(`delete TodoId: ${todoId}, userId: ${userId}`)
    let params = {
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      }
    }
    const result = await this.docClient.delete(params).promise()
    return result.Attributes as TodoItem
  }
}

function createDynamoDBClient() {
  return new XAWS.DynamoDB.DocumentClient()
}
