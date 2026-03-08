import 'package:flutter/material.dart';
import '../models/task_model.dart';
import '../services/task_service.dart';

class TaskProvider with ChangeNotifier {
  List<TaskModel> _tasks = [];
  bool _isLoading = false;

  List<TaskModel> get tasks => _tasks;
  bool get isLoading => _isLoading;

  Future<void> fetchTasks() async {
    _isLoading = true;
    notifyListeners();
    try {
      _tasks = await TaskService.getTasks();
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addTask(TaskModel task) async {
    try {
      await TaskService.createTask(task);
      await fetchTasks();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateTask(int id, TaskModel task) async {
    try {
      await TaskService.updateTask(id, task);
      await fetchTasks();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteTask(int id) async {
    try {
      await TaskService.deleteTask(id);
      await fetchTasks();
    } catch (e) {
      rethrow;
    }
  }
}
