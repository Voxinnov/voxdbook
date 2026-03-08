import 'package:flutter/material.dart';
import '../models/todo_model.dart';
import '../services/todo_service.dart';

class TodoProvider with ChangeNotifier {
  List<TodoModel> _todos = [];
  bool _isLoading = false;

  List<TodoModel> get todos => _todos;
  bool get isLoading => _isLoading;

  Future<void> fetchTodos() async {
    _isLoading = true;
    notifyListeners();
    try {
      _todos = await TodoService.getTodos();
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addTodo(TodoModel todo) async {
    try {
      await TodoService.createTodo(todo);
      await fetchTodos();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateTodo(int id, TodoModel todo) async {
    try {
      await TodoService.updateTodo(id, todo);
      await fetchTodos();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteTodo(int id) async {
    try {
      await TodoService.deleteTodo(id);
      await fetchTodos();
    } catch (e) {
      rethrow;
    }
  }
}
